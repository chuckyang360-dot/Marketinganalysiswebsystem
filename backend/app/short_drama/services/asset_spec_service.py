from __future__ import annotations

import logging
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from ..schemas.product import ProductContextSchema
from ..schemas.story import StoryBlueprintSchema
from ..utils.prompts import ASSET_SPEC_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class AssetSpecProvider(Protocol):
    def build_specs(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
    ) -> AssetSpecsBundleSchema: ...


class MockAssetSpecProvider:
    def build_specs(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
    ) -> AssetSpecsBundleSchema:
        pname = product.product_name
        feat = (
            product.core_selling_points[0]
            if product.core_selling_points
            else (product.key_functions[0] if product.key_functions else "核心卖点占位")
        )
        visual_hint = "、".join(product.visual_features[:3]) if product.visual_features else "标准外观"
        consistency_hint = "；".join(product.consistency_notes[:2]) if product.consistency_notes else "保持主体一致"
        return AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    name="林晓",
                    role_type="main",
                    description="年轻上班族，注重效率与形象",
                    visual_prompt="mock: 亚洲女性，25岁，休闲职场穿搭，自然光",
                    image_url=None,
                    source_asset_version="mock-v1",
                    exposure_priority="primary",
                    narrative_function="hook",
                    purpose="hero",
                    meta={"provider": "mock"},
                ),
                CharacterAssetSchema(
                    name="店员阿杰",
                    role_type="supporting",
                    description="友善配角，推动试用",
                    visual_prompt="mock: 亚洲男性店员，微笑，简洁背景",
                    image_url=None,
                    source_asset_version="mock-v1",
                    exposure_priority="secondary",
                    narrative_function="conflict",
                    purpose="support",
                    meta={"provider": "mock"},
                ),
            ],
            scenes=[
                SceneAssetSchema(
                    name="地铁口清晨",
                    scene_type="hook",
                    scene_form="exterior",
                    description="人流、晨光、快节奏",
                    visual_prompt="mock: 城市街景，浅景深，清新色调",
                    image_url=None,
                    source_asset_version="mock-v1",
                    exposure_priority="secondary",
                    narrative_function="hook",
                    purpose="narrative",
                    meta={"provider": "mock", "segment_id": "seg_1"},
                ),
                SceneAssetSchema(
                    name="便利店陈列区",
                    scene_type="conflict",
                    scene_form="interior",
                    description="货架、手持镜头感",
                    visual_prompt="mock: 暖色室内光，货架层次清晰",
                    image_url=None,
                    source_asset_version="mock-v1",
                    exposure_priority="secondary",
                    narrative_function="conflict",
                    purpose="narrative",
                    meta={"provider": "mock", "segment_id": "seg_2"},
                ),
            ],
            products=[
                ProductAssetSchema(
                    name=pname,
                    product_role="hero",
                    description=feat,
                    visual_prompt=f"mock: 产品 hero shot，{pname}，{visual_hint}，{consistency_hint}",
                    image_url=None,
                    source_asset_version="mock-v1",
                    exposure_priority="primary",
                    narrative_function="resolution",
                    purpose="hero",
                    meta={"provider": "mock", "premise": blueprint.premise},
                )
            ],
        )


class XAIAssetSpecProvider:
    def __init__(self, text_provider: XAITextProvider):
        self._text = text_provider

    def build_specs(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
    ) -> AssetSpecsBundleSchema:
        logger.info(
            "ASSET_SPEC_GENERATION_STARTED %s",
            {"project_id": project_id, "stage": "ASSET_SPEC_GENERATION", "provider": "xai"},
        )
        try:
            data = self._text.generate_structured_json(
                project_id=project_id,
                service_name="asset_spec",
                system_prompt=ASSET_SPEC_SYSTEM_PROMPT,
                user_payload={
                    "project_id": project_id,
                    "product_context": product.model_dump(),
                    "s1_context_for_assets": {
                        "visual_features": product.visual_features,
                        "product_form": product.product_form,
                        "consistency_notes": product.consistency_notes,
                        "usage_scenarios": product.usage_scenarios,
                        "visual_risk_notes": product.visual_risk_notes,
                    },
                    "story_blueprint": blueprint.model_dump(),
                },
                image_urls=None,
                expected_schema_name="AssetSpecsBundle",
                stage="ASSET_SPEC_GENERATION",
            )
            bundle = _validate_asset_bundle(data)
            logger.info(
                "ASSET_SPEC_GENERATION_SUCCEEDED %s",
                {"project_id": project_id, "stage": "ASSET_SPEC_GENERATION", "provider": "xai"},
            )
            return bundle
        except Exception as e:
            logger.info(
                "ASSET_SPEC_GENERATION_FAILED %s",
                {
                    "project_id": project_id,
                    "stage": "ASSET_SPEC_GENERATION",
                    "provider": "xai",
                    "error_type": type(e).__name__,
                },
            )
            raise


