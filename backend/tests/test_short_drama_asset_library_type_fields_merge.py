import os

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from app.short_drama.services.asset_library_service import _merge_type_fields_preserve_non_empty


def test_merge_preserves_non_empty_base_on_empty_incoming_values():
    base = {
        "structure_summary": "用于承接通勤场景中产品自然露出的主角人物资产",
        "display_name": "东南亚通勤青年主角",
        "display_description": "一位面向东南亚都市通勤场景的年轻主角，穿着轻便运动鞋完成日常出行。",
        "appearance": "都市年轻人外观",
        "story_usage": "承接品牌种草剧情",
    }
    incoming = {
        "structure_summary": "",
        "display_name": None,
        "display_description": [],
        "appearance": {},
        "story_usage": "展示产品自然露出",
    }

    out = _merge_type_fields_preserve_non_empty(base, incoming)

    assert out["structure_summary"] == base["structure_summary"]
    assert out["display_name"] == base["display_name"]
    assert out["display_description"] == base["display_description"]
    assert out["appearance"] == base["appearance"]
    assert out["story_usage"] == "展示产品自然露出"


def test_merge_scene_fields_not_overwritten_by_empty_values():
    base = {
        "scene_form": "单地点通勤场景",
        "plot_stage": "生活场景",
        "structure_summary": "用于承载清晨通勤剧情的单地点生活场景",
    }
    incoming = {
        "scene_form": "",
        "plot_stage": None,
        "structure_summary": "",
    }

    out = _merge_type_fields_preserve_non_empty(base, incoming)

    assert out["scene_form"] == "单地点通勤场景"
    assert out["plot_stage"] == "生活场景"
    assert out["structure_summary"] == "用于承载清晨通勤剧情的单地点生活场景"
