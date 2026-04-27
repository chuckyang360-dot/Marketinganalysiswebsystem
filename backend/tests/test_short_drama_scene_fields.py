import os

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")
os.environ["SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER"] = "true"

from app.short_drama.schemas.asset import SceneAssetSchema
from app.short_drama.services.asset_spec_service import resolve_scene_fields


def _build_project_context() -> dict[str, str]:
    return {
        "target_market": "Southeast Asia",
        "target_audience": "都市年轻人",
        "marketing_goal": "brand_seeding",
        "brand_tone": "natural",
        "creative_brief": "突出通勤、穿搭、金属质感、日常随身风格，不要强调手机摔坏风险，不要强销售。",
    }


def _build_story_context() -> dict[str, object]:
    return {
        "framework_type": "brand_seeding",
        "structure": ["生活场景", "情绪共鸣", "产品自然出现", "氛围强化", "记忆点"],
        "story_framework": {"type": "brand_seeding"},
        "segment_plan": [
            {"goal": "生活场景", "summary": "建立主角日常通勤状态"},
            {"goal": "情绪共鸣", "summary": "表现通勤中查看手机的细微压力"},
            {"goal": "氛围强化", "summary": "强化街头生活方式与产品记忆点"},
        ],
    }


def _build_scenes() -> list[SceneAssetSchema]:
    return [
        SceneAssetSchema(
            name="清晨公寓玄关出门区",
            description="主角出门前整理背包并拿起手机。",
            scene_form="公寓玄关",
            meta={"selected_primary_location": "公寓玄关出门区"},
        ),
        SceneAssetSchema(
            name="清晨地铁站通勤走廊",
            description="主角在通勤路上查看手机信息。",
            scene_form="地铁站通勤走廊",
            meta={"selected_primary_location": "地铁站通勤走廊"},
        ),
        SceneAssetSchema(
            name="东南亚街头通勤路口",
            description="主角步行经过街头路口，镜头跟随移动。",
            scene_form="东南亚街头通勤路口",
            meta={"selected_primary_location": "东南亚街头通勤路口"},
        ),
    ]


def test_resolve_scene_fields_de_template_regression() -> None:
    project_context = _build_project_context()
    story_context = _build_story_context()
    scenes = _build_scenes()

    resolved = [
        resolve_scene_fields(
            scene=scene,
            project_context=project_context,
            story_context=story_context,
            index=idx,
        )
        for idx, scene in enumerate(scenes)
    ]

    descriptions = [row["display_description"] for row in resolved]
    props_values = [row["props"] for row in resolved]
    story_usage_values = [row["story_usage"] for row in resolved]
    lighting_values = [row["lighting"] for row in resolved]
    atmosphere_values = [row["atmosphere"] for row in resolved]

    # 1) 三个场景 display_description 不相同
    assert len(set(descriptions)) == 3
    # 2) 三个场景 props 不相同
    assert len(set(props_values)) == 3
    # 3) 三个场景 story_usage 不完全相同
    assert len(set(story_usage_values)) > 1
    # 4) 三个场景 lighting 不允许完全一样
    assert len(set(lighting_values)) > 1
    # 5) 三个场景 atmosphere 不允许完全一样
    assert len(set(atmosphere_values)) > 1

    # 6) description 禁止词
    banned_tokens = ["单一地点场景", "结构摘要待完善", "场景形态待完善", "市场语境"]
    for description in descriptions:
        for token in banned_tokens:
            assert token not in description

    # 7/8/9) plot_stage / scene_form / structure_summary 不能空或待完善
    for row in resolved:
        assert row["plot_stage"].strip()
        assert row["plot_stage"] != "结构摘要待完善"
        assert row["scene_form"].strip()
        assert row["scene_form"] != "场景形态待完善"
        assert row["structure_summary"].strip()
        assert "待完善" not in row["structure_summary"]

    # 10) description 体现地点差异
    apt_desc, metro_desc, street_desc = descriptions
    assert any(token in apt_desc for token in ["玄关", "出门", "室内"])
    assert any(token in metro_desc for token in ["地铁", "站台", "走廊"])
    assert any(token in street_desc for token in ["街头", "路口", "店铺", "摩托车"])
