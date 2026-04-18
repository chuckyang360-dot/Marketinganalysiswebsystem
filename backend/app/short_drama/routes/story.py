import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import StoryBlueprintRecord
from ..schemas.product import ProductContextSchema
from ..schemas.story import GenerateStoryRequest, GenerateStoryResponse, StoryBlueprintSchema
from ..services.read_models import latest_product_context, next_story_version
from ..services.story_planner_service import story_planner_service
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=GenerateStoryResponse)
async def generate_story(body: GenerateStoryRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /story/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(project, WorkflowStep.GENERATE_STORY)

        pc_row = latest_product_context(db, body.project_id)
        if not pc_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product context missing; run /product/parse first",
            )

        product = ProductContextSchema.model_validate(pc_row.normalized_context_json)
        project_config = {
            "duration": project.duration,
            "format": project.format,
            "style": project.style,
            "visual_style": project.visual_style,
            "aspect_ratio": project.aspect_ratio,
        }

        try:
            blueprint = story_planner_service.generate(body.project_id, product, project_config)
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            orchestrator.mark_failed(db, project)
            db.commit()
            raise_short_drama_http(e)
        except Exception:
            logger.exception("Story generation unexpected error project_id=%s", body.project_id)
            orchestrator.mark_failed(db, project)
            db.commit()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Story generation failed")

        version = next_story_version(db, body.project_id)
        record = StoryBlueprintRecord(
            project_id=body.project_id,
            blueprint_json=blueprint.model_dump(),
            version=version,
            approved=False,
        )
        db.add(record)
        orchestrator.advance_on_success(db, project, WorkflowStep.GENERATE_STORY)
        db.commit()
        db.refresh(record)

        log_api_success(
            logger,
            "POST /story/generate",
            project_id=body.project_id,
            record_id=record.id,
            version=record.version,
        )
        return GenerateStoryResponse(
            record_id=record.id,
            project_id=body.project_id,
            version=record.version,
            blueprint=StoryBlueprintSchema.model_validate(record.blueprint_json),
            approved=record.approved,
            created_at=record.created_at,
        )
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /story/generate",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise
