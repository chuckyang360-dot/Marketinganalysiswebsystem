import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import AssetEntity, AssetImage, CharacterAsset, ProductAsset, SceneAsset
from ..schemas.asset import (
    AppendUploadedImagesRequest,
    AssetDetailSchema,
    AssetListResponse,
    AssetSpecsBundleSchema,
    CharacterAssetSchema,
    CreateAssetRequest,
    GenerateAssetSpecsRequest,
    GenerateAssetSpecsResponse,
    ProductAssetSchema,
    RepairSceneStructureRequest,
    RepairSceneStructureResponse,
    RegenerateAssetRequest,
    SetAssetCoverRequest,
    UpdateAssetMetaRequest,
    UpdateAssetRequest,
    UpdateAssetResponse,
    SceneAssetSchema,
)
from ..services.project_state_service import STEP_3, mark_step_completed, propagate_downstream_stale, update_last_active_step
from ..schemas.product import ProductContextSchema
from ..schemas.story import StoryBlueprintSchema
from ..services.asset_spec_service import asset_spec_service
from ..services.asset_library_service import asset_library_service
from ..services.read_models import latest_product_context, latest_story_blueprint
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


def _mark_step3_and_stale_step4(db: Session, project_id: int) -> None:
    project = orchestrator.get_project(db, project_id)
    mark_step_completed(project, STEP_3)
    propagate_downstream_stale(project, STEP_3)
    update_last_active_step(project, STEP_3)
    db.add(project)


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
        project_config = {
            "duration": project.duration,
            "format": project.format,
            "style": project.style,
            "visual_style": project.visual_style,
            "aspect_ratio": project.aspect_ratio,
        }

        status_before = project.status
        try:
            bundle = asset_spec_service.generate(body.project_id, product, blueprint, project_config)
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
                    meta_json={
                        **(c.meta or {}),
                        "asset_identity": c.asset_identity,
                        "boundary_warnings": c.boundary_warnings,
                        "source_asset_version": c.source_asset_version,
                        "exposure_priority": c.exposure_priority,
                        "narrative_function": c.narrative_function,
                        "purpose": c.purpose,
                    },
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
                    meta_json={
                        **(s.meta or {}),
                        "asset_identity": s.asset_identity,
                        "boundary_warnings": s.boundary_warnings,
                        "scene_form": s.scene_form,
                        "source_asset_version": s.source_asset_version,
                        "exposure_priority": s.exposure_priority,
                        "narrative_function": s.narrative_function,
                        "purpose": s.purpose,
                    },
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
                    meta_json={
                        **(p.meta or {}),
                        "asset_identity": p.asset_identity,
                        "boundary_warnings": p.boundary_warnings,
                        "product_role": p.product_role,
                        "source_asset_version": p.source_asset_version,
                        "exposure_priority": p.exposure_priority,
                        "narrative_function": p.narrative_function,
                        "purpose": p.purpose,
                    },
                )
            )

        # Step3 UI now reads unified asset library tables.
        # Keep legacy generation flow, but immediately sync generated legacy rows into library entities.
        db.flush()
        asset_library_service.sync_legacy_assets_for_project(db, body.project_id)

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
                    visual_anchor_image_id=(c.meta_json or {}).get("visual_anchor_image_id"),
                    source_asset_version=str((c.meta_json or {}).get("source_asset_version") or "legacy-1"),
                    exposure_priority=str((c.meta_json or {}).get("exposure_priority") or "secondary"),
                    narrative_function=(c.meta_json or {}).get("narrative_function"),
                    purpose=(c.meta_json or {}).get("purpose"),
                    meta=c.meta_json or {},
                )
                for c in chars
            ],
            scenes=[
                SceneAssetSchema(
                    id=s.id,
                    name=s.name,
                    scene_type=s.scene_type,
                    scene_form=(s.meta_json or {}).get("scene_form"),
                    description=s.description,
                    visual_prompt=s.visual_prompt,
                    image_url=s.image_url,
                    visual_anchor_image_id=(s.meta_json or {}).get("visual_anchor_image_id"),
                    source_asset_version=str((s.meta_json or {}).get("source_asset_version") or "legacy-1"),
                    exposure_priority=str((s.meta_json or {}).get("exposure_priority") or "secondary"),
                    narrative_function=(s.meta_json or {}).get("narrative_function"),
                    purpose=(s.meta_json or {}).get("purpose"),
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
                    visual_anchor_image_id=(p.meta_json or {}).get("visual_anchor_image_id"),
                    source_asset_version=str((p.meta_json or {}).get("source_asset_version") or "legacy-1"),
                    exposure_priority=str((p.meta_json or {}).get("exposure_priority") or "secondary"),
                    narrative_function=(p.meta_json or {}).get("narrative_function"),
                    purpose=(p.meta_json or {}).get("purpose"),
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


@router.get("/library/detail/{asset_id}", response_model=AssetDetailSchema)
async def get_asset_library_detail(asset_id: int, project_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(AssetEntity)
        .filter(AssetEntity.id == asset_id, AssetEntity.project_id == project_id, AssetEntity.status == "active")
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))


@router.get("/library/{project_id}/{asset_type}", response_model=AssetListResponse)
async def list_assets_library(project_id: int, asset_type: str, db: Session = Depends(get_db)):
    rows = (
        db.query(AssetEntity)
        .filter(
            AssetEntity.project_id == project_id,
            AssetEntity.asset_type == asset_type.strip().lower(),
            AssetEntity.status == "active",
        )
        .order_by(AssetEntity.sort_order.asc(), AssetEntity.id.asc())
        .all()
    )
    return AssetListResponse(
        project_id=project_id,
        asset_type=asset_type,
        assets=[AssetDetailSchema.model_validate(asset_library_service.to_detail(db, r)) for r in rows],
    )


@router.post("/library/scene/repair", response_model=RepairSceneStructureResponse)
async def repair_scene_library_structure(
    body: RepairSceneStructureRequest,
    dry_run: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    diffs = asset_library_service.repair_scene_structure_for_project(
        db, body.project_id, apply_changes=not dry_run
    )
    if diffs and not dry_run:
        db.commit()
    return RepairSceneStructureResponse(
        project_id=body.project_id,
        dry_run=dry_run,
        repaired_count=len(diffs),
        diffs=diffs,
    )


@router.post("/library", response_model=AssetDetailSchema)
async def create_asset_library(body: CreateAssetRequest, db: Session = Depends(get_db)):
    try:
        row = asset_library_service.create_asset(db, body)
        _mark_step3_and_stale_step4(db, body.project_id)
        db.commit()
        db.refresh(row)
        return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/library/regenerate", response_model=AssetDetailSchema)
async def regenerate_asset_library(body: RegenerateAssetRequest, db: Session = Depends(get_db)):
    try:
        row = asset_library_service.regenerate_asset_images(db, body)
        _mark_step3_and_stale_step4(db, body.project_id)
        db.commit()
        db.refresh(row)
        return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/library/{asset_id}/uploaded-images", response_model=AssetDetailSchema)
async def append_uploaded_images_to_asset(
    asset_id: int,
    body: AppendUploadedImagesRequest,
    db: Session = Depends(get_db),
):
    if not body.uploaded_images:
        raise HTTPException(status_code=400, detail="uploaded_images is required")
    try:
        row = asset_library_service.append_uploaded_images(
            db,
            project_id=body.project_id,
            asset_id=asset_id,
            uploaded_images=body.uploaded_images,
        )
        _mark_step3_and_stale_step4(db, body.project_id)
        db.commit()
        db.refresh(row)
        return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/library/{asset_id}", response_model=AssetDetailSchema)
async def update_asset_library(asset_id: int, body: UpdateAssetMetaRequest, db: Session = Depends(get_db)):
    row = (
        db.query(AssetEntity)
        .filter(AssetEntity.id == asset_id, AssetEntity.project_id == body.project_id, AssetEntity.status == "active")
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    if body.name is not None:
        row.name = body.name.strip() or row.name
    if body.description is not None:
        row.description = body.description
    if body.tags is not None:
        row.tags_json = body.tags
    if body.base_prompt is not None:
        row.base_prompt = body.base_prompt
    if body.type_fields is not None:
        extra = dict(row.extra_json or {})
        extra["type_fields"] = body.type_fields
        row.extra_json = extra
    db.add(row)
    _mark_step3_and_stale_step4(db, body.project_id)
    db.commit()
    db.refresh(row)
    return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))


@router.post("/library/{asset_id}/cover", response_model=AssetDetailSchema)
async def set_asset_cover(asset_id: int, body: SetAssetCoverRequest, db: Session = Depends(get_db)):
    row = (
        db.query(AssetEntity)
        .filter(AssetEntity.id == asset_id, AssetEntity.project_id == body.project_id, AssetEntity.status == "active")
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    image = (
        db.query(AssetImage)
        .filter(AssetImage.id == body.image_id, AssetImage.asset_id == row.id, AssetImage.status == "active")
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    row.cover_image_id = image.id
    db.add(row)
    asset_library_service._ensure_cover(db, row)
    _mark_step3_and_stale_step4(db, body.project_id)
    db.commit()
    db.refresh(row)
    return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))


@router.delete("/library/image/{image_id}", response_model=AssetDetailSchema)
async def delete_asset_image(image_id: int, project_id: int, db: Session = Depends(get_db)):
    image = db.query(AssetImage).filter(AssetImage.id == image_id, AssetImage.status == "active").first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    row = db.query(AssetEntity).filter(AssetEntity.id == image.asset_id, AssetEntity.project_id == project_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    image.status = "deleted"
    db.add(image)
    # Guard point: future S4 binding check should prevent deleting in-use image_id.
    asset_library_service._ensure_cover(db, row)
    _mark_step3_and_stale_step4(db, project_id)
    db.commit()
    db.refresh(row)
    return AssetDetailSchema.model_validate(asset_library_service.to_detail(db, row))


@router.delete("/library/{asset_id}")
async def delete_asset_library(asset_id: int, project_id: int, db: Session = Depends(get_db)):
    row = db.query(AssetEntity).filter(AssetEntity.id == asset_id, AssetEntity.project_id == project_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    # Guard point: future S4引用检查可在这里拦截硬删除。
    row.status = "deleted"
    db.add(row)
    for img in db.query(AssetImage).filter(AssetImage.asset_id == row.id).all():
        img.status = "deleted"
        db.add(img)
    _mark_step3_and_stale_step4(db, project_id)
    db.commit()
    return {"ok": True, "asset_id": asset_id}
