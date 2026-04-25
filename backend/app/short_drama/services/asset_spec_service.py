from __future__ import annotations

import logging
import re
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from ..schemas.product import ProductContextSchema
from ..schemas.story import StoryBlueprintSchema
from ..utils.prompts import ASSET_SPEC_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_PLOT_STATE_TERMS = (
    "struggle",
    "conflict",
    "flashback",
    "energized",
    "workout",
    "failure",
    "comeback",
    "angry",
    "moment",
    "training",
    "using",
    "drinking",
    "fighting",
    "crying",
    "celebrating",
    "挣扎",
    "冲突",
    "闪回",
    "回忆",
    "训练",
    "使用",
    "喝",
    "愤怒",
    "失败",
    "逆袭",
    "情绪",
)

_LOCATION_RULES: tuple[tuple[str, str, str], ...] = (
    ("home gym", "家庭健身房", "Home Gym"),
    ("gym", "家庭健身房", "Home Gym"),
    ("office desk", "办公桌区域", "Office Desk"),
    ("office", "办公室", "Office"),
    ("kitchen", "厨房", "Kitchen"),
    ("park", "公园", "Outdoor Park"),
    ("bedroom", "卧室", "Bedroom"),
    ("living room", "客厅", "Living Room"),
    ("suburban kitchen", "郊区厨房", "Suburban Kitchen"),
    ("健身房", "家庭健身房", "Home Gym"),
    ("办公室", "办公室", "Office"),
    ("厨房", "厨房", "Kitchen"),
    ("公园", "公园", "Outdoor Park"),
    ("卧室", "卧室", "Bedroom"),
    ("客厅", "客厅", "Living Room"),
)

_PRODUCT_SCENE_TERMS = (
    "in gym",
    "in kitchen",
    "in office",
    "gym scene",
    "kitchen scene",
    "office scene",
    "advertising scene",
    "story scene",
    "with person",
    "with human",
    "being used",
    "使用场景",
    "健身房剧情",
    "厨房广告",
    "人物使用",
)


def _clean_ws(text: str | None) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip(" ,;:，；：")


def _strip_plot_terms(text: str | None) -> tuple[str, list[str]]:
    raw = _clean_ws(text)
    warnings: list[str] = []
    out = raw
    for term in _PLOT_STATE_TERMS:
        if re.search(rf"\b{re.escape(term)}\b", out, flags=re.IGNORECASE) or term in out:
            warnings.append(f"removed plot/action term: {term}")
            out = re.sub(rf"\b{re.escape(term)}\b", " ", out, flags=re.IGNORECASE)
            out = out.replace(term, " ")
    out = _clean_ws(out)
    return out, list(dict.fromkeys(warnings))


def _strip_product_scene_terms(text: str | None) -> tuple[str, list[str]]:
    out, warnings = _strip_plot_terms(text)
    for term in _PRODUCT_SCENE_TERMS:
        if term.lower() in out.lower():
            warnings.append(f"removed product scene/usage term: {term}")
            out = re.sub(re.escape(term), " ", out, flags=re.IGNORECASE)
    return _clean_ws(out), list(dict.fromkeys(warnings))


def _language_prefers_chinese(workflow_language: str | None) -> bool:
    return str(workflow_language or "").lower().startswith("zh")


def _scene_identity(
    name: str | None,
    description: str | None,
    visual_prompt: str | None,
    workflow_language: str | None,
) -> tuple[str, list[str]]:
    corpus = f"{name or ''} {description or ''} {visual_prompt or ''}".lower()
    warnings: list[str] = []
    prefers_zh = _language_prefers_chinese(workflow_language)
    for needle, zh_label, en_label in _LOCATION_RULES:
        if needle in corpus:
            label = zh_label if prefers_zh else en_label
            if _clean_ws(name) != label:
                warnings.append(f"scene identity normalized to reusable location: {label}")
            return label, warnings
    cleaned, term_warnings = _strip_plot_terms(name)
    warnings.extend(term_warnings)
    if not cleaned:
        cleaned = "Scene Location"
        warnings.append("scene name had no stable location after removing plot terms")
    return cleaned, warnings


def _asset_prompt_prefix(kind: str) -> str:
    if kind == "character":
        return "clean character reference, plain white or transparent background, full body or half body, no plot action, no product interaction"
    if kind == "scene":
        return "empty reusable location background plate, no main character, no story action, stable camera-safe set reference"
    return "product-only reference, clean studio product shot, simple white or transparent background, no human, no scene story"


class AssetSpecProvider(Protocol):
    def build_specs(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
        project_config: Dict[str, Any] | None = None,
    ) -> AssetSpecsBundleSchema: ...


class MockAssetSpecProvider:
    def build_specs(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
        project_config: Dict[str, Any] | None = None,
    ) -> AssetSpecsBundleSchema:
        pname = product.product_name
        feat = (
            product.core_selling_points[0]
            if product.core_selling_points
            else (product.key_functions[0] if product.key_functions else "核心卖点占位")
        )
        visual_hint = "、".join(product.visual_features[:3]) if product.visual_features else "标准外观"
        consistency_hint = "；".join(product.consistency_notes[:2]) if product.consistency_notes else "保持主体一致"
        visual_style = (project_config or {}).get("visual_style") or "cinematic"
        aspect_ratio = (project_config or {}).get("aspect_ratio") or "9:16"
        bundle = AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    name="林晓",
                    role_type="main",
                    description="年轻上班族，注重效率与形象",
                    visual_prompt=f"mock: 亚洲女性，25岁，休闲职场穿搭，自然光，{visual_style}，{aspect_ratio}",
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
                    visual_prompt=f"mock: 亚洲男性店员，微笑，简洁背景，{visual_style}，{aspect_ratio}",
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
                    visual_prompt=f"mock: 城市街景，浅景深，清新色调，{visual_style}，{aspect_ratio}",
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
                    visual_prompt=f"mock: 暖色室内光，货架层次清晰，{visual_style}，{aspect_ratio}",
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
                    visual_prompt=(
                        f"mock: 产品 hero shot，{pname}，{visual_hint}，{consistency_hint}，"
                        f"MUST: {visual_hint}；DO NOT: {'；'.join(product.visual_risk_notes[:3])}，"
                        f"{visual_style}，{aspect_ratio}"
                    ),
                    image_url=None,
                    source_asset_version="mock-v1",
                    exposure_priority="primary",
                    narrative_function="resolution",
                    purpose="hero",
                    meta={"provider": "mock", "premise": blueprint.premise},
                )
            ],
        )
        return _normalize_asset_bundle(
            bundle,
            workflow_language=(project_config or {}).get("workflow_language"),
        )


class XAIAssetSpecProvider:
    def __init__(self, text_provider: XAITextProvider):
        self._text = text_provider

    def build_specs(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
        project_config: Dict[str, Any] | None = None,
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
                    "project_config": project_config or {},
                    "language_policy": (project_config or {}).get("language_policy", {}),
                    "language_prompt_rules": (project_config or {}).get("language_prompt_rules", ""),
                    "s2_visual_requirements": blueprint.visual_requirements,
                },
                image_urls=None,
                expected_schema_name="AssetSpecsBundle",
                stage="ASSET_SPEC_GENERATION",
            )
            bundle = _normalize_asset_bundle(
                _validate_asset_bundle(data),
                product_name=product.product_name,
                workflow_language=(project_config or {}).get("workflow_language"),
            )
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
                asset_identity=str(row.get("asset_identity") or "").strip() or None,
                boundary_warnings=list(row.get("boundary_warnings") or []),
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
                asset_identity=str(row.get("asset_identity") or "").strip() or None,
                boundary_warnings=list(row.get("boundary_warnings") or []),
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
                asset_identity=str(row.get("asset_identity") or "").strip() or None,
                boundary_warnings=list(row.get("boundary_warnings") or []),
                meta={**meta, "provider": "xai"},
            )
        )
    if not chars or not scenes or not products:
        raise ShortDramaInvalidModelOutputError("characters, scenes, and products must be non-empty")
    return AssetSpecsBundleSchema(characters=chars, scenes=scenes, products=products)


def _normalize_character_asset(row: CharacterAssetSchema) -> CharacterAssetSchema:
    name, name_warnings = _strip_plot_terms(row.name)
    desc, desc_warnings = _strip_plot_terms(row.description)
    prompt, prompt_warnings = _strip_plot_terms(row.visual_prompt)
    prompt = ", ".join(x for x in [_asset_prompt_prefix("character"), prompt] if x)
    warnings = list(dict.fromkeys([*row.boundary_warnings, *name_warnings, *desc_warnings, *prompt_warnings]))
    meta = {
        **(row.meta or {}),
        "asset_boundary": "character_reference",
        "forbidden_in_asset": "plot action / emotion event / product interaction",
    }
    return row.model_copy(
        update={
            "name": name or row.name,
            "description": desc or row.description,
            "visual_prompt": prompt,
            "asset_identity": row.asset_identity or (name or row.name),
            "boundary_warnings": warnings,
            "meta": meta,
        }
    )


def _normalize_scene_asset(row: SceneAssetSchema, workflow_language: str | None) -> SceneAssetSchema:
    identity, identity_warnings = _scene_identity(
        row.name,
        row.description,
        row.visual_prompt,
        workflow_language,
    )
    desc, desc_warnings = _strip_plot_terms(row.description)
    prompt, prompt_warnings = _strip_plot_terms(row.visual_prompt)
    prompt = ", ".join(x for x in [_asset_prompt_prefix("scene"), identity, prompt] if x)
    warnings = list(dict.fromkeys([*row.boundary_warnings, *identity_warnings, *desc_warnings, *prompt_warnings]))
    meta = {
        **(row.meta or {}),
        "asset_boundary": "empty_location",
        "location_identity": identity,
        "forbidden_in_asset": "emotion state / conflict / shot action / character-driven drama",
    }
    return row.model_copy(
        update={
            "name": identity,
            "description": desc or f"Reusable empty location reference for {identity}",
            "visual_prompt": prompt,
            "asset_identity": identity,
            "boundary_warnings": warnings,
            "meta": meta,
        }
    )


def _normalize_product_asset(row: ProductAssetSchema, product_name: str | None = None) -> ProductAssetSchema:
    fallback_name = _clean_ws(product_name) or row.name
    name, name_warnings = _strip_product_scene_terms(row.name or fallback_name)
    desc, desc_warnings = _strip_product_scene_terms(row.description)
    prompt, prompt_warnings = _strip_product_scene_terms(row.visual_prompt)
    prompt = ", ".join(x for x in [_asset_prompt_prefix("product"), name or fallback_name, prompt] if x)
    warnings = list(dict.fromkeys([*row.boundary_warnings, *name_warnings, *desc_warnings, *prompt_warnings]))
    meta = {
        **(row.meta or {}),
        "asset_boundary": "product_only",
        "forbidden_in_asset": "human usage / scene story / plot interaction",
    }
    return row.model_copy(
        update={
            "name": name or fallback_name,
            "description": desc or row.description or "Product-only reference asset",
            "visual_prompt": prompt,
            "asset_identity": name or fallback_name,
            "boundary_warnings": warnings,
            "meta": meta,
        }
    )


def _normalize_asset_bundle(
    bundle: AssetSpecsBundleSchema,
    product_name: str | None = None,
    workflow_language: str | None = None,
) -> AssetSpecsBundleSchema:
    chars = [_normalize_character_asset(c) for c in bundle.characters]

    scenes_by_identity: dict[str, SceneAssetSchema] = {}
    for scene in bundle.scenes:
        normalized = _normalize_scene_asset(scene, workflow_language)
        key = _clean_ws(normalized.asset_identity or normalized.name).casefold()
        if key in scenes_by_identity:
            prev = scenes_by_identity[key]
            existing_sources = (prev.meta or {}).get("deduped_from", [])
            if not isinstance(existing_sources, list):
                existing_sources = []
            merged_warnings = list(dict.fromkeys([*prev.boundary_warnings, *normalized.boundary_warnings, "deduped duplicate scene by location identity"]))
            scenes_by_identity[key] = prev.model_copy(
                update={
                    "boundary_warnings": merged_warnings,
                    "meta": {**(prev.meta or {}), "deduped_from": [*existing_sources, normalized.name]},
                }
            )
            continue
        scenes_by_identity[key] = normalized

    products = [_normalize_product_asset(p, product_name=product_name) for p in bundle.products]
    return AssetSpecsBundleSchema(characters=chars, scenes=list(scenes_by_identity.values()), products=products)


class AssetSpecService:
    def __init__(self, provider: AssetSpecProvider | None = None):
        self._provider = provider or MockAssetSpecProvider()

    def generate(
        self,
        project_id: int,
        product: ProductContextSchema,
        blueprint: StoryBlueprintSchema,
        project_config: Dict[str, Any] | None = None,
    ) -> AssetSpecsBundleSchema:
        return self._provider.build_specs(project_id, product, blueprint, project_config or {})


def _build_asset_spec_service() -> AssetSpecService:
    if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
        return AssetSpecService(MockAssetSpecProvider())
    return AssetSpecService(XAIAssetSpecProvider(get_xai_text_provider()))


asset_spec_service = _build_asset_spec_service()
