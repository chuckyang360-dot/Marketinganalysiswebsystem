from __future__ import annotations

import logging
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.product import ProductContextSchema, ProductInputSchema
from ..utils.prompts import PRODUCT_PARSER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ProductParserProvider(Protocol):
    def normalize(self, project_id: int, raw: Dict[str, Any]) -> ProductContextSchema: ...


class MockProductParserProvider:
    """Local fallback; returns schema-valid structured data without xAI."""

    def normalize(self, project_id: int, raw: Dict[str, Any]) -> ProductContextSchema:
        title = raw.get("title") or raw.get("description") or "未命名商品"
        brand = raw.get("brand") or ""
        bullets = raw.get("bullet_points") or []
        images = raw.get("image_urls") or []
        return ProductContextSchema(
            product_name=str(title)[:200],
            category="",
            brand_name=str(brand) if brand else "",
            visual_features=[],
            core_features=list(bullets)[:8] or ["mock core feature"],
            selling_points=list(raw.get("selling_points") or [])[:8],
            target_users=raw.get("audience") or "",
            usage_scenarios=[],
            brand_tone="真实、克制",
            constraints=["符合平台广告规范", "无医疗功效承诺"],
            notes_for_story="mock 占位：突出日常场景与产品解决方案。",
            meta={"provider": "mock", "source_image_urls": [str(u) for u in images][:10]},
        )


class XAIProductParserProvider:
    def __init__(self, text_provider: XAITextProvider):
        self._text = text_provider

    def normalize(self, project_id: int, raw: Dict[str, Any]) -> ProductContextSchema:
        logger.info(
            "PRODUCT_PARSE_STARTED %s",
            {"project_id": project_id, "stage": "PRODUCT_PARSE", "provider": "xai"},
        )
        try:
            image_urls = [str(u) for u in (raw.get("image_urls") or []) if u]
            data = self._text.generate_structured_json(
                project_id=project_id,
                service_name="product_parser",
                system_prompt=PRODUCT_PARSER_SYSTEM_PROMPT,
                user_payload={"product_input": raw, "project_id": project_id},
                image_urls=image_urls or None,
                expected_schema_name="ProductContext",
                stage="PRODUCT_PARSE",
            )
            if not (data.get("product_name") or "").strip():
                raise ShortDramaInvalidModelOutputError("product_name is required from model output")
            meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
            merged_meta = {**meta, "source_image_urls": image_urls, "provider": "xai"}
            ctx = ProductContextSchema.model_validate({**data, "meta": merged_meta})
            logger.info(
                "PRODUCT_PARSE_SUCCEEDED %s",
                {"project_id": project_id, "stage": "PRODUCT_PARSE", "provider": "xai"},
            )
            return ctx
        except Exception as e:
            logger.info(
                "PRODUCT_PARSE_FAILED %s",
                {
                    "project_id": project_id,
                    "stage": "PRODUCT_PARSE",
                    "provider": "xai",
                    "error_type": type(e).__name__,
                },
            )
            raise


class ProductParserService:
    def __init__(self, provider: ProductParserProvider | None = None):
        self._provider = provider or MockProductParserProvider()

    def parse(self, project_id: int, inp: ProductInputSchema) -> ProductContextSchema:
        raw = inp.model_dump(exclude_none=True)
        return self._provider.normalize(project_id, raw)


def _build_product_parser_service() -> ProductParserService:
    if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
        return ProductParserService(MockProductParserProvider())
    return ProductParserService(XAIProductParserProvider(get_xai_text_provider()))


product_parser_service = _build_product_parser_service()
