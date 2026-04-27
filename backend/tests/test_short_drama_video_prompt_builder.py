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
        self.shot_role = "scene_establish"
        self.shot_title = "通勤痛点"
        self.visual_action = self.action_description
        self.camera_framing = "中景"
        self.camera_movement = "跟拍"
        self.mood = "压抑"
        self.visual_style_instruction = "写实通勤风"
        self.market_localization_detail = "一线城市早高峰"


class LegacySegment:
    def __init__(self, shots):
        self.segment_id = "seg_test"
        self.duration_limit = 3
        self.shots = shots


def test_legacy_shot_without_voiceover_does_not_raise():
    segment = LegacySegment([LegacyShotWithoutVoiceover()])
    prompt, _ = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "角色看向镜头并展示产品" in prompt


def test_dict_shot_keeps_action_focused_prompt():
    dict_shot = {
        "shot_id": "shot_dict_1",
        "shot_role": "pain_point",
        "shot_title": "掉落冲突",
        "visual_action": "男性白领低头走路，口袋中物品零散掉落",
        "action_description": "角色拿起手机壳并检查边角",
        "scene_ref": "地铁口通勤路段",
        "character_refs": ["男性白领"],
        "camera_framing": "中近景",
        "camera_movement": "手持跟随",
        "mood": "焦虑",
        "visual_style_instruction": "真实纪录感",
        "market_localization_detail": "亚洲都市上班时段",
        "must_show": [],
        "must_avoid": [],
        "duration_seconds": 3,
    }
    segment = LegacySegment([dict_shot])
    prompt, _ = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "男性白领低头走路" in prompt
    assert "物品零散掉落" in prompt


def test_pain_point_shot_excludes_irrelevant_product_and_conflict_noise():
    dict_shot = {
        "shot_id": "shot_pain_1",
        "shot_role": "pain_point",
        "shot_title": "通勤冲突建立",
        "visual_action": "男性白领低头走路，口袋中物品零散掉落",
        "scene_ref": "写字楼外通勤路口",
        "character_refs": ["男性白领"],
        "product_refs": ["钱包", "MCM 标志款"],
        "camera_framing": "中景",
        "camera_movement": "缓慢跟拍",
        "mood": "窘迫焦虑",
        "visual_style_instruction": "写实商业短片风格",
        "market_localization_detail": "都市白领日常",
        "must_show": [
            "男性白领低头走路",
            "口袋中物品零散掉落",
            "monogram 图案",
            "MCM 标志",
            "多个隔间结构",
            "brand_raw conflicts",
        ],
        "must_avoid": ["conflict: image mismatch", "brand_raw", "source_trace"],
        "duration_seconds": 2,
    }
    segment = LegacySegment([dict_shot])
    prompt, budget = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "男性白领低头走路" in prompt
    assert "物品零散掉落" in prompt
    assert "brand_raw" not in prompt
    assert "conflict" not in prompt.casefold()
    assert "MCM 标志" not in prompt
    assert "monogram 图案" not in prompt
    assert "多个隔间结构" not in prompt
    assert len(prompt) < 3200
    assert budget["hard_video_prompt_chars"] == 4096


def test_product_showcase_shot_keeps_key_product_constraints_only():
    dict_shot = {
        "shot_id": "shot_product_1",
        "shot_role": "product_showcase",
        "shot_title": "产品展示",
        "visual_action": "打开钱包展示内部隔层，手指滑过卡位并合上",
        "scene_ref": "办公桌面",
        "character_refs": ["男性白领"],
        "product_refs": ["轻薄钱包"],
        "camera_framing": "特写",
        "camera_movement": "微距推进",
        "mood": "安心满意",
        "visual_style_instruction": "高质感商业广告风",
        "market_localization_detail": "城市中产消费场景",
        "must_show": [
            "矩形双折设计",
            "多个隔间",
            "轻薄外观",
            "皮革纹理",
            "金属 logo",
        ],
        "must_avoid": ["brand_raw object", "source_trace", "field_meta"],
        "duration_seconds": 2,
    }
    segment = LegacySegment([dict_shot])
    prompt, _ = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "打开钱包展示内部隔层" in prompt
    assert "Product refs" in prompt
    # 最多保留 3 条关键结构/外观约束
    assert prompt.count(";") <= 6
    assert len(prompt) < 3200


def test_object_string_cleanup_removes_debug_and_dict_like_fields():
    dict_shot = {
        "shot_id": "shot_clean_1",
        "shot_role": "pain_point",
        "shot_title": "清洗测试",
        "visual_action": "角色匆忙走路 {'display': 'bad'}",
        "scene_ref": "{'display': '地铁口', 'description': '拥挤'}",
        "character_refs": ["{'display': '上班族', 'description': '疲惫'}"],
        "camera_framing": "中景",
        "camera_movement": "跟拍",
        "mood": "焦虑",
        "visual_style_instruction": "纪实",
        "market_localization_detail": "本地通勤",
        "must_show": ["source_trace=abc", "field_meta=xyz", "brand_raw payload", "conflict: diag"],
        "duration_seconds": 2,
    }
    segment = LegacySegment([dict_shot])
    prompt, _ = _budgeted_segment_prompt(segment, aspect_ratio="9:16")
    assert "{'display':" not in prompt
    assert "'description':" not in prompt
    assert "source_trace" not in prompt
    assert "field_meta" not in prompt
    assert "brand_raw" not in prompt
    assert "conflict:" not in prompt
