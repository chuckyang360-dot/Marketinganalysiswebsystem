import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import ProductContextRecord
from ..schemas.product import (
    ParseProductRequest,
    ParseProductResponse,
    ProductContextSchema,
    ProductImageUnderstandingSchema,
    UpdateProductContextRequest,
    UpdateProductContextResponse,
)
from ..services.product_parser_service import product_parser_service
from ..services.project_state_service import (
    STEP_1,
    mark_step_completed,
    propagate_downstream_stale,
    update_last_active_step,
)
from ..services.read_models import latest_product_context, next_product_context_version
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import ProjectStatus, WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()

_PRODUCT_CONTEXT_FIELDS = [
    "product_name",
    "product_category",
    "product_summary",
    "core_selling_points",
    "target_users",
    "usage_scenarios",
    "visual_features",
    "product_form",
    "key_functions",
    "emotional_value",
    "suitable_story_angles",
    "visual_risk_notes",
    "consistency_notes",
    "extracted_from_images",
    "parse_confidence",
    "source_trace",
]


def _merge_context_by_mode(
    mode: str,
    prev: ProductContextSchema | None,
    nxt: ProductContextSchema,
) -> tuple[ProductContextSchema, list[str], list[str]]:
    if mode != "preserve_user_edited" or prev is None:
        return nxt, list(_PRODUCT_CONTEXT_FIELDS), []
    prev_data = prev.model_dump()
    next_data = nxt.model_dump()
    field_meta = dict(prev_data.get("field_meta") or {})
    updated_fields: list[str] = []
    preserved_fields: list[str] = []
    for field in _PRODUCT_CONTEXT_FIELDS:
        meta = field_meta.get(field) if isinstance(field_meta.get(field), dict) else {}
        edited = bool(meta.get("edited_by_user"))
        if edited:
            next_data[field] = prev_data.get(field)
            preserved_fields.append(field)
        else:
            updated_fields.append(field)
    next_data["field_meta"] = field_meta
    return ProductContextSchema.model_validate(next_data), updated_fields, preserved_fields


@router.post("/parse", response_model=ParseProductResponse)
async def parse_product(body: ParseProductRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /product/parse", project_id=body.project_id)
    logger.info(
        "[S1_PARSE_REQUEST] project_id=%s reparse_mode=%s input=%s",
        body.project_id,
        body.reparse_mode,
        body.input.model_dump(),
    )
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(db, project, WorkflowStep.PARSE_PRODUCT)
        existing_context = latest_product_context(db, body.project_id)
        had_existing_context = existing_context is not None

        status_before = project.status
        try:
            artifacts = product_parser_service.parse(
                body.project_id,
                body.input,
                project_constraints={
                    "duration": project.duration or "",
                    "format": project.format or "",
                    "style": project.style or "",
                    "visual_style": project.visual_style or "",
                    "aspect_ratio": project.aspect_ratio or "",
                },
            )
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            logger.info(
                "[SHORT_DRAMA_STEP_FAIL] project_id=%s step=%s error_type=%s project_status_before=%s project_status_after=%s",
                body.project_id,
                "S1_parse_product",
                type(e).__name__,
                status_before,
                project.status,
            )
            raise_short_drama_http(e)
        except Exception as e:
            logger.info(
                "[SHORT_DRAMA_STEP_FAIL] project_id=%s step=%s error_type=%s project_status_before=%s project_status_after=%s",
                body.project_id,
                "S1_parse_product",
                type(e).__name__,
                status_before,
                project.status,
            )
            logger.exception("Product parse unexpected error project_id=%s", body.project_id)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Product parse failed")

        prev_ctx = (
            ProductContextSchema.model_validate(existing_context.normalized_context_json)
            if existing_context
            else None
        )
        merged_context, updated_fields, preserved_fields = _merge_context_by_mode(
            body.reparse_mode,
            prev_ctx,
            artifacts.product_context,
        )
        version = next_product_context_version(db, body.project_id)
        record = ProductContextRecord(
            project_id=body.project_id,
            raw_inputs_json=artifacts.raw_input.model_dump(),
            image_understanding_json=artifacts.image_understanding.model_dump(),
            normalized_context_json=merged_context.model_dump(),
            parse_status="success",
            version=version,
        )
        db.add(record)
        mark_step_completed(project, STEP_1)
        if had_existing_context:
            propagate_downstream_stale(project, STEP_1)
        update_last_active_step(project, STEP_1)
        # First parse keeps linear bootstrap behavior; re-parse in later stages should
        # not forcibly rewind project.status and only mark downstream steps stale.
        if project.status == ProjectStatus.CREATED.value:
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
        resp = ParseProductResponse(
            record_id=record.id,
            project_id=body.project_id,
            version=record.version,
            parse_status=record.parse_status or "success",
            raw_inputs=record.raw_inputs_json,
            image_understanding=ProductImageUnderstandingSchema.model_validate(
                record.image_understanding_json or {}
            ),
            product_context=ProductContextSchema.model_validate(record.normalized_context_json),
            from_version=existing_context.version if existing_context else None,
            updated_fields=updated_fields,
            preserved_fields=preserved_fields,
            created_at=record.created_at,
        )
        logger.info(
            "[S1_PARSE_RESPONSE] project_id=%s record_id=%s version=%s from_version=%s updated_fields=%s preserved_fields=%s",
            body.project_id,
            record.id,
            record.version,
            existing_context.version if existing_context else None,
            updated_fields,
            preserved_fields,
        )
        return resp
        
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /product/parse",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise


@router.patch("/context", response_model=UpdateProductContextResponse)
async def update_product_context(body: UpdateProductContextRequest, db: Session = Depends(get_db)):
    project = orchestrator.get_project(db, body.project_id)
    orchestrator.assert_step_allowed(db, project, WorkflowStep.PARSE_PRODUCT)
    latest = latest_product_context(db, body.project_id)
    if not latest:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product context missing; run parse first")
    version = next_product_context_version(db, body.project_id)
    latest_ctx = ProductContextSchema.model_validate(latest.normalized_context_json)
    incoming = body.product_context.model_dump()
    latest_data = latest_ctx.model_dump()
    field_meta = dict(latest_data.get("field_meta") or {})
    for field in _PRODUCT_CONTEXT_FIELDS:
        if incoming.get(field) != latest_data.get(field):
            prev_meta = field_meta.get(field) if isinstance(field_meta.get(field), dict) else {}
            field_meta[field] = {
                **prev_meta,
                "edited_by_user": True,
                "edited_at": datetime.utcnow().isoformat(),
            }
    incoming["field_meta"] = field_meta
    record = ProductContextRecord(
        project_id=body.project_id,
        raw_inputs_json=latest.raw_inputs_json,
        image_understanding_json=latest.image_understanding_json,
        normalized_context_json=incoming,
        parse_status="edited",
        version=version,
    )
    db.add(record)
    mark_step_completed(project, STEP_1)
    propagate_downstream_stale(project, STEP_1)
    update_last_active_step(project, STEP_1)
    db.commit()
    db.refresh(record)
    return UpdateProductContextResponse(
        record_id=record.id,
        project_id=body.project_id,
        version=record.version,
        parse_status=record.parse_status or "edited",
        product_context=ProductContextSchema.model_validate(record.normalized_context_json),
        created_at=record.created_at,
    )
