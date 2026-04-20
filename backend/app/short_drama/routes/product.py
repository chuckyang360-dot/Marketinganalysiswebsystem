import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import ProductContextRecord
from ..schemas.product import ParseProductRequest, ParseProductResponse, ProductContextSchema
from ..services.product_parser_service import product_parser_service
from ..services.project_state_service import (
    STEP_1,
    mark_step_completed,
    propagate_downstream_stale,
    update_last_active_step,
)
from ..services.read_models import latest_product_context, next_product_context_version
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/parse", response_model=ParseProductResponse)
async def parse_product(body: ParseProductRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /product/parse", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(project, WorkflowStep.PARSE_PRODUCT)
        had_existing_context = latest_product_context(db, body.project_id) is not None

        try:
            normalized = product_parser_service.parse(body.project_id, body.input)
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            orchestrator.mark_failed(db, project)
            db.commit()
            raise_short_drama_http(e)
        except Exception:
            logger.exception("Product parse unexpected error project_id=%s", body.project_id)
            orchestrator.mark_failed(db, project)
            db.commit()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Product parse failed")

        version = next_product_context_version(db, body.project_id)
        record = ProductContextRecord(
            project_id=body.project_id,
            raw_inputs_json=body.input.model_dump(exclude_none=True),
            normalized_context_json=normalized.model_dump(),
            version=version,
        )
        db.add(record)
        mark_step_completed(project, STEP_1)
        if had_existing_context:
            propagate_downstream_stale(project, STEP_1)
        update_last_active_step(project, STEP_1)
        orchestrator.advance_on_success(db, project, WorkflowStep.PARSE_PRODUCT)
        db.commit()
        db.refresh(record)

        log_api_success(
            logger,
            "POST /product/parse",
            project_id=body.project_id,
            record_id=record.id,
            version=record.version,
        )
        return ParseProductResponse(
            record_id=record.id,
            project_id=body.project_id,
            version=record.version,
            raw_inputs=record.raw_inputs_json,
            product_context=ProductContextSchema.model_validate(record.normalized_context_json),
            created_at=record.created_at,
        )
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /product/parse",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise
