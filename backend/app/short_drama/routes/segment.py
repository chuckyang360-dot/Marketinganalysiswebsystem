import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import SegmentScriptRecord
from ..schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from ..schemas.segment import GenerateSegmentsRequest, GenerateSegmentsResponse, SegmentScriptSchema
from ..schemas.story import StoryBlueprintSchema
from ..services.read_models import latest_story_blueprint, list_asset_rows, next_segment_batch_version
from ..services.segment_director_service import segment_director_service
from ..services.project_state_service import STEP_4, mark_step_completed, update_last_active_step
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=GenerateSegmentsResponse)
async def generate_segments(body: GenerateSegmentsRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /segment/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(db, project, WorkflowStep.GENERATE_SEGMENTS)

        sb_row = latest_story_blueprint(db, body.project_id)
        if not sb_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story blueprint missing; run /story/generate first",
            )

        chars, scenes, products = list_asset_rows(db, body.project_id)
        if not chars and not scenes and not products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset specs missing; run /assets/specs/generate first",
            )

        blueprint = StoryBlueprintSchema.model_validate(sb_row.blueprint_json)
        assets = AssetSpecsBundleSchema(
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

        project_config = {
            "duration": project.duration,
            "format": project.format,
            "style": project.style,
            "visual_style": project.visual_style,
            "aspect_ratio": project.aspect_ratio,
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
            row = SegmentScriptRecord(
                project_id=body.project_id,
                segment_id=seg.segment_id,
                script_json=seg.model_dump(),
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
