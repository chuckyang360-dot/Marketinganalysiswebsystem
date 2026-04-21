"""Concatenate segment MP4s into a final video via ffmpeg."""

from __future__ import annotations

import logging
import re
import shutil
from pathlib import Path

from sqlalchemy.orm import Session

from ..exceptions import ShortDramaFFmpegError, ShortDramaInvalidSegmentVideoError, ShortDramaMergeError
from ..models import RenderJob
from ..utils.enums import RenderJobStatus, RenderTargetType, WorkflowStep
from ..utils.ffmpeg_merge import merge_mp4_files
from ..utils.segment_mp4_validate import validate_segment_mp4_path
from ..utils.video_storage import (
    download_public_video_to_temp_mp4,
    ensure_video_project_dir,
    is_short_drama_r2_video_url,
    is_short_drama_static_video_url,
    local_path_from_public_video_url,
    save_final_video_bytes,
)
from .read_models import list_segment_scripts
from .workflow_orchestrator import orchestrator

logger = logging.getLogger(__name__)


def _natural_segment_sort_key(segment_id: str) -> list:
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r"(\d+)", segment_id)]


class MergeService:
    def merge_project_video(self, db: Session, project_id: int) -> str:
        final_merge_ok = False
        final_video_url = ""
        final_error = ""
        segment_count = 0
        resolved_inputs_count = 0
        downloaded_temp_inputs: list[Path] = []
        project = orchestrator.get_project(db, project_id)
        orchestrator.assert_step_allowed(db, project, WorkflowStep.MERGE)

        segs = list_segment_scripts(db, project_id)
        if not segs:
            raise ShortDramaMergeError("No segment scripts to merge")

        ordered = sorted(segs, key=lambda r: _natural_segment_sort_key(r.segment_id))
        segment_count = len(ordered)
        paths: list[Path] = []
        order_ids: list[str] = []
        try:
            for s in ordered:
                script = s.script_json if isinstance(s.script_json, dict) else {}
                vr = script.get("video_render") or {}
                url = vr.get("video_url")
                if not url:
                    raise ShortDramaMergeError(
                        f"Incomplete segment videos: {s.segment_id!r} has no video_url; all segments are required"
                    )
                source_video_url = str(url).strip()
                logger.info(
                    "[FINAL_MERGE_INPUT_RESOLVE_START] project_id=%s segment_id=%s source_video_url=%s",
                    project_id,
                    s.segment_id,
                    source_video_url,
                )
                if is_short_drama_static_video_url(source_video_url):
                    local_path = local_path_from_public_video_url(source_video_url)
                    logger.info(
                        "[FINAL_MERGE_INPUT_RESOLVE_LOCAL] project_id=%s segment_id=%s source_video_url=%s local_path=%s",
                        project_id,
                        s.segment_id,
                        source_video_url,
                        str(local_path),
                    )
                elif is_short_drama_r2_video_url(source_video_url):
                    logger.info(
                        "[FINAL_MERGE_INPUT_DOWNLOAD_START] project_id=%s segment_id=%s source_video_url=%s",
                        project_id,
                        s.segment_id,
                        source_video_url,
                    )
                    try:
                        local_path = download_public_video_to_temp_mp4(source_video_url)
                        downloaded_temp_inputs.append(local_path)
                        file_size = local_path.stat().st_size if local_path.is_file() else 0
                        logger.info(
                            "[FINAL_MERGE_INPUT_DOWNLOAD_SUCCESS] project_id=%s segment_id=%s source_video_url=%s local_path=%s file_size=%s",
                            project_id,
                            s.segment_id,
                            source_video_url,
                            str(local_path),
                            file_size,
                        )
                    except Exception as e:
                        logger.error(
                            "[FINAL_MERGE_INPUT_DOWNLOAD_FAIL] project_id=%s segment_id=%s source_video_url=%s exception_class=%s err=%s",
                            project_id,
                            s.segment_id,
                            source_video_url,
                            type(e).__name__,
                            str(e),
                        )
                        raise ShortDramaMergeError(
                            f"Bad video URL for segment {s.segment_id!r}: download failed: {e}"
                        ) from e
                else:
                    raise ShortDramaMergeError(f"Bad video URL for segment {s.segment_id!r}: Not a short drama video URL")

                paths.append(local_path)
                order_ids.append(s.segment_id)
                resolved_inputs_count += 1

            for sid, pth in zip(order_ids, paths):
                try:
                    validate_segment_mp4_path(pth, segment_id=sid)
                except ShortDramaInvalidSegmentVideoError as e:
                    raise ShortDramaMergeError(
                        f"Cannot merge: segment video file is invalid or corrupt — {e}"
                    ) from e

            logger.info(
                "[FINAL_RENDER_TRIGGERED] project_id=%s segment_count=%s segment_ids=%s",
                project_id,
                len(order_ids),
                order_ids,
            )

            job = RenderJob(
                project_id=project_id,
                target_type=RenderTargetType.FINAL.value,
                target_id=str(project_id),
                provider="ffmpeg",
                model=None,
                provider_request_id=None,
                status=RenderJobStatus.QUEUED.value,
                input_payload_json={"segment_ids": order_ids, "segment_count": len(order_ids)},
                output_url=None,
                meta_json={"stage": "queued"},
            )
            db.add(job)
            db.flush()
            logger.info("[FINAL_RENDER_JOB_CREATED] job_id=%s project_id=%s", job.id, project_id)

            job.status = RenderJobStatus.RUNNING.value
            job.meta_json = {**(job.meta_json or {}), "stage": "running"}
            db.add(job)
            db.commit()

            logger.info("[FINAL_RENDER_STARTED] project_id=%s provider=ffmpeg model=None job_id=%s", project_id, job.id)

            logger.info("[FINAL_RENDER_DEBUG] ffmpeg_path=%s", shutil.which("ffmpeg"))

            tmp_dir = ensure_video_project_dir(project_id)
            tmp_out = tmp_dir / "_merge_working_out.mp4"
            try:
                merge_mp4_files(paths, tmp_out, project_id=project_id, segment_id="final_merge")
                data = tmp_out.read_bytes()
            except ShortDramaFFmpegError as e:
                err_msg = str(e)
                job.status = RenderJobStatus.FAILED.value
                job.error_message = err_msg[:4000]
                job.meta_json = {**(job.meta_json or {}), "stage": "failed", "error_class": type(e).__name__}
                db.add(job)
                db.commit()
                logger.warning("[FINAL_RENDER_FAILED] project_id=%s job_id=%s error=%s", project_id, job.id, err_msg[:500])
                raise ShortDramaMergeError(f"Final merge failed: {err_msg}") from e
            except OSError as e:
                err_msg = str(e)
                if "No such file or directory: 'ffmpeg'" in err_msg:
                    ferr = ShortDramaFFmpegError("ffmpeg not found in runtime environment")
                    ferr.__cause__ = e
                    err_msg = str(ferr)
                    job.status = RenderJobStatus.FAILED.value
                    job.error_message = err_msg[:4000]
                    job.meta_json = {**(job.meta_json or {}), "stage": "failed", "error_class": type(ferr).__name__}
                    db.add(job)
                    db.commit()
                    logger.warning("[FINAL_RENDER_FAILED] project_id=%s job_id=%s error=%s", project_id, job.id, err_msg[:500])
                    raise ShortDramaMergeError(f"Final merge failed: {err_msg}") from ferr
                job.status = RenderJobStatus.FAILED.value
                job.error_message = err_msg[:4000]
                db.add(job)
                db.commit()
                logger.warning("[FINAL_RENDER_FAILED] project_id=%s job_id=%s error=%s", project_id, job.id, err_msg[:500])
                raise ShortDramaMergeError(f"Final merge failed: {err_msg}") from e
            finally:
                try:
                    tmp_out.unlink(missing_ok=True)
                except OSError:
                    pass

            final_url = save_final_video_bytes(project_id=project_id, data=data)
            job.status = RenderJobStatus.COMPLETED.value
            job.output_url = final_url
            job.meta_json = {**(job.meta_json or {}), "stage": "completed", "tool": "ffmpeg", "concat": "segment_mp4s"}
            job.input_payload_json = {"segment_ids": order_ids, "segment_count": len(order_ids)}
            db.add(job)
            orchestrator.complete_final_merge(db, project)
            db.commit()
            logger.info("[FINAL_RENDER_COMPLETED] project_id=%s job_id=%s final_video_url=%s", project_id, job.id, final_url)
            final_video_url = final_url
            final_merge_ok = True
            return final_url
        except Exception as e:
            final_error = str(e)
            raise
        finally:
            for pth in downloaded_temp_inputs:
                try:
                    pth.unlink(missing_ok=True)
                except OSError:
                    pass
            logger.info(
                "[FINAL_MERGE_TRACE_SUMMARY] project_id=%s segment_count=%s resolved_inputs_count=%s final_merge_ok=%s final_video_url=%s final_error=%s",
                project_id,
                segment_count,
                resolved_inputs_count,
                final_merge_ok,
                final_video_url,
                final_error,
            )


merge_service = MergeService()
