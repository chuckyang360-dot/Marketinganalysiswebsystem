import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import SegmentScriptRecord
from ..schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from ..schemas.product import ProductContextSchema
from ..schemas.segment import GenerateSegmentsRequest, GenerateSegmentsResponse, SegmentScriptSchema
from ..schemas.story import StoryBlueprintSchema
from ..services.read_models import (
    latest_product_context,
    latest_story_blueprint,
    list_pipeline_asset_rows,
    next_segment_batch_version,
)
from ..services.segment_director_service import segment_director_service
from ..services.project_state_service import STEP_4, mark_step_completed, update_last_active_step
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()
_SECONDARY_MUST_SHOW_LIMIT = 3


def _purpose_rank(v: str | None) -> int:
    x = (v or "").strip().lower()
    order = {
        "hero": 0,
        "core": 1,
        "sell": 2,
        "narrative": 3,
        "support": 4,
        "atmosphere": 5,
    }
    return order.get(x, 99)


def _narrative_rank(v: str | None) -> int:
    x = (v or "").strip().lower()
    order = {
        "hook": 0,
        "conflict": 1,
        "twist": 2,
        "resolution": 3,
    }
    return order.get(x, 99)


def _build_must_show_asset_ids(assets: AssetSpecsBundleSchema) -> list[int]:
    pool = [*assets.characters, *assets.scenes, *assets.products]
    primary = [a for a in pool if a.id is not None and (a.exposure_priority or "").lower() == "primary"]
    secondary = [a for a in pool if a.id is not None and (a.exposure_priority or "").lower() == "secondary"]
    # Hard constraint: background assets never enter must_show_asset_ids.
    secondary = sorted(
        secondary,
        key=lambda a: (
            _purpose_rank(a.purpose),
            _narrative_rank(a.narrative_function),
            int(a.id or 0),
        ),
    )[:_SECONDARY_MUST_SHOW_LIMIT]
    return [int(a.id) for a in [*primary, *secondary] if a.id is not None]


def _validate_step4_visual_anchor(assets: AssetSpecsBundleSchema) -> None:
    missing: list[str] = []

    def _check(kind: str, rows: list[Any]) -> None:
        for row in rows:
            if row.visual_anchor_image_id is None:
                missing.append(f"{kind}:{row.id or row.name}")

    _check("character", assets.characters)
    _check("scene", assets.scenes)
    _check("product", assets.products)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Step4 generation blocked: visual_anchor_image_id is required for all "
                "CharacterSpec/SceneSpec/ProductSpec. Missing: " + ", ".join(missing)
            ),
        )


