import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...models import User
from ..models import (
    CharacterAsset,
    ProductAsset,
    SceneAsset,
    SegmentScriptRecord,
    ShortDramaProject,
)
from ..schemas.project import (
    CreateShortDramaProjectRequest,
    CreateShortDramaProjectResponse,
    PipelineSummaryResponse,
    ShortDramaProjectResponse,
)
from ..services.pipeline_video_state import build_pipeline_video_state, segment_row_video_fields
from ..services.read_models import (
    latest_final_video_url,
    latest_product_context,
    latest_story_blueprint,
    list_asset_rows,
    list_segment_scripts,
)
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success
from ..utils.public_static_url import build_public_static_url
from ..utils.segment_slots import normalize_segment_script_dict_for_read

logger = logging.getLogger(__name__)


def _public_media_url(u: str | None) -> str | None:
    if u is None:
        return None
    s = str(u).strip()
    if not s:
        return None
    return build_public_static_url(s)


def _script_with_public_video_url(script: dict, video_url_public: str | None) -> dict:
    if not video_url_public or not isinstance(script, dict):
        return script
    out = dict(script)
    vr = out.get("video_render")
    if isinstance(vr, dict):
        out["video_render"] = {**vr, "video_url": video_url_public}
    return out

router = APIRouter()


def _project_to_response(p: ShortDramaProject) -> ShortDramaProjectResponse:
    return ShortDramaProjectResponse.model_validate(p)


