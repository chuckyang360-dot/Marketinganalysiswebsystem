from __future__ import annotations

import logging
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from ..schemas.product import ProductContextSchema
from ..schemas.story import StoryBlueprintSchema
from ..utils.enums import AssetRoleType, SceneType
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
        feat = (product.core_features[0] if product.core_features else None) or (
            product.selling_points[0] if product.selling_points else "核心卖点占位"
        )
        return AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    name="林晓",
                    role_type=AssetRoleType.PROTAGONIST.value,
                    description="年轻上班族，注重效率与形象",
                    visual_prompt="mock: 亚洲女性，25岁，休闲职场穿搭，自然光",
                    image_url=None,
                    meta={"provider": "mock"},
                ),
                CharacterAssetSchema(
                    name="店员阿杰",
                    role_type=AssetRoleType.SUPPORTING.value,
                    description="友善配角，推动试用",
                    visual_prompt="mock: 亚洲男性店员，微笑，简洁背景",
                    image_url=None,
                    meta={"provider": "mock"},
                ),
            ],
            scenes=[
                SceneAssetSchema(
                    name="地铁口清晨",
                    scene_type=SceneType.EXTERIOR.value,
                    description="人流、晨光、快节奏",
                    visual_prompt="mock: 城市街景，浅景深，清新色调",
                    image_url=None,
                    meta={"provider": "mock", "segment_id": "seg_1"},
                ),
                SceneAssetSchema(
                    name="便利店陈列区",
                    scene_type=SceneType.INTERIOR.value,
                    description="货架、手持镜头感",
                    visual_prompt="mock: 暖色室内光，货架层次清晰",
                    image_url=None,
                    meta={"provider": "mock", "segment_id": "seg_2"},
                ),
            ],
            products=[
                ProductAssetSchema(
                    name=pname,
                    description=feat,
                    visual_prompt=f"mock: 产品 hero shot，{pname}，干净背景，微距细节",
                    image_url=None,
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
                description=(str(row.get("description")) if row.get("description") is not None else None),
                visual_prompt=(str(row.get("visual_prompt")) if row.get("visual_prompt") is not None else None),
                image_url=None,
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
                description=(str(row.get("description")) if row.get("description") is not None else None),
                visual_prompt=(str(row.get("visual_prompt")) if row.get("visual_prompt") is not None else None),
                image_url=None,
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
