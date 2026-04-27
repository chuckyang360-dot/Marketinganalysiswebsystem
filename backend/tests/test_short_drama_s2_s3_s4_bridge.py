import os
import inspect
import importlib

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from app.short_drama.schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from app.short_drama.schemas.segment import SegmentScriptSchema, ShotSchema
from app.short_drama.schemas.story import StoryBlueprintSchema
from app.short_drama.schemas.product import ProductContextSchema
from app.short_drama.schemas.story import SegmentPlanItemSchema
from app.short_drama.services.asset_spec_service import AssetSpecService, asset_bundle_from_story_requirements
from app.short_drama.services.story_planner_service import StoryPlannerService
from app.short_drama.services.segment_director_service import SegmentDirectorService, segments_from_story_shot_plan
from app.short_drama.utils.creative_brief import build_creative_brief
from app.short_drama.utils.language import build_language_policy

asset_module = importlib.import_module("app.short_drama.services.asset_spec_service")
segment_module = importlib.import_module("app.short_drama.services.segment_director_service")
story_module = importlib.import_module("app.short_drama.services.story_planner_service")


def test_language_policy_uses_target_market_default_and_video_language():
    policy = build_language_policy(workflow_source="测试项目", explicit_target_market="North America")
    assert policy["target_market"] == "North America"
    assert policy["workflow_language"] == "zh-CN"
    assert policy["video_language"] == "en-US"


def test_asset_requirements_drive_s3_bundle():
    blueprint = StoryBlueprintSchema(
        asset_requirements={
            "characters": [{"name": "主角A", "role": "main", "appearance": "短发"}],
            "scenes": [{"name": "客厅", "location": "室内"}],
            "products": [{"name": "产品X", "product_role": "hero", "form": "bottle"}],
        }
    )
    bundle = asset_bundle_from_story_requirements(blueprint)
    assert bundle is not None
    assert len(bundle.characters) == 1
    assert len(bundle.scenes) == 1
    assert len(bundle.products) == 1
    assert bundle.characters[0].name == "主角A"


def test_product_context_schema_has_ai_inferred_fields_and_creative_context_is_context_only():
    product = _phone_case_product()
    config = _project_config()
    brief = build_creative_brief(config, product)
    assert hasattr(product, "user_pain_points")
    assert hasattr(product, "immutable_structure_constraints")
    assert not any(any(term in text for term in ["不要", "禁止", "不能", "不可", "避免"]) for text in product.user_pain_points)
    assert brief["context_type"] == "creative_context"
    assert brief["effective_creative_intent"] == config["creative_intent"]
    strategy = brief["creative_strategy"]
    for key in ["script_type", "structure_type", "structure_stages", "emotional_curve", "product_exposure_curve"]:
        assert key not in strategy


def test_shot_plan_drives_s4_segments():
    blueprint = StoryBlueprintSchema(
        shot_plan={
            "segments": [
                {
                    "name": "Hook",
                    "duration": 8,
                    "goal": "抓注意力",
                    "shots": [
                        {
                            "id": "shot_1",
                            "duration": 4,
                            "action": "角色看向镜头",
                            "character_refs": ["主角A"],
                            "scene_ref": "客厅",
                            "product_refs": ["产品X"],
                            "dialogue": "开始吧",
                        }
                    ],
                }
            ]
        }
    )
    segments = segments_from_story_shot_plan(blueprint)
    assert segments is not None
    assert len(segments) == 1
    assert segments[0].segment_id == "seg_1"
    assert segments[0].shots[0].action_description == "角色看向镜头"


