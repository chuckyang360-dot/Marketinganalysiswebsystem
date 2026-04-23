from __future__ import annotations

import logging
from typing import Any

from ...config import settings
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.product import ProductContextSchema, ProductImageUnderstandingSchema, ProductRawInputSchema
from ..utils.prompts import PRODUCT_CONTEXT_BUILDER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ProductContextBuilderService:
    def __init__(self, text_provider: XAITextProvider | None = None):
        self._text = text_provider or get_xai_text_provider()

    def build(
        self,
        project_id: int,
        raw_input: ProductRawInputSchema,
        image_understanding: ProductImageUnderstandingSchema,
        project_constraints: dict[str, Any] | None = None,
    ) -> ProductContextSchema:
        if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
            out = ProductContextSchema(
                product_name=raw_input.product_name_raw or "未命名产品",
                product_category=raw_input.product_category_raw,
                product_summary=f"{raw_input.product_name_raw}，适用于{raw_input.target_users_raw}"[:220],
                core_selling_points=list(raw_input.selling_points_raw)[:8],
                target_users=[raw_input.target_users_raw] if raw_input.target_users_raw else [],
                usage_scenarios=list(raw_input.usage_scenarios_raw)[:8],
                visual_features=list(image_understanding.detected_visual_features)[:10],
                product_form="",
                key_functions=list(raw_input.selling_points_raw)[:6],
                emotional_value=[],
                suitable_story_angles=["场景代入型", "痛点型"],
                visual_risk_notes=list(image_understanding.detected_quality_risks)[:8],
                consistency_notes=["主体外观与主图保持一致"],
                extracted_from_images=list(image_understanding.detected_visual_features)[:10],
                parse_confidence=0.55,
                source_trace={
                    "product_name": "user_input",
                    "visual_features": "image_understanding",
                    "product_summary": "merged_inference",
                },
            )
            logger.info("[S1_CONTEXT_BUILDER_RESULT] project_id=%s result=%s", project_id, out.model_dump())
            return out

        payload = {
            "project_id": project_id,
            "raw_input": raw_input.model_dump(),
            "image_understanding": image_understanding.model_dump(),
            "project_constraints": project_constraints or {},
        }
        data = self._text.generate_structured_json(
            project_id=project_id,
            service_name="product_context_builder",
            system_prompt=PRODUCT_CONTEXT_BUILDER_SYSTEM_PROMPT,
            user_payload=payload,
            image_urls=None,
            expected_schema_name="ProductContext",
            stage="PRODUCT_CONTEXT_BUILD",
        )
        out = ProductContextSchema.model_validate(data)
        logger.info("[S1_CONTEXT_BUILDER_RESULT] project_id=%s result=%s", project_id, out.model_dump())
        return out


product_context_builder_service = ProductContextBuilderService()
