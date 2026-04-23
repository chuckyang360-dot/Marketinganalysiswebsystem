from __future__ import annotations

import logging
from typing import Any

from ...config import settings
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.product import ProductImageUnderstandingSchema, ProductRawInputSchema
from ..utils.prompts import PRODUCT_IMAGE_UNDERSTANDING_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ProductImageUnderstandingService:
    def __init__(self, text_provider: XAITextProvider | None = None):
        self._text = text_provider or get_xai_text_provider()

    def understand(self, project_id: int, raw_input: ProductRawInputSchema) -> ProductImageUnderstandingSchema:
        image_urls = [row.image_url for row in raw_input.product_images if row.image_url]
        logger.info(
            "[S1_IMAGE_UNDERSTANDING_START] project_id=%s image_count=%s use_mock=%s",
            project_id,
            len(image_urls),
            settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER,
        )
        if not image_urls:
            out = ProductImageUnderstandingSchema()
            logger.info("[S1_IMAGE_UNDERSTANDING_RESULT] project_id=%s result=%s", project_id, out.model_dump())
            return out
        if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
            out = ProductImageUnderstandingSchema(
                detected_product_type=raw_input.product_category_raw,
                detected_visual_features=["mock_visual_feature"],
                per_image_notes=[{"image_url": u, "note": "mock"} for u in image_urls],
            )
            logger.info("[S1_IMAGE_UNDERSTANDING_RESULT] project_id=%s result=%s", project_id, out.model_dump())
            return out
        payload: dict[str, Any] = {
            "project_id": project_id,
            "raw_input": raw_input.model_dump(),
        }
        data = self._text.generate_structured_json(
            project_id=project_id,
            service_name="product_image_understanding",
            system_prompt=PRODUCT_IMAGE_UNDERSTANDING_SYSTEM_PROMPT,
            user_payload=payload,
            image_urls=image_urls,
            expected_schema_name="ProductImageUnderstanding",
            stage="PRODUCT_IMAGE_UNDERSTANDING",
        )
        out = ProductImageUnderstandingSchema.model_validate(data)
        logger.info("[S1_IMAGE_UNDERSTANDING_RESULT] project_id=%s result=%s", project_id, out.model_dump())
        return out


product_image_understanding_service = ProductImageUnderstandingService()
