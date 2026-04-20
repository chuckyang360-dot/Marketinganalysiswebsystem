"""Segment video generation: RenderJob + SegmentScript script_json.video_render updates.

资产参考图（Gemini/Mock）由 asset_image_service 写入本地文件并更新 Character/Scene/ProductAsset.image_url，
不创建 short_drama_render_jobs 行；RenderJob 仅用于分段视频与成片合并。
"""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from ...config import settings
from ...database import SessionLocal
from ..exceptions import ShortDramaInvalidSegmentVideoError, ShortDramaVideoInputError
from ..models import RenderJob, SegmentScriptRecord, ShortDramaProject
from ..providers.xai_video_client import effective_xai_video_model
from ..providers.xai_video_provider import SegmentVideoProvider, build_xai_video_provider
from ..schemas.segment import SegmentScriptSchema
from ..utils.enums import ProjectStatus, RenderJobStatus, RenderTargetType
from ..utils.segment_mp4_validate import validate_segment_mp4_path
from ..utils.video_prompt_builder import build_segment_video_plan
from ..utils.video_storage import (
    absolutize_media_url_for_provider,
    local_path_from_public_video_url,
    save_segment_video_bytes,
)
from ..utils.xai_reference_image import (
    build_xai_ready_reference_image,
    local_path_from_xai_ready_public_url,
)
from .read_models import all_segment_scripts_have_video, list_asset_rows, list_segment_scripts
from .workflow_orchestrator import orchestrator

logger = logging.getLogger(__name__)


@dataclass
class SegmentVideoAttemptResult:
    segment_id: str
    ok: bool
    video_url: str | None = None
    render_job_id: int | None = None
    error_message: str | None = None


@dataclass
class VideoBatchResult:
    project_id: int
    segments_attempted: int = 0
    segments_succeeded: int = 0
    results: list[SegmentVideoAttemptResult] = field(default_factory=list)
    errors: list[dict[str, Any]] = field(default_factory=list)