@router.post("", response_model=CreateShortDramaProjectResponse)
async def create_project(body: CreateShortDramaProjectRequest, db: Session = Depends(get_db)):
    log_api_request(
        logger,
        "POST /project",
        user_id=body.user_id,
        project_name=body.project_name,
    )
    try:
        user = db.query(User).filter(User.id == body.user_id).first()
        if not user:
            log_api_error(logger, "POST /project", "User not found", user_id=body.user_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        project = ShortDramaProject(
            user_id=body.user_id,
            project_name=body.project_name,
            duration=body.duration,
            format=body.format,
            style=body.style,
            visual_style=body.visual_style,
            aspect_ratio=body.aspect_ratio,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        log_api_success(
            logger,
            "POST /project",
            project_id=project.id,
            user_id=body.user_id,
            status=project.status,
        )
        return CreateShortDramaProjectResponse(project=_project_to_response(project))
    except HTTPException:
        raise
    except Exception as e:
        log_api_error(logger, "POST /project", str(e), user_id=body.user_id)
        raise


@router.get("/{project_id}", response_model=ShortDramaProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _project_to_response(project)


@router.get("/{project_id}/pipeline", response_model=PipelineSummaryResponse)
async def get_pipeline(project_id: int, db: Session = Depends(get_db)):
    log_api_request(logger, "GET /project/{id}/pipeline", project_id=project_id)
    try:
        project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
        if not project:
            log_api_error(logger, "GET /project/{id}/pipeline", "Project not found", project_id=project_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        pc = latest_product_context(db, project_id)
        sb = latest_story_blueprint(db, project_id)
        chars, scenes, products = list_asset_rows(db, project_id)
        segs = list_segment_scripts(db, project_id)

        def char_row(c: CharacterAsset) -> dict:
            return {
                "id": c.id,
                "name": c.name,
                "role_type": c.role_type,
                "description": c.description,
                "visual_prompt": c.visual_prompt,
                "image_url": _public_media_url(c.image_url),
                "meta": c.meta_json or {},
            }

        def scene_row(s: SceneAsset) -> dict:
            return {
                "id": s.id,
                "name": s.name,
                "scene_type": s.scene_type,
                "description": s.description,
                "visual_prompt": s.visual_prompt,
                "image_url": _public_media_url(s.image_url),
                "meta": s.meta_json or {},
            }

        def prod_row(p: ProductAsset) -> dict:
            return {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "visual_prompt": p.visual_prompt,
                "image_url": _public_media_url(p.image_url),
                "meta": p.meta_json or {},
            }

        video_state = build_pipeline_video_state(db, project_id, project.status)

        seg_payload = []
        for s in segs:
            script = s.script_json if isinstance(s.script_json, dict) else {}
            script = normalize_segment_script_dict_for_read(script)
            vr = script.get("video_render") or {}
            vu = vr.get("video_url")
            vu_pub = _public_media_url(str(vu) if vu else None)
            script_out = _script_with_public_video_url(script, vu_pub)
            vr_out = script_out.get("video_render") or {}
            row_extras = segment_row_video_fields(db, project_id, s.segment_id, script, str(vu) if vu else None)
            seg_payload.append(
                {
                    "id": s.id,
                    "segment_id": s.segment_id,
                    "version": s.version,
                    "script": script_out,
                    "video_url": vu_pub,
                    "video_render": vr_out,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    **row_extras,
                }
            )

        final_u = _public_media_url(latest_final_video_url(db, project_id))
        segment_video_map = {
            str(item.get("segment_id")): str(item.get("video_url") or "")
            for item in seg_payload
        }
        logger.info(
            "[PIPELINE_SEGMENT_VIDEO_URLS] project_id=%s segment_video_urls=%s final_video_url=%s",
            project_id,
            segment_video_map,
            final_u or "",
        )

        def _nonempty_url(u: str | None) -> bool:
            return bool((u or "").strip())

        image_url_filled = (
            sum(1 for c in chars if _nonempty_url(c.image_url))
            + sum(1 for s in scenes if _nonempty_url(s.image_url))
            + sum(1 for p in products if _nonempty_url(p.image_url))
        )
        asset_rows_total = len(chars) + len(scenes) + len(products)

        log_api_success(
            logger,
            "GET /project/{id}/pipeline",
            project_id=project_id,
            status=project.status,
            has_product_context=pc is not None,
            has_story_blueprint=sb is not None,
            asset_counts={
                "characters": len(chars),
                "scenes": len(scenes),
                "products": len(products),
            },
            image_url_filled=image_url_filled,
            asset_rows_total=asset_rows_total,
            segment_scripts_count=len(segs),
            has_final_video=bool(final_u),
            final_video_url=final_u or "",
        )
        logger.info(
            "[PIPELINE_VIDEO_STATE] project_id=%s has_all_segment_videos=%s has_final_video=%s "
            "final_render_status=%s project_status=%s current_video_stage=%s",
            project_id,
            video_state.get("has_all_segment_videos"),
            video_state.get("has_final_video"),
            video_state.get("final_render_status"),
            project.status,
            video_state.get("current_video_stage"),
        )

        return PipelineSummaryResponse(
            project=_project_to_response(project),
            product_context=(
                {
                    "id": pc.id,
                    "version": pc.version,
                    "raw_inputs": pc.raw_inputs_json,
                    "normalized": pc.normalized_context_json,
                    "created_at": pc.created_at.isoformat() if pc.created_at else None,
                }
                if pc
                else None
            ),
            story_blueprint=(
                {
                    "id": sb.id,
                    "version": sb.version,
                    "approved": sb.approved,
                    "blueprint": sb.blueprint_json,
                    "created_at": sb.created_at.isoformat() if sb.created_at else None,
                }
                if sb
                else None
            ),
            assets={
                "characters": [char_row(c) for c in chars],
                "scenes": [scene_row(s) for s in scenes],
                "products": [prod_row(p) for p in products],
            },
            segment_scripts=seg_payload,
            final_video_url=final_u,
            current_video_stage=video_state.get("current_video_stage"),
            has_all_segment_videos=bool(video_state.get("has_all_segment_videos")),
            has_final_video=bool(video_state.get("has_final_video")),
            final_render_status=video_state.get("final_render_status"),
            final_render_error=video_state.get("final_render_error"),
            final_render_job_id=video_state.get("final_render_job_id"),
            image_url_filled=image_url_filled,
            asset_rows_total=asset_rows_total,
        )
    except HTTPException:
        raise
    except Exception as e:
        log_api_error(logger, "GET /project/{id}/pipeline", str(e), project_id=project_id)
        raise
