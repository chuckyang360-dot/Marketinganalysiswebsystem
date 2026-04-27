from __future__ import annotations

import logging
import json
from typing import Any

from ...config import settings
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.product import ProductImageUnderstandingSchema, ProductRawInputSchema
from ..utils.prompts import PRODUCT_IMAGE_UNDERSTANDING_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def _build_s1_image_understanding_text_payload(raw_input: ProductRawInputSchema) -> dict[str, Any]:
    image_items: list[dict[str, Any]] = []
    for row in raw_input.product_images:
        image_items.append(
            {
                "image_order": int(row.image_order or 0),
                "is_main_image": bool(row.is_main_image),
            }
        )
    return {
        "product_name_raw": raw_input.product_name_raw,
        "product_category_raw": raw_input.product_category_raw,
        "brand_raw": raw_input.brand_raw,
        "price_raw": raw_input.price_raw,
        "target_users_raw": raw_input.target_users_raw,
        "selling_points_raw": list(raw_input.selling_points_raw or []),
        "usage_scenarios_raw": list(raw_input.usage_scenarios_raw or []),
        "extra_notes_raw": raw_input.extra_notes_raw,
        "product_images_summary": {
            "image_count": len(image_items),
            "items": image_items,
        },
    }


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
        text_payload = _build_s1_image_understanding_text_payload(raw_input)
        text_payload_json = json.dumps(text_payload, ensure_ascii=False)
        contains_data_url_in_text = "data:image" in text_payload_json.lower()
        contains_base64_marker_in_text = "base64," in text_payload_json.lower()
        logger.info(
            "[S1_IMAGE_PAYLOAD_SANITIZED] project_id=%s image_count=%s image_input_count=%s text_chars=%s contains_data_url_in_text=%s contains_base64_marker_in_text=%s",
            project_id,
            len(image_urls),
            len(image_urls),
            len(text_payload_json),
            contains_data_url_in_text,
            contains_base64_marker_in_text,
        )
        if contains_data_url_in_text:
            logger.warning(
                "[S1_IMAGE_PAYLOAD_TEXT_CONTAINS_DATA_URL] project_id=%s image_count=%s",
                project_id,
                len(image_urls),
            )
        payload: dict[str, Any] = {
            "project_id": project_id,
            "raw_input": text_payload,
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