class RenderExecutorService:
    def __init__(self, provider: SegmentVideoProvider | None = None):
        self._provider = provider if provider is not None else build_xai_video_provider()
        logger.info("[VIDEO_PROVIDER] Using provider: %s", self._provider.__class__.__name__)

    def _max_workers(self) -> int:
        return max(1, int(settings.SHORT_DRAMA_VIDEO_MAX_CONCURRENT))

    def _provider_label(self) -> str:
        return "mock" if settings.SHORT_DRAMA_USE_MOCK_VIDEO_PROVIDER else "xai"

    def _process_segment_core(
        self,
        db: Session,
        project_id: int,
        rec: SegmentScriptRecord,
        *,
        chars: list,
        scenes: list,
        products: list,
        project_ar: str | None,
    ) -> SegmentVideoAttemptResult:
        segment_id = rec.segment_id
        job: RenderJob | None = None
        trace: dict[str, Any] = {
            "reference_prepare_ok": False,
            "reference_check_ok": False,
            "duration_check_ok": False,
            "generation_start_ok": False,
            "poll_completed": False,
            "download_ok": False,
            "save_ok": False,
            "writeback_ok": False,
            "final_video_url": "",
            "request_id": "",
            "final_error": "",
        }
        try:
            seg = SegmentScriptSchema.model_validate(rec.script_json)
            plan = build_segment_video_plan(
                seg,
                characters=chars,
                scenes=scenes,
                products=products,
                project_aspect_ratio=project_ar,
            )
            logger.info(
                "[SEGMENT_REFERENCE_SOURCE_URLS] project_id=%s segment_id=%s urls=%s",
                project_id,
                segment_id,
                plan.selected_reference_image_urls,
            )
            abs_refs = [absolutize_media_url_for_provider(u) for u in plan.selected_reference_image_urls]
            ref_for_api: list[str] = []
            for src_abs in abs_refs:
                logger.info(
                    "[XAI_REFERENCE_IMAGE_PREPARE_START] project_id=%s segment_id=%s source_url=%s",
                    project_id,
                    segment_id,
                    src_abs,
                )
                try:
                    pub_rel = build_xai_ready_reference_image(project_id, src_abs)
                except Exception as e:
                    logger.error(
                        "[XAI_REFERENCE_IMAGE_PREPARE_FAIL] project_id=%s segment_id=%s source_url=%s exception_class=%s err=%s",
                        project_id,
                        segment_id,
                        src_abs,
                        type(e).__name__,
                        str(e),
                    )
                    raise
                final_u = absolutize_media_url_for_provider(pub_rel)
                ref_for_api.append(final_u)
                xai_local = local_path_from_xai_ready_public_url(pub_rel)
                xai_ok = xai_local.is_file()
                xai_sz = xai_local.stat().st_size if xai_ok else 0
                logger.info(
                    "[XAI_REFERENCE_IMAGE_PREPARE_DONE] project_id=%s segment_id=%s source_url=%s "
                    "output_public_url=%s output_absolute_path=%s file_exists=%s file_size=%s",
                    project_id,
                    segment_id,
                    src_abs,
                    pub_rel,
                    str(xai_local.resolve()),
                    xai_ok,
                    xai_sz,
                )
            trace["reference_prepare_ok"] = True
            logger.info(
                "[XAI_REFERENCE_IMAGE_FINAL_URLS] project_id=%s segment_id=%s urls=%s",
                project_id,
                segment_id,
                ref_for_api,
            )

            job = RenderJob(
                project_id=project_id,
                target_type=RenderTargetType.SEGMENT.value,
                target_id=segment_id,
                provider=self._provider_label(),
                model=effective_xai_video_model(),
                status=RenderJobStatus.QUEUED.value,
                input_payload_json={
                    "prompt_preview": plan.segment_video_prompt[:500],
                    "reference_image_count": len(ref_for_api),
                    "duration_seconds": plan.duration_seconds,
                    "aspect_ratio": plan.aspect_ratio,
                    "resolution": plan.resolution,
                },
            )
            db.add(job)
            db.flush()

            rid = self._provider.submit_reference_segment_video(
                prompt=plan.segment_video_prompt,
                reference_image_urls=ref_for_api,
                duration_seconds=plan.duration_seconds,
                aspect_ratio=plan.aspect_ratio,
                resolution=plan.resolution,
                project_id=project_id,
                segment_id=segment_id,
            )
            trace["reference_check_ok"] = True
            trace["duration_check_ok"] = True
            trace["generation_start_ok"] = True
            trace["request_id"] = rid
            job.provider_request_id = rid
            job.status = RenderJobStatus.RUNNING.value
            db.commit()

            result = self._provider.complete_segment_video(
                request_id=rid,
                project_id=project_id,
                segment_id=segment_id,
                duration_seconds=plan.duration_seconds,
            )
            trace["poll_completed"] = True
            trace["download_ok"] = True
            url = save_segment_video_bytes(
                project_id=project_id,
                segment_id=segment_id,
                data=result.video_bytes,
            )
            trace["save_ok"] = True
            trace["final_video_url"] = url
            disk_path = local_path_from_public_video_url(url)
            try:
                validate_segment_mp4_path(disk_path, segment_id=segment_id)
            except ShortDramaInvalidSegmentVideoError:
                try:
                    disk_path.unlink(missing_ok=True)
                except OSError:
                    pass
                raise
            meta = dict(result.provider_metadata or {})
            job.status = RenderJobStatus.COMPLETED.value
            job.output_url = url
            job.meta_json = meta
            if meta.get("model"):
                job.model = str(meta.get("model"))

            base = dict(rec.script_json) if isinstance(rec.script_json, dict) else {}
            base["video_render"] = {
                "video_url": url,
                "render_job_id": job.id,
                "provider": meta.get("provider", self._provider_label()),
                "model": job.model,
                "provider_request_id": rid,
                "meta": meta,
            }
            logger.info(
                "[SEGMENT_VIDEO_WRITEBACK] project_id=%s segment_id=%s video_url=%s absolute_file_path=%s "
                "file_exists=%s",
                project_id,
                segment_id,
                url,
                str(disk_path.resolve()),
                disk_path.is_file(),
            )
            try:
                rec.script_json = base
                db.add(job)
                db.add(rec)
                db.commit()
                trace["writeback_ok"] = True
            except Exception as e:
                logger.error(
                    "[SEGMENT_VIDEO_WRITEBACK_FAIL] project_id=%s segment_id=%s video_url=%s exception_class=%s err=%s",
                    project_id,
                    segment_id,
                    url,
                    type(e).__name__,
                    str(e),
                )
                raise
            return SegmentVideoAttemptResult(
                segment_id=segment_id,
                ok=True,
                video_url=url,
                render_job_id=job.id,
            )
        except Exception as e:
            err_msg = str(e)
            trace["final_error"] = err_msg
            jid = getattr(job, "id", None) if job is not None else None
            try:
                db.rollback()
            except Exception:
                pass
            if jid:
                try:
                    fj = db.query(RenderJob).filter(RenderJob.id == jid).first()
                    if fj:
                        fj.status = RenderJobStatus.FAILED.value
                        fj.error_message = err_msg
                        db.add(fj)
                        db.commit()
                except Exception:
                    logger.exception(
                        "RENDER_JOB_FAIL_PERSIST project_id=%s segment_id=%s render_job_id=%s",
                        project_id,
                        segment_id,
                        jid,
                    )
            logger.warning(
                "SEGMENT_VIDEO_FAIL project_id=%s segment_id=%s render_job_id=%s provider=%s model=%s "
                "request_id=%s err=%s",
                project_id,
                segment_id,
                jid,
                self._provider_label(),
                effective_xai_video_model(),
                getattr(job, "provider_request_id", None) if job else None,
                err_msg,
            )
            return SegmentVideoAttemptResult(
                segment_id=segment_id,
                ok=False,
                render_job_id=jid,
                error_message=err_msg,
            )
        finally:
            logger.info(
                "[SEGMENT_VIDEO_TRACE_SUMMARY] project_id=%s segment_id=%s reference_prepare_ok=%s "
                "reference_check_ok=%s duration_check_ok=%s generation_start_ok=%s poll_completed=%s "
                "download_ok=%s save_ok=%s writeback_ok=%s final_video_url=%s request_id=%s final_error=%s",
                project_id,
                segment_id,
                trace["reference_prepare_ok"],
                trace["reference_check_ok"],
                trace["duration_check_ok"],
                trace["generation_start_ok"],
                trace["poll_completed"],
                trace["download_ok"],
                trace["save_ok"],
                trace["writeback_ok"],
                trace["final_video_url"],
                trace["request_id"],
                trace["final_error"],
            )

    def _thread_process_segment(
        self,
        project_id: int,
        record_id: int,
    ) -> SegmentVideoAttemptResult:
        db = SessionLocal()
        try:
            rec = db.query(SegmentScriptRecord).filter(SegmentScriptRecord.id == record_id).first()
            if not rec:
                return SegmentVideoAttemptResult(segment_id="?", ok=False, error_message="record not found")
            chars, scenes, products = list_asset_rows(db, project_id)
            proj = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
            project_ar = proj.aspect_ratio if proj else None
            return self._process_segment_core(
                db,
                project_id,
                rec,
                chars=chars,
                scenes=scenes,
                products=products,
                project_ar=project_ar,
            )
        finally:
            db.close()

    def generate_segment_videos(self, db: Session, project_id: int) -> VideoBatchResult:
        project = orchestrator.get_project(db, project_id)
        records = list_segment_scripts(db, project_id)
        if not records:
            raise ShortDramaVideoInputError("No segment scripts for project")

        orchestrator.begin_video_render(db, project)
        db.commit()

        chars, scenes, products = list_asset_rows(db, project_id)
        project_ar = project.aspect_ratio
        out = VideoBatchResult(project_id=project_id)
        workers = self._max_workers()

        if workers <= 1:
            for rec in records:
                out.segments_attempted += 1
                r = self._process_segment_core(
                    db,
                    project_id,
                    rec,
                    chars=chars,
                    scenes=scenes,
                    products=products,
                    project_ar=project_ar,
                )
                out.results.append(r)
                if r.ok:
                    out.segments_succeeded += 1
                else:
                    out.errors.append(
                        {
                            "segment_id": r.segment_id,
                            "render_job_id": r.render_job_id,
                            "error": r.error_message,
                        }
                    )
        else:
            out.segments_attempted = len(records)
            with ThreadPoolExecutor(max_workers=min(workers, len(records))) as pool:
                futs = {
                    pool.submit(self._thread_process_segment, project_id, rec.id): rec.segment_id
                    for rec in records
                }
                for fut in as_completed(futs):
                    r = fut.result()
                    out.results.append(r)
                    if r.ok:
                        out.segments_succeeded += 1
                    else:
                        out.errors.append(
                            {
                                "segment_id": r.segment_id,
                                "render_job_id": r.render_job_id,
                                "error": r.error_message,
                            }
                        )

        project2 = orchestrator.get_project(db, project_id)
        n = len(records)
        all_segments_succeeded = n > 0 and out.segments_succeeded == n
        orchestrator.complete_segment_video_batch(
            db,
            project2,
            had_attempts=out.segments_attempted > 0,
            any_success=out.segments_succeeded > 0,
            all_failed=out.segments_attempted > 0 and out.segments_succeeded == 0,
            all_segments_succeeded=all_segments_succeeded,
        )
        db.commit()
        return out

    def generate_single_segment_video(
        self,
        db: Session,
        project_id: int,
        segment_id: str,
    ) -> SegmentVideoAttemptResult:
        project = orchestrator.get_project(db, project_id)
        st = project.status
        allowed = {
            ProjectStatus.ASSETS_READY.value,
            ProjectStatus.SEGMENTS_GENERATED.value,
            ProjectStatus.VIDEO_RENDERING.value,
            ProjectStatus.VIDEO_SEGMENTS_READY.value,
            ProjectStatus.COMPLETED.value,
        }
        if st not in allowed:
            raise ShortDramaVideoInputError(
                f"Project status {st!r} does not allow segment video generation "
                f"(need one of {sorted(allowed)})"
            )
        if st in ("assets_ready", "segments_generated"):
            orchestrator.begin_video_render(db, project)
            db.commit()
        elif st == ProjectStatus.VIDEO_SEGMENTS_READY.value:
            # Regenerating one segment after all were ready: re-enter segment-rendering phase for honest UI.
            project.status = ProjectStatus.VIDEO_RENDERING.value
            db.add(project)
            db.commit()

        rec = (
            db.query(SegmentScriptRecord)
            .filter(
                SegmentScriptRecord.project_id == project_id,
                SegmentScriptRecord.segment_id == segment_id,
            )
            .first()
        )
        if not rec:
            raise ShortDramaVideoInputError(f"Segment {segment_id!r} not found for project {project_id}")

        chars, scenes, products = list_asset_rows(db, project_id)
        project = orchestrator.get_project(db, project_id)
        result = self._process_segment_core(
            db,
            project_id,
            rec,
            chars=chars,
            scenes=scenes,
            products=products,
            project_ar=project.aspect_ratio,
        )
        if result.ok:
            proj2 = orchestrator.get_project(db, project_id)
            orchestrator.mark_video_segments_ready_if_complete(
                db,
                proj2,
                all_segment_videos_present=all_segment_scripts_have_video(db, project_id),
            )
            db.commit()
        return result


render_executor_service = RenderExecutorService()