def _phone_case_product() -> ProductContextSchema:
    return ProductContextSchema(
        product_name="iPhone 金属手机壳",
        product_category="手机壳",
        product_summary="带金属边框和透明背板的 iPhone 手机壳",
        core_selling_points=["金属边框", "透明背板", "旋转环支架"],
        target_users=["日本都市青年"],
        usage_scenarios=["通勤", "独居公寓", "咖啡店"],
        visual_features=["镜头孔位", "旋转环", "透明背板", "金属边框"],
        product_form="iPhone 手机壳",
        user_pain_points=["单手握持不稳"],
        visual_risk_notes=["不要把手机壳生成完整手机"],
        consistency_notes=["不要改变镜头孔位", "不要改变旋转环位置"],
        immutable_structure_constraints=["不要改变镜头孔位", "不要改变旋转环位置"],
    )


def _project_config() -> dict:
    return {
        "duration": "30s",
        "format": "single_ad",
        "style": "light_conflict",
        "visual_style": "animation",
        "aspect_ratio": "9:16",
        "target_market": "Japan",
        "video_language": "ja-JP",
        "workflow_language": "zh-CN",
        "target_audience": "日本都市青年",
        "brand_tone": "natural",
        "creative_intent": "做一条轻冲突、动画风格、日本市场的自然种草广告，强调产品结构但不要硬广。",
    }


def test_s2_provider_receives_creative_brief_before_model_call():
    product = _phone_case_product()
    config = _project_config()
    config["legacy_creative_intent_summary"] = ""
    config["effective_creative_intent"] = config["creative_intent"]
    config["creative_brief_data"] = build_creative_brief(config, product)

    class Provider:
        seen_brief = None
        seen_intent = None

        def plan(self, project_id, product, project_config):
            self.seen_brief = project_config.get("creative_brief_data")
            self.seen_intent = project_config.get("effective_creative_intent")
            assert isinstance(self.seen_brief, dict)
            assert self.seen_brief["context_type"] == "creative_context"
            assert "structure_stages" not in self.seen_brief["creative_strategy"]
            return StoryBlueprintSchema(
                script_title="模型生成剧本",
                premise="模型生成前提",
                script_structure_type="aida",
                script_type_display="品牌种草型广告",
                structure_type_display="注意 → 兴趣 → 欲望 → 行动",
                structure_reason_for_user="模型根据创作意图、产品信息和时长选择先吸引注意再完成种草的节奏。",
                story_framework={
                    "type": "aida",
                    "name": "品牌种草型广告",
                    "structure": ["注意", "兴趣", "欲望", "行动"],
                    "reason": "模型生成原因",
                },
                segment_plan=[
                    SegmentPlanItemSchema(segment_id="seg_1", stage_name="注意", segment_title="模型生成标题1", segment_goal="模型生成具体剧情目标1", duration_sec=7, product_exposure="轻露出", transition_to_next="模型生成承接1"),
                    SegmentPlanItemSchema(segment_id="seg_2", stage_name="兴趣", segment_title="模型生成标题2", segment_goal="模型生成具体剧情目标2", duration_sec=8, product_exposure="明确展示", transition_to_next="模型生成承接2"),
                    SegmentPlanItemSchema(segment_id="seg_3", stage_name="欲望", segment_title="模型生成标题3", segment_goal="模型生成具体剧情目标3", duration_sec=8, product_exposure="场景使用", transition_to_next="模型生成承接3"),
                    SegmentPlanItemSchema(segment_id="seg_4", stage_name="行动", segment_title="模型生成标题4", segment_goal="模型生成具体剧情目标4", duration_sec=7, product_exposure="强转化", transition_to_next="模型生成收束"),
                ],
            )

    provider = Provider()
    blueprint = StoryPlannerService(provider).generate(1, product, config)
    stages = blueprint.story_framework["structure"]
    assert provider.seen_brief == config["creative_brief_data"]
    assert provider.seen_intent == config["creative_intent"]
    assert len(stages) == len(blueprint.segment_plan)
    assert blueprint.script_type_display != "注意兴趣行动型广告"
    assert blueprint.script_type_display in {
        "品牌种草型广告",
        "场景痛点型广告",
        "产品功能展示广告",
        "UGC测评型广告",
        "开箱种草型广告",
        "剧情反转型广告",
        "问题解决型广告",
        "痛点解决型广告",
        "产品演示型广告",
    }
    if "注意 → 兴趣 → 欲望 → 行动" in blueprint.structure_type_display:
        assert len(blueprint.segment_plan) == 4
    assert "aida" not in blueprint.script_type_display.lower()
    assert "marketing_goal" not in blueprint.structure_reason_for_user
    assert "trust_building" not in blueprint.structure_reason_for_user
    pain_points = blueprint.creative_brief["product_facts"]["user_pain_points"]
    constraint_terms = ["不要", "禁止", "不可", "不能"]
    assert not any(any(term in text for term in constraint_terms) for text in pain_points)
    immutable = blueprint.creative_brief["product_facts"]["immutable_structure_constraints"]
    assert "不要把手机壳生成完整手机" in immutable
    assert "不要改变镜头孔位" in immutable
    assert "不要改变旋转环位置" in immutable
    banned_titles = {f"{stage}：{product.product_name}" for stage in ["注意", "兴趣", "欲望", "行动"]}
    assert not any(segment.segment_title in banned_titles for segment in blueprint.segment_plan)
    assert not any("完成“" in segment.segment_goal and "阶段的表达任务" in segment.segment_goal for segment in blueprint.segment_plan)
    assert not any(segment.transition_to_next == "承接下一段产品/情绪推进" for segment in blueprint.segment_plan)
    assert blueprint.segment_plan[0].product_exposure == "轻露出"
    assert blueprint.segment_plan[1].product_exposure == "明确展示"
    assert blueprint.segment_plan[2].product_exposure == "场景使用"


