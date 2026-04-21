import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import CharacterAsset, ProductAsset, SceneAsset
from ..schemas.asset import (
    AssetSpecsBundleSchema,
    CharacterAssetSchema,
    GenerateAssetSpecsRequest,
    GenerateAssetSpecsResponse,
    ProductAssetSchema,
    UpdateAssetRequest,
    UpdateAssetResponse,
    SceneAssetSchema,
)
from ..services.project_state_service import STEP_3, mark_step_completed, propagate_downstream_stale, update_last_active_step
from ..schemas.product import ProductContextSchema
from ..schemas.story import StoryBlueprintSchema
from ..services.asset_spec_service import asset_spec_service
from ..services.read_models import latest_product_context, latest_story_blueprint
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.patch("/{asset_type}/{asset_id}", response_model=UpdateAssetResponse)
async def update_one_asset(
    asset_type: str,
    asset_id: int,
    body: UpdateAssetRequest,
    db: Session = Depends(get_db),
):
    model_map = {
        "character": CharacterAsset,
        "scene": SceneAsset,
        "product": ProductAsset,
    }
    m = model_map.get((asset_type or "").strip().lower())
    if m is None:
        raise HTTPException(status_code=400, detail="Invalid asset_type")
    row = db.query(m).filter(m.id == asset_id, m.project_id == body.project_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    project = orchestrator.get_project(db, body.project_id)

    if body.name is not None:
        row.name = body.name
    if body.description is not None:
        row.description = body.description
    if body.visual_prompt is not None:
        row.visual_prompt = body.visual_prompt
    if m is CharacterAsset and body.role_type is not None:
        row.role_type = body.role_type
    if m is SceneAsset and body.scene_type is not None:
        row.scene_type = body.scene_type

    meta = dict(row.meta_json or {})
    if body.voice_style is not None:
        meta["voice_style"] = body.voice_style
    if body.reference_image_data_url is not None:
        meta["reference_image_data_url"] = body.reference_image_data_url
    if body.reference_image_name is not None:
        meta["reference_image_name"] = body.reference_image_name
    if body.product_usage is not None:
        meta["product_usage"] = body.product_usage
    if m is ProductAsset and body.product_type is not None:
        meta["product_type"] = body.product_type
    row.meta_json = meta
    db.add(row)

    mark_step_completed(project, STEP_3)
    propagate_downstream_stale(project, STEP_3)
    update_last_active_step(project, STEP_3)
    db.add(project)
    db.commit()
    return UpdateAssetResponse(
        project_id=body.project_id,
        asset_type=asset_type,
        asset_id=asset_id,
        stale_marked_step_4=True,
    )


@router.post("/generate", response_model=GenerateAssetSpecsResponse)
async def generate_asset_specs(body: GenerateAssetSpecsRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /assets/specs/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(db, project, WorkflowStep.GENERATE_ASSET_SPECS)
        had_existing_assets = (
            db.query(CharacterAsset.id).filter(CharacterAsset.project_id == body.project_id).first() is not None
            or db.query(SceneAsset.id).filter(SceneAsset.project_id == body.project_id).first() is not None
            or db.query(ProductAsset.id).filter(ProductAsset.project_id == body.project_id).first() is not None
        )

        pc_row = latest_product_context(db, body.project_id)
        sb_row = latest_story_blueprint(db, body.project_id)
        if not pc_row or not sb_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requires product context and story blueprint",
            )

        product = ProductContextSchema.model_validate(pc_row.normalized_context_json)
        blueprint = StoryBlueprintSchema.model_validate(sb_row.blueprint_json)

        status_before = project.status
        try:
            bundle = asset_spec_service.generate(body.project_id, product, blueprint)
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            logger.info(
                "[SHORT_DRAMA_STEP_FAIL] project_id=%s step=%s error_type=%s project_status_before=%s project_status_after=%s",
                body.project_id,
                "S3_generate_asset_specs",
                type(e).__name__,
                status_before,
                project.status,
            )
            raise_short_drama_http(e)
        except Exception as e:
            logger.info(
                "[SHORT_DRAMA_STEP_FAIL] project_id=%s step=%s error_type=%s project_status_before=%s project_status_after=%s",
                body.project_id,
                "S3_generate_asset_specs",
                type(e).__name__,
                status_before,
                project.status,
            )
            logger.exception("Asset spec unexpected error project_id=%s", body.project_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Asset spec generation failed",
            )

        db.query(CharacterAsset).filter(CharacterAsset.project_id == body.project_id).delete(
            synchronize_session=False
        )
        db.query(SceneAsset).filter(SceneAsset.project_id == body.project_id).delete(synchronize_session=False)
        db.query(ProductAsset).filter(ProductAsset.project_id == body.project_id).delete(synchronize_session=False)

        for c in bundle.characters:
            db.add(
                CharacterAsset(
                    project_id=body.project_id,
                    name=c.name,
                    role_type=c.role_type,
                    description=c.description,
                    visual_prompt=c.visual_prompt,
                    image_url=c.image_url,
                    meta_json=c.meta,
                )
            )
        for s in bundle.scenes:
            db.add(
                SceneAsset(
                    project_id=body.project_id,
                    name=s.name,
                    scene_type=s.scene_type,
                    description=s.description,
                    visual_prompt=s.visual_prompt,
                    image_url=s.image_url,
                    meta_json=s.meta,
                )
            )
        for p in bundle.products:
            db.add(
                ProductAsset(
                    project_id=body.project_id,
                    name=p.name,
                    description=p.description,
                    visual_prompt=p.visual_prompt,
                    image_url=p.image_url,
                    meta_json=p.meta,
                )
            )

        mark_step_completed(project, STEP_3)
        if had_existing_assets:
            propagate_downstream_stale(project, STEP_3)
        update_last_active_step(project, STEP_3)
        orchestrator.advance_on_success(db, project, WorkflowStep.GENERATE_ASSET_SPECS)
        db.commit()

        chars = (
            db.query(CharacterAsset)
            .filter(CharacterAsset.project_id == body.project_id)
            .order_by(CharacterAsset.id)
            .all()
        )
        scenes = db.query(SceneAsset).filter(SceneAsset.project_id == body.project_id).order_by(SceneAsset.id).all()
        products = (
            db.query(ProductAsset).filter(ProductAsset.project_id == body.project_id).order_by(ProductAsset.id).all()
        )

        out_bundle = AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    id=c.id,
                    name=c.name,
                    role_type=c.role_type,
                    description=c.description,
                    visual_prompt=c.visual_prompt,
                    image_url=c.image_url,
                    meta=c.meta_json or {},
                )
                for c in chars
            ],
            scenes=[
                SceneAssetSchema(
                    id=s.id,
                    name=s.name,
                    scene_type=s.scene_type,
                    description=s.description,
                    visual_prompt=s.visual_prompt,
                    image_url=s.image_url,
                    meta=s.meta_json or {},
                )
                for s in scenes
            ],
            products=[
                ProductAssetSchema(
                    id=p.id,
                    name=p.name,
                    description=p.description,
                    visual_prompt=p.visual_prompt,
                    image_url=p.image_url,
                    meta=p.meta_json or {},
                )
                for p in products
            ],
        )

        log_api_success(
            logger,
            "POST /assets/specs/generate",
            project_id=body.project_id,
            characters=len(out_bundle.characters),
            scenes=len(out_bundle.scenes),
            products=len(out_bundle.products),
        )
        return GenerateAssetSpecsResponse(project_id=body.project_id, assets=out_bundle)
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /assets/specs/generate",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise
    except Exception as e:
        log_api_error(
            logger,
            "POST /assets/specs/generate",
            str(e),
            project_id=body.project_id,
        )
        raise
