import os

# Keep imports lightweight and avoid external provider key dependency.
os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from app.short_drama.utils.video_prompt_builder import _budgeted_segment_prompt


class LegacyShotWithoutVoiceover:
    def __init__(self):
        self.shot_id = "shot_legacy_1"
        self.manual_video_prompt = ""
        self.video_prompt = ""
        self.action_description = "角色看向镜头并展示产品"
        self.dialogue = None
        # Intentionally no `voiceover` attribute for legacy compatibility.
        self.narration = ""
        self.must_show = []
        self.must_avoid = []
        self.visual_description = "产品特写"
        self.manual_character_refs = []
        self.character_refs = []
        self.manual_scene_ref = ""
        self.scene_ref = ""
        self.manual_product_refs = []
        self.product_refs = []
        self.source_visual_constraints = {}
        self.source_selling_point = ""
        self.duration_seconds = 3


class LegacySegment:
    def __init__(self, shots):
        self.segment_id = "seg_test"
        self.duration_limit = 3
        self.shots = shots


def test_legacy_shot_without_voiceover_does_not_raise_and_adds_empty_spoken_policy():
    segment = LegacySegment([LegacyShotWithoutVoiceover()])
    prompt, _ = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "无角色口播、无旁白、无字幕" in prompt


def test_dict_shot_with_dialogue_includes_dialogue_requirement_and_exact_text():
    dict_shot = {
        "shot_id": "shot_dict_1",
        "action_description": "角色拿起手机壳并检查边角",
        "dialogue": "手机可不能再掉了",
        "must_show": [],
        "must_avoid": [],
        "duration_seconds": 3,
    }
    segment = LegacySegment([dict_shot])
    prompt, _ = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "Dialogue requirement" in prompt
    assert "手机可不能再掉了" in prompt