def test_s3_service_uses_provider_and_does_not_author_sample_assets():
    product = _phone_case_product()
    config = _project_config()
    brief = build_creative_brief(config, product)
    blueprint = StoryBlueprintSchema(
        creative_brief=brief,
        language_policy={"target_market": "Japan", "workflow_language": "zh-CN", "video_language": "ja-JP"},
        segment_plan=[
            SegmentPlanItemSchema(
                segment_id="seg_1",
                stage_name="注意",
                required_assets=["主角", "核心生活场景", product.product_name],
                duration_sec=8,
            )
        ],
    )
    
    class Provider:
        called = False

        def build_specs(self, project_id, product, blueprint, project_config):
            self.called = True
            return AssetSpecsBundleSchema(
                characters=[
                    CharacterAssetSchema(
                        name="模型生成主角",
                        role_type="main",
                        description="模型生成的人物设定",
                        visual_prompt="模型生成的人物外貌、服装、姿态和动画风格提示词",
                    )
                ],
                scenes=[
                    SceneAssetSchema(
                        name="模型生成场景",
                        scene_type="生活场景",
                        description="模型生成的空间描述",
                        visual_prompt="模型生成的具体地点、机位、光线、道具和视觉记忆点",
                    )
                ],
                products=[
                    ProductAssetSchema(
                        name=product.product_name,
                        product_role="hero",
                        description="模型生成的产品描述",
                        visual_prompt="模型生成的产品形态、材质、结构和使用方式",
                        meta={"immutable_structure_constraints": ["不要改变镜头孔位"]},
                    )
                ],
            )

    provider = Provider()
    bundle = AssetSpecService(provider).generate(1, product, blueprint, config)
    assert provider.called
    assert "26 岁日本都市通勤青年" not in bundle.characters[0].visual_prompt
    assert "东京清晨通勤街头" not in bundle.scenes[0].visual_prompt
    assert "金色或银色金属边框" not in bundle.products[0].visual_prompt
    assert "不要改变镜头孔位" in bundle.products[0].immutable_structure_constraints


