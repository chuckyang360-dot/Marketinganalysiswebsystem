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
    SceneAssetSchema,
)
from ..schemas.product import ProductContextSchema
from ..schemas.story import StoryBlueprintSchema
from ..services.asset_spec_service import asset_spec_service
from ..services.read_models import latest_product_context, latest_story_blueprint
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=GenerateAssetSpecsResponse)
async def generate_asset_specs(body: GenerateAssetSpecsRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /assets/specs/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(project, WorkflowStep.GENERATE_ASSET_SPECS)

        pc_row = latest_product_context(db, body.project_id)
        sb_row = latest_story_blueprint(db, body.project_id)
        if not pc_row or not sb_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requires product context and story blueprint",
            )

        product = ProductContextSchema.model_validate(pc_row.normalized_context_json)
        blueprint = StoryBlueprintSchema.model_validate(sb_row.blueprint_json)

        try:
            bundle = asset_spec_service.generate(body.project_id, product, blueprint)
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            orchestrator.mark_failed(db, project)
            db.commit()
            raise_short_drama_http(e)
        except Exception:
            logger.exception("Asset spec unexpected error project_id=%s", body.project_id)
            orchestrator.mark_failed(db, project)
            db.commit()
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
