from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaImageProviderError, ShortDramaImageSaveError
from ..http_errors import raise_short_drama_http
from ..models import CharacterAsset, ProductAsset, SceneAsset, ShortDramaProject
from ..schemas.asset import (
    AssetImageBatchResponse,
    GenerateAssetImagesRequest,
    RegenerateOneAssetImageRequest,
    RegenerateOneAssetImageResponse,
)
from ..services.project_state_service import STEP_3, mark_step_completed, propagate_downstream_stale, update_last_active_step
from ..services.asset_image_service import asset_image_service
from ..services.workflow_orchestrator import ASSET_IMAGE_RENDER_ALLOWED_STATUSES

logger = logging.getLogger(__name__)

router = APIRouter()


def _detail_to_str(detail: Any) -> str:
    if isinstance(detail, str):
        return detail
    return str(detail)


def _asset_image_generate_preflight(
    db: Session, project_id: int
) -> tuple[ShortDramaProject | None, dict[str, int]]:
    proj = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if proj is None:
        return None, {}
    chars = db.query(CharacterAsset).filter(CharacterAsset.project_id == project_id).all()
    scenes = db.query(SceneAsset).filter(SceneAsset.project_id == project_id).all()
    prods = db.query(ProductAsset).filter(ProductAsset.project_id == project_id).all()

    def _filled_image_url_count(rows: list[Any]) -> int:
        return sum(1 for r in rows if (getattr(r, "image_url", None) or "").strip())

    return proj, {
        "character_count": len(chars),
        "scene_count": len(scenes),
        "product_count": len(prods),
        "image_url_filled": _filled_image_url_count(chars)
        + _filled_image_url_count(scenes)
        + _filled_image_url_count(prods),
    }


def _log_api_blocked_asset_images_generate(
    *,
    project_id: int,
    project_status: str,
    reason: str,
    detail: str,
    meta: dict[str, int],
    forbid_repeat: bool,
    prereq_insufficient: bool,
) -> None:
    logger.warning(
        "[API_BLOCKED] POST /assets/images/generate project_id=%s status=%s reason=%s detail=%s "
        "character_count=%s scene_count=%s product_count=%s image_url_filled=%s forbid_repeat=%s prereq_insufficient=%s",
        project_id,
        project_status,
        reason,
        detail,
        meta.get("character_count", 0),
        meta.get("scene_count", 0),
        meta.get("product_count", 0),
        meta.get("image_url_filled", 0),
        forbid_repeat,
        prereq_insufficient,
    )


def _to_response(r) -> AssetImageBatchResponse:
    return AssetImageBatchResponse(
        project_id=r.project_id,
        characters_attempted=r.characters_attempted,
        characters_succeeded=r.characters_succeeded,
        scenes_attempted=r.scenes_attempted,
        scenes_succeeded=r.scenes_succeeded,
        products_attempted=r.products_attempted,
        products_succeeded=r.products_succeeded,
        errors=r.errors,
    )


@router.post("/generate", response_model=AssetImageBatchResponse)
async def generate_all_asset_images(
    body: GenerateAssetImagesRequest,
    db: Session = Depends(get_db),
):
    """同步执行整批出图并 commit；200 表示本请求内批次已结束且状态已落库（非「仅入队」）。

    单张失败记入 errors，不中断其它资产；若全部失败，项目状态回退为 asset_specs_generated 以便重试。
    """
    pid = body.project_id
    proj, meta = _asset_image_generate_preflight(db, pid)
    if proj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    st = proj.status or ""
    allowed = st in ASSET_IMAGE_RENDER_ALLOWED_STATUSES
    prereq_insufficient = st in ("created", "product_parsed", "story_generated")
    forbid_repeat = st in ("video_rendering", "video_segments_ready", "completed")

    try:
        result = asset_image_service.generate_all_asset_images(db, pid)
        return _to_response(result)
    except HTTPException as he:
        if he.status_code == status.HTTP_409_CONFLICT:
            detail_s = _detail_to_str(he.detail)
            if st == "failed":
                reason = "project_failed"
            elif not allowed:
                if prereq_insufficient:
                    reason = "prerequisite_insufficient"
                elif forbid_repeat:
                    reason = "pipeline_past_asset_images"
                else:
                    reason = "invalid_status_for_asset_render"
            else:
                reason = "conflict"
            _log_api_blocked_asset_images_generate(
                project_id=pid,
                project_status=st,
                reason=reason,
                detail=detail_s,
                meta=meta,
                forbid_repeat=forbid_repeat,
                prereq_insufficient=prereq_insufficient,
            )
        raise
    except (ShortDramaImageProviderError, ShortDramaImageSaveError) as e:
        raise_short_drama_http(e)


@router.post("/generate/characters", response_model=AssetImageBatchResponse)
async def generate_character_images_only(
    body: GenerateAssetImagesRequest,
    db: Session = Depends(get_db),
):
    try:
        result = asset_image_service.generate_character_images(db, body.project_id)
        return _to_response(result)
    except (ShortDramaImageProviderError, ShortDramaImageSaveError) as e:
        raise_short_drama_http(e)


@router.post("/generate/scenes", response_model=AssetImageBatchResponse)
async def generate_scene_images_only(
    body: GenerateAssetImagesRequest,
    db: Session = Depends(get_db),
):
    try:
        result = asset_image_service.generate_scene_images(db, body.project_id)
        return _to_response(result)
    except (ShortDramaImageProviderError, ShortDramaImageSaveError) as e:
        raise_short_drama_http(e)


@router.post("/generate/products", response_model=AssetImageBatchResponse)
async def generate_product_images_only(
    body: GenerateAssetImagesRequest,
    db: Session = Depends(get_db),
):
    try:
        result = asset_image_service.generate_product_images(db, body.project_id)
        return _to_response(result)
    except (ShortDramaImageProviderError, ShortDramaImageSaveError) as e:
        raise_short_drama_http(e)


@router.post("/regenerate-one", response_model=RegenerateOneAssetImageResponse)
async def regenerate_one_asset_image(
    body: RegenerateOneAssetImageRequest,
    db: Session = Depends(get_db),
):
    try:
        image_url = asset_image_service.regenerate_one_asset_image(
            db,
            project_id=body.project_id,
            asset_type=body.asset_type,
            asset_id=body.asset_id,
        )
        project = db.query(ShortDramaProject).filter(ShortDramaProject.id == body.project_id).first()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        mark_step_completed(project, STEP_3)
        propagate_downstream_stale(project, STEP_3)
        update_last_active_step(project, STEP_3)
        db.add(project)
        db.commit()
        return RegenerateOneAssetImageResponse(
            project_id=body.project_id,
            asset_type=body.asset_type,
            asset_id=body.asset_id,
            image_url=image_url,
            stale_marked_step_4=True,
        )
    except (ShortDramaImageProviderError, ShortDramaImageSaveError) as e:
        raise_short_drama_http(e)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