def test_s4_creative_brief_segments_use_provider_not_legacy_generation():
    product = _phone_case_product()
    config = _project_config()
    brief = build_creative_brief(config, product)
    blueprint = StoryBlueprintSchema(
        creative_brief=brief,
        segment_plan=[
            SegmentPlanItemSchema(
                segment_id="seg_1",
                stage_name="注意",
                segment_title="注意：通勤小困扰",
                segment_goal="建立通勤场景里的轻微困扰",
                key_message="手机壳带来安心握持",
                product_exposure="轻露出",
                emotional_state="小困扰",
                required_assets=["主角", "核心生活场景", product.product_name],
                duration_sec=8,
            )
        ],
    )
    bundle = AssetSpecsBundleSchema(
        characters=[CharacterAssetSchema(name="模型生成主角", role_type="main", visual_prompt="模型生成角色提示词")],
        scenes=[SceneAssetSchema(name="模型生成场景", scene_type="生活场景", visual_prompt="模型生成场景提示词")],
        products=[ProductAssetSchema(name=product.product_name, product_role="hero", visual_prompt="模型生成产品提示词")],
    )
    assert segments_from_story_shot_plan(blueprint, assets=bundle, project_config=config) is None

    class Provider:
        called = False

        def direct(self, project_id, blueprint, assets, project_config):
            self.called = True
            return [
                SegmentScriptSchema(
                    segment_id="seg_1",
                    title="模型生成片段",
                    duration_limit=8,
                    goal="模型生成目标",
                    shots=[
                        ShotSchema(
                            shot_id="seg_1_shot_1",
                            shot_title="模型生成镜头一",
                            shot_role="建立场景/冲突/动作起点",
                            scene_ref="模型生成场景",
                            character_refs=["模型生成主角"],
                            product_refs=[product.product_name],
                            visual_action="模型生成的具体地点、人物动作、产品状态和情绪变化。",
                            action_description="模型生成的具体地点、人物动作、产品状态和情绪变化。",
                            camera_description="近景，固定镜头，竖屏广告构图",
                            subtitle_text="モデル生成字幕",
                            mood="模型生成情绪",
                            duration_seconds=4,
                        ),
                        ShotSchema(
                            shot_id="seg_1_shot_2",
                            shot_title="模型生成镜头二",
                            shot_role="产品进入/产品细节",
                            scene_ref="模型生成场景",
                            character_refs=["模型生成主角"],
                            product_refs=[product.product_name],
                            visual_action="模型生成的另一组具体动作和产品展示方式。",
                            action_description="模型生成的另一组具体动作和产品展示方式。",
                            camera_description="特写，轻微推近，竖屏广告构图",
                            subtitle_text="モデル生成字幕二",
                            mood="模型生成情绪二",
                            duration_seconds=4,
                        ),
                    ],
                )
            ]

    provider = Provider()
    segments = SegmentDirectorService(provider).generate(1, blueprint, bundle, config)
    assert provider.called
    assert segments is not None
    assert len(segments[0].shots) >= 2
    actions = [shot.visual_action for shot in segments[0].shots]
    assert len(actions) == len(set(actions))
    banned = ["本段核心信息", "表现兴趣", "展示核心信息", "突出人物与产品关系", "核心生活场景", "随身物品", "相关物品", "日常场景", "使用场景"]
    assert not any(any(term in action for term in banned) for action in actions)
    assert all("一手拿咖啡" not in action for action in actions)
    assert all("东京清晨的通勤街头" not in action for action in actions)


def test_business_code_has_no_phone_case_sample_hardcoding():
    source = "\n".join(
        [
            inspect.getsource(story_module),
            inspect.getsource(asset_module),
            inspect.getsource(segment_module),
        ]
    )
    banned_literals = [
        "手机容易滑落",
        "通勤时单手操作不便",
        "看视频缺少支撑",
        "普通手机壳保护和便利性不足",
        "通勤路上的滑手机瞬间",
        "旋转环支架的第一次出现",
        "从握持到支撑观看",
        "一壳多用的品牌记忆",
        "一手拿咖啡",
        "通勤中、スマホが滑りやすい。",
        "リングスタンドで、片手でも安定。",
        "毎日の使いやすさを、ひとつのケースに。",
        "iPhone透明支架手机壳",
    ]
    assert not any(text in source for text in banned_literals)
