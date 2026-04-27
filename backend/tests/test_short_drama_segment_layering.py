import os

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from app.short_drama.models import CharacterAsset, ProductAsset, SceneAsset
from app.short_drama.routes.segment import (
    _build_layered_script_payload,
    _execution_shot_from_presentation,
    _presentation_shot_from_execution,
)
from app.short_drama.schemas.segment import SegmentScriptSchema, ShotSchema
from app.short_drama.utils.video_prompt_builder import build_segment_video_plan


def _sample_execution_shot() -> dict:
    return {
        "shot_id": "shot_1",
        "shot_role": "痛点建立",
        "visual_action": "男性白领低头走路，口袋中物品零散掉落",
        "action_description": "男性白领低头走路，口袋中物品零散掉落",
        "scene_ref": "通勤路口",
        "character_refs": ["男性白领"],
        "product_refs": [],
        "spoken_text": "今天又手忙脚乱",
        "voiceover_text": "",
        "subtitle_text": "通勤时刻",
        "must_show": ["口袋中物品零散掉落"],
        "must_avoid": ["brand_raw conflicts"],
        "source_visual_constraints": {"market": "CN"},
        "video_prompt": "render prompt",
        "manual_video_prompt": "",
    }


def test_segment_generate_preserves_presentation_shots():
    seg = SegmentScriptSchema(
        segment_id="seg_1",
        title="开场",
        goal="痛点建立",
        shots=[ShotSchema.model_validate(_sample_execution_shot())],
    )
    payload = _build_layered_script_payload(seg)
    assert "presentation_shots" in payload
    assert isinstance(payload["presentation_shots"], list)
    assert payload["presentation_shots"][0]["shot_id"] == "shot_1"


def test_presentation_shots_do_not_leak_internal_constraints():
    p = _presentation_shot_from_execution(_sample_execution_shot(), shot_index=1)
    as_text = str(p)
    assert "source_visual_constraints" not in p
    assert "MARKET VISUAL CONSTRAINTS" not in as_text
    assert "STYLE CONSTRAINTS" not in as_text
    assert "brand_raw conflicts" not in as_text
    assert "conflict:" not in as_text


def test_execution_shots_keep_render_fields():
    p = _presentation_shot_from_execution(_sample_execution_shot(), shot_index=1)
    e = _execution_shot_from_presentation(p, _sample_execution_shot())
    assert e["video_prompt"] == "render prompt"
    assert e["must_show"] == ["口袋中物品零散掉落"]
    assert e["must_avoid"] == ["brand_raw conflicts"]
    assert "character_refs" in e and "scene_ref" in e


def test_dialogue_survives_to_render_payload():
    p = _presentation_shot_from_execution(_sample_execution_shot(), shot_index=1)
    p["dialogue_text"] = "台词测试"
    p["voiceover_text"] = "旁白测试"
    p["subtitle_text"] = "字幕测试"
    p["audio_intent"] = "低声、疲惫、自然"
    e = _execution_shot_from_presentation(p, _sample_execution_shot())
    seg = SegmentScriptSchema(
        segment_id="seg_1",
        title="开场",
        goal="痛点建立",
        shots=[ShotSchema.model_validate(e)],
    )
    plan = build_segment_video_plan(
        seg,
        characters=[CharacterAsset(id=1, project_id=1, name="男性白领", role_type="main", image_url="https://a/b.jpg")],
        scenes=[SceneAsset(id=1, project_id=1, name="通勤路口", scene_type="hook", image_url="https://a/c.jpg")],
        products=[ProductAsset(id=1, project_id=1, name="钱包", image_url="https://a/d.jpg")],
        project_aspect_ratio="9:16",
    )
    assert "台词测试" in plan.segment_video_prompt
    assert "旁白测试" in plan.segment_video_prompt
    assert "字幕测试" in plan.segment_video_prompt
    assert plan.execution_input.get("audio_required") is True
    assert plan.execution_input.get("audio_status") == "pending_tts_or_dubbing"