def _validate_asset_bundle(data: dict[str, Any]) -> AssetSpecsBundleSchema:
    for key in ("characters", "scenes", "products"):
        if key not in data or not isinstance(data[key], list):
            raise ShortDramaInvalidModelOutputError(f"Missing or invalid list: {key}")
    chars: list[CharacterAssetSchema] = []
    for row in data["characters"]:
        if not isinstance(row, dict) or not (row.get("name") or "").strip():
            raise ShortDramaInvalidModelOutputError("Invalid character row")
        m = row.get("meta_json")
        meta = m if isinstance(m, dict) else {}
        chars.append(
            CharacterAssetSchema(
                name=str(row["name"]).strip(),
                role_type=str(row.get("role_type") or "").strip(),
                description=(str(row.get("description")) if row.get("description") is not None else None),
                visual_prompt=(str(row.get("visual_prompt")) if row.get("visual_prompt") is not None else None),
                image_url=None,
                source_asset_version=str(row.get("source_asset_version") or "legacy-1"),
                exposure_priority=str(row.get("exposure_priority") or "secondary"),
                narrative_function=(str(row.get("narrative_function")) if row.get("narrative_function") is not None else None),
                purpose=(str(row.get("purpose")) if row.get("purpose") is not None else None),
                meta={**meta, "provider": "xai"},
            )
        )
    scenes: list[SceneAssetSchema] = []
    for row in data["scenes"]:
        if not isinstance(row, dict) or not (row.get("name") or "").strip():
            raise ShortDramaInvalidModelOutputError("Invalid scene row")
        m = row.get("meta_json")
        meta = m if isinstance(m, dict) else {}
        scenes.append(
            SceneAssetSchema(
                name=str(row["name"]).strip(),
                scene_type=str(row.get("scene_type") or "").strip(),
                scene_form=(str(row.get("scene_form")) if row.get("scene_form") is not None else None),
                description=(str(row.get("description")) if row.get("description") is not None else None),
                visual_prompt=(str(row.get("visual_prompt")) if row.get("visual_prompt") is not None else None),
                image_url=None,
                source_asset_version=str(row.get("source_asset_version") or "legacy-1"),
                exposure_priority=str(row.get("exposure_priority") or "secondary"),
                narrative_function=(str(row.get("narrative_function")) if row.get("narrative_function") is not None else None),
                purpose=(str(row.get("purpose")) if row.get("purpose") is not None else None),
                meta={**meta, "provider": "xai"},
            )
        )
    products: list[ProductAssetSchema] = []
    for row in data["products"]:
        if not isinstance(row, dict) or not (row.get("name") or "").strip():
            raise ShortDramaInvalidModelOutputError("Invalid product row")
        m = row.get("meta_json")
        meta = m if isinstance(m, dict) else {}
        products.append(
            ProductAssetSchema(
                name=str(row["name"]).strip(),
                product_role=(str(row.get("product_role")) if row.get("product_role") is not None else None),
                description=(str(row.get("description")) if row.get("description") is not None else None),
                visual_prompt=(str(row.get("visual_prompt")) if row.get("visual_prompt") is not None else None),
                image_url=None,
                source_asset_version=str(row.get("source_asset_version") or "legacy-1"),
                exposure_priority=str(row.get("exposure_priority") or "secondary"),
                narrative_function=(str(row.get("narrative_function")) if row.get("narrative_function") is not None else None),
                purpose=(str(row.get("purpose")) if row.get("purpose") is not None else None),
                meta={**meta, "provider": "xai"},
            )
        )
    if not chars or not scenes or not products:
        raise ShortDramaInvalidModelOutputError("characters, scenes, and products must be non-empty")
    return AssetSpecsBundleSchema(characters=chars, scenes=scenes, products=products)


class AssetSpecService:
    def __init__(self, provider: AssetSpecProvider | None = None):
        self._provider = provider or MockAssetSpecProvider()

    def generate(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
    ) -> AssetSpecsBundleSchema:
        return self._provider.build_specs(project_id, product, blueprint)


def _build_asset_spec_service() -> AssetSpecService:
    if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
        return AssetSpecService(MockAssetSpecProvider())
    return AssetSpecService(XAIAssetSpecProvider(get_xai_text_provider()))


asset_spec_service = _build_asset_spec_service()
