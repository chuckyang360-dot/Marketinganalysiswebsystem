from __future__ import annotations

import logging
import re
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.product import ProductContextSchema
from ..schemas.story import SegmentPlanItemSchema, StoryBlueprintSchema
from ..utils.prompts import STORY_PLANNER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)
_SEG_IDS = ("seg_1", "seg_2", "seg_3")


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
        points = [p for p in product.core_selling_points if p][:3]
        bp = StoryBlueprintSchema(
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
                    source_selling_point=points[0] if points else "",
                    product_feature_to_show=(product.visual_features[0] if product.visual_features else ""),
                    target_user_trigger=users,
                    required_visual_elements=product.visual_features[:2],
                ),
                SegmentPlanItemSchema(
                    segment_id="seg_2",
                    goal="引入产品与体验",
                    duration_seconds=15.0,
                    story_beat="build",
                    summary="产品出现与试用，展示核心特征",
                    product_exposure_mode="hero_demo",
                    source_selling_point=points[1] if len(points) > 1 else (points[0] if points else ""),
                    product_feature_to_show=(product.visual_features[1] if len(product.visual_features) > 1 else ""),
                    target_user_trigger=users,
                    required_visual_elements=product.visual_features[:3],
                ),
                SegmentPlanItemSchema(
                    segment_id="seg_3",
                    goal="反转收尾与 CTA",
                    duration_seconds=18.0,
                    story_beat="resolution",
                    summary="结果验证 + 轻 CTA",
                    product_exposure_mode="logo_packshot",
                    source_selling_point=points[2] if len(points) > 2 else (points[-1] if points else ""),
                    product_feature_to_show=(product.visual_features[2] if len(product.visual_features) > 2 else ""),
                    target_user_trigger=users,
                    required_visual_elements=product.visual_features[:2],
                ),
            ],
            scene_goals={"seg_1": "建立痛点", "seg_2": "展示产品卖点", "seg_3": "结果证明"},
            product_selling_point_mapping={
                sid: points[i] if i < len(points) else (points[-1] if points else "")
                for i, sid in enumerate(_SEG_IDS)
            },
            target_user_expression=users,
            visual_requirements=[*product.visual_features[:4], project_config.get("visual_style") or ""],
            dialogue_tone=style,
            must_show_elements=[pname, *points[:3]],
            must_avoid_elements=product.visual_risk_notes[:6],
            meta={"provider": "mock", "duration_hint": duration},
        )
        return _normalize_blueprint_for_execution(bp, product, project_config)


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
            blueprint = _normalize_blueprint_for_execution(blueprint, product, project_config)
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
        return _normalize_blueprint_for_execution(self._provider.plan(project_id, product, project_config), product, project_config)


def _duration_budget_seconds(raw: Any) -> float:
    text = str(raw or "").strip()
    m = re.search(r"\d+(?:\.\d+)?", text)
    if not m:
        return 45.0
    try:
        return max(9.0, float(m.group(0)))
    except ValueError:
        return 45.0


def _segment_durations(total: float) -> list[float]:
    weights = (0.28, 0.37, 0.35)
    return [round(max(3.0, total * w), 1) for w in weights]


def _normalize_blueprint_for_execution(
    blueprint: StoryBlueprintSchema,
    product: ProductContextSchema,
    project_config: Dict[str, Any],
) -> StoryBlueprintSchema:
    """Fill execution-critical S2 fields so S3 consumes explicit structure, not loose prose."""
    total = _duration_budget_seconds(project_config.get("duration"))
    durations = _segment_durations(total)
    points = [p for p in product.core_selling_points if p]
    visual_features = [v for v in product.visual_features if v]
    plan = list(blueprint.segment_plan or [])
    defaults = ("Hook", "Conflict/Build", "Twist/Resolution")
    while len(plan) < 3:
        idx = len(plan)
        plan.append(SegmentPlanItemSchema(segment_id=_SEG_IDS[idx], story_beat=defaults[idx]))
    plan = plan[:3]
    next_plan: list[SegmentPlanItemSchema] = []
    mapping = dict(blueprint.product_selling_point_mapping or {})
    for idx, item in enumerate(plan):
        sid = _SEG_IDS[idx]
        selling_point = (
            item.source_selling_point
            or mapping.get(sid)
            or (points[idx] if idx < len(points) else (points[-1] if points else ""))
        )
        summary = item.summary or ""
        if idx == 0 and blueprint.hook and blueprint.hook not in summary:
            summary = f"{blueprint.hook}；{summary}".strip("；")
        req_visual = list(dict.fromkeys([*item.required_visual_elements, *visual_features[:3]]))
        next_plan.append(
            item.model_copy(
                update={
                    "segment_id": sid,
                    "duration_seconds": item.duration_seconds or durations[idx],
                    "story_beat": item.story_beat or defaults[idx],
                    "summary": summary,
                    "source_selling_point": selling_point,
                    "product_feature_to_show": item.product_feature_to_show or (visual_features[idx] if idx < len(visual_features) else ""),
                    "target_user_trigger": item.target_user_trigger or "、".join(product.target_users[:2]),
                    "required_visual_elements": req_visual,
                }
            )
        )
        mapping[sid] = selling_point
    scene_goals = dict(blueprint.scene_goals or {})
    for item in next_plan:
        scene_goals[item.segment_id] = scene_goals.get(item.segment_id) or item.goal or item.summary
    visual_requirements = list(
        dict.fromkeys(
            [
                *blueprint.visual_requirements,
                *visual_features,
                *(product.consistency_notes or []),
                str(project_config.get("visual_style") or "").strip(),
                f"composition aspect ratio {project_config.get('aspect_ratio') or '9:16'}",
            ]
        )
    )
    return blueprint.model_copy(
        update={
            "format": blueprint.format or str(project_config.get("format") or ""),
            "style": blueprint.style or str(project_config.get("style") or ""),
            "segment_plan": next_plan,
            "scene_goals": scene_goals,
            "product_selling_point_mapping": mapping,
            "target_user_expression": blueprint.target_user_expression or "、".join(product.target_users[:3]),
            "visual_requirements": [x for x in visual_requirements if x],
            "must_show_elements": list(dict.fromkeys([*blueprint.must_show_elements, product.product_name, *points])),
            "must_avoid_elements": list(dict.fromkeys([*blueprint.must_avoid_elements, *product.visual_risk_notes])),
        }
    )


def _build_story_planner_service() -> StoryPlannerService:
    if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
        return StoryPlannerService(MockStoryPlannerProvider())
    return StoryPlannerService(XAIStoryPlannerProvider(get_xai_text_provider()))


story_planner_service = _build_story_planner_service()