@router.post("/generate", response_model=GenerateSegmentsResponse)
async def generate_segments(body: GenerateSegmentsRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /segment/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(db, project, WorkflowStep.GENERATE_SEGMENTS)

        sb_row = latest_story_blueprint(db, body.project_id)
        pc_row = latest_product_context(db, body.project_id)
        if not sb_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story blueprint missing; run /story/generate first",
            )

        chars, scenes, products = list_pipeline_asset_rows(db, body.project_id)
        if not chars and not scenes and not products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset specs missing; run /assets/specs/generate first",
            )

        blueprint = StoryBlueprintSchema.model_validate(sb_row.blueprint_json)
        product_ctx = ProductContextSchema.model_validate(pc_row.normalized_context_json) if pc_row else ProductContextSchema()
        assets = AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    id=c.id,
                    name=c.name,
                    role_type=c.role_type,
                    description=c.description,
                    visual_prompt=c.visual_prompt,
                    image_url=c.image_url,
                    visual_anchor_image_id=c.visual_anchor_image_id,
                    source_asset_version=c.source_asset_version,
                    exposure_priority=c.exposure_priority,
                    narrative_function=c.narrative_function,
                    purpose=c.purpose,
                    meta=c.meta_json or {},
                )
                for c in chars
            ],
            scenes=[
                SceneAssetSchema(
                    id=s.id,
                    name=s.name,
                    scene_type=s.scene_type,
                    scene_form=s.scene_form,
                    description=s.description,
                    visual_prompt=s.visual_prompt,
                    image_url=s.image_url,
                    visual_anchor_image_id=s.visual_anchor_image_id,
                    source_asset_version=s.source_asset_version,
                    exposure_priority=s.exposure_priority,
                    narrative_function=s.narrative_function,
                    purpose=s.purpose,
                    meta=s.meta_json or {},
                )
                for s in scenes
            ],
            products=[
                ProductAssetSchema(
                    id=p.id,
                    name=p.name,
                    product_role=p.product_role,
                    description=p.description,
                    visual_prompt=p.visual_prompt,
                    image_url=p.image_url,
                    visual_anchor_image_id=p.visual_anchor_image_id,
                    source_asset_version=p.source_asset_version,
                    exposure_priority=p.exposure_priority,
                    narrative_function=p.narrative_function,
                    purpose=p.purpose,
                    meta=p.meta_json or {},
                )
                for p in products
            ],
        )
        _validate_step4_visual_anchor(assets)
        must_show_asset_ids = _build_must_show_asset_ids(assets)
        assets = assets.model_copy(
            update={
                "characters": [
                    c.model_copy(update={"meta": {**(c.meta or {}), "must_show": (c.id in must_show_asset_ids)}})
                    for c in assets.characters
                ],
                "scenes": [
                    s.model_copy(update={"meta": {**(s.meta or {}), "must_show": (s.id in must_show_asset_ids)}})
                    for s in assets.scenes
                ],
                "products": [
                    p.model_copy(update={"meta": {**(p.meta or {}), "must_show": (p.id in must_show_asset_ids)}})
                    for p in assets.products
                ],
            }
        )

        project_config = {
            "duration": project.duration,
            "format": project.format,
            "style": project.style,
            "visual_style": project.visual_style,
            "aspect_ratio": project.aspect_ratio,
            "must_show_asset_ids": must_show_asset_ids,
            "s1_visual_constraints": {
                "visual_features": product_ctx.visual_features,
                "consistency_notes": product_ctx.consistency_notes,
                "visual_risk_notes": product_ctx.visual_risk_notes,
                "product_form": product_ctx.product_form,
                "usage_scenarios": product_ctx.usage_scenarios,
            },
        }

        try:
            segments = segment_director_service.generate(body.project_id, blueprint, assets, project_config)
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            # Recoverable model/validator issues: keep project out of terminal failed so user can retry.
            db.rollback()
            raise_short_drama_http(e)
        except Exception:
            logger.exception("Segment generation unexpected error project_id=%s", body.project_id)
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Segment generation failed",
            )

        batch_ver = next_segment_batch_version(db, body.project_id)
        db.query(SegmentScriptRecord).filter(SegmentScriptRecord.project_id == body.project_id).delete(
            synchronize_session=False
        )
        record_ids: list[int] = []
        for seg in segments:
            asset_versions = {
                "characters": {str(c.id): c.source_asset_version for c in assets.characters if c.id is not None},
                "scenes": {str(s.id): s.source_asset_version for s in assets.scenes if s.id is not None},
                "products": {str(p.id): p.source_asset_version for p in assets.products if p.id is not None},
            }
            meta = dict(seg.meta or {})
            meta["must_show_asset_ids"] = must_show_asset_ids
            meta["asset_spec_versions"] = asset_versions
            row = SegmentScriptRecord(
                project_id=body.project_id,
                segment_id=seg.segment_id,
                script_json=seg.model_copy(update={"meta": meta}).model_dump(),
                version=batch_ver,
            )
            db.add(row)
            db.flush()
            record_ids.append(row.id)

        mark_step_completed(project, STEP_4)
        update_last_active_step(project, STEP_4)
        orchestrator.advance_on_success(db, project, WorkflowStep.GENERATE_SEGMENTS)
        db.commit()

        log_api_success(
            logger,
            "POST /segment/generate",
            project_id=body.project_id,
            segments_count=len(segments),
            record_ids_count=len(record_ids),
        )
        return GenerateSegmentsResponse(
            project_id=body.project_id,
            segments=segments,
            record_ids=record_ids,
        )
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /segment/generate",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise
