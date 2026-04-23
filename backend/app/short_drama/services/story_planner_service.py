from __future__ import annotations

import logging
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.product import ProductContextSchema
from ..schemas.story import SegmentPlanItemSchema, StoryBlueprintSchema
from ..utils.prompts import STORY_PLANNER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class StoryPlannerProvider(Protocol):
    def plan(
        self,
        project_id: int,
        product: ProductContextSchema,
        project_config: Dict[str, Any],
    ) -> StoryBlueprintSchema: ...


class MockStoryPlannerProvider:
    def plan(
        self,
        project_id: int,
        product: ProductContextSchema,
        project_config: Dict[str, Any],
    ) -> StoryBlueprintSchema:
        pname = product.product_name
        style = project_config.get("style") or "生活流"
        duration = project_config.get("duration") or "45s"
        fmt = project_config.get("format") or "single_ad"
        summary = (product.product_summary or "").strip()
        users = "、".join([u for u in product.target_users if u][:2]) or "泛用户"
        angle = (product.suitable_story_angles[0] if product.suitable_story_angles else "场景代入型")
        emotion = (product.emotional_value[0] if product.emotional_value else "获得感")
        return StoryBlueprintSchema(
            title=f"{pname} · 都市轻喜剧短片",
            format=fmt,
            style=style,
            premise=f"{summary or f'主角在真实日常压力中遇到与 {pname} 相关的选择。'}（目标用户：{users}）",
            hook="强共鸣开场：尴尬/赶时间/社交压力",
            core_conflict=f"信任与试错成本（叙事角度：{angle}）",
            twist="产品以自然方式破局",
            resolution=f"情绪落地（{emotion}） + 品牌正向记忆点",
            segment_plan=[
                SegmentPlanItemSchema(
                    segment_id="seg_1",
                    goal="建立共鸣与悬念",
                    duration_seconds=12.0,
                    story_beat="hook",
                    summary="快节奏生活切片，抛出痛点",
                    product_exposure_mode="none_or_blurred",
                ),
                SegmentPlanItemSchema(
                    segment_id="seg_2",
                    goal="引入产品与体验",
                    duration_seconds=15.0,
                    story_beat="build",
                    summary="产品出现与试用，展示核心特征",
                    product_exposure_mode="hero_demo",
                ),
                SegmentPlanItemSchema(
                    segment_id="seg_3",
                    goal="反转收尾与 CTA",
                    duration_seconds=18.0,
                    story_beat="resolution",
                    summary="结果验证 + 轻 CTA",
                    product_exposure_mode="logo_packshot",
                ),
            ],
            meta={"provider": "mock", "duration_hint": duration},
        )


class XAIStoryPlannerProvider:
    def __init__(self, text_provider: XAITextProvider):
        self._text = text_provider

    def plan(
        self,
        project_id: int,
        product: ProductContextSchema,
        project_config: Dict[str, Any],
    ) -> StoryBlueprintSchema:
        logger.info(
            "STORY_GENERATION_STARTED %s",
            {"project_id": project_id, "stage": "STORY_GENERATION", "provider": "xai"},
        )
        try:
            data = self._text.generate_structured_json(
                project_id=project_id,
                service_name="story_planner",
                system_prompt=STORY_PLANNER_SYSTEM_PROMPT,
                user_payload={
                    "project_id": project_id,
                    "project_config": project_config,
                    "product_context": product.model_dump(),
                    "s1_context_for_story": {
                        "product_name": product.product_name,
                        "product_summary": product.product_summary,
                        "core_selling_points": product.core_selling_points,
                        "target_users": product.target_users,
                        "usage_scenarios": product.usage_scenarios,
                        "emotional_value": product.emotional_value,
                        "suitable_story_angles": product.suitable_story_angles,
                    },
                },
                image_urls=None,
                expected_schema_name="StoryBlueprint",
                stage="STORY_GENERATION",
            )
            blueprint = StoryBlueprintSchema.model_validate(data)
            if len(blueprint.segment_plan) != 3:
                raise ShortDramaInvalidModelOutputError(
                    f"segment_plan must have exactly 3 items, got {len(blueprint.segment_plan)}"
                )
            logger.info(
                "STORY_GENERATION_SUCCEEDED %s",
                {"project_id": project_id, "stage": "STORY_GENERATION", "provider": "xai"},
            )
            return blueprint
        except Exception as e:
            logger.info(
                "STORY_GENERATION_FAILED %s",
                {
                    "project_id": project_id,
                    "stage": "STORY_GENERATION",
                    "provider": "xai",
                    "error_type": type(e).__name__,
                },
            )
            raise


class StoryPlannerService:
    def __init__(self, provider: StoryPlannerProvider | None = None):
        self._provider = provider or MockStoryPlannerProvider()

    def generate(
        self,
        project_id: int,
        product: ProductContextSchema,
        project_config: Dict[str, Any],
    ) -> StoryBlueprintSchema:
        return self._provider.plan(project_id, product, project_config)


def _build_story_planner_service() -> StoryPlannerService:
    if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
        return StoryPlannerService(MockStoryPlannerProvider())
    return StoryPlannerService(XAIStoryPlannerProvider(get_xai_text_provider()))


story_planner_service = _build_story_planner_service()
