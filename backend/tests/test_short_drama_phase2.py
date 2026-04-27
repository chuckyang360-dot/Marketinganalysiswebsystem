"""
Phase 2 Short Drama: xAI provider wiring, JSON parsing, schema validation, pipeline (mock).
Run from backend/: PYTHONPATH=. python3 -m unittest tests.test_short_drama_phase2 -v
"""

import os

# 默认生产关闭 mock；本文件集成测试在导入 app 前强制 mock，避免依赖 XAI_API_KEY。
os.environ["SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER"] = "true"

import json
import unittest
from unittest.mock import MagicMock, patch

import httpx


class TestJsonParser(unittest.TestCase):
    def test_strip_fence(self):
        from app.short_drama.utils.json_parser import parse_json_object

        raw = '```json\n{"product_name": "x", "category": ""}\n```'
        d = parse_json_object(raw)
        self.assertEqual(d["product_name"], "x")

    def test_invalid_raises(self):
        from app.short_drama.exceptions import ShortDramaInvalidModelOutputError
        from app.short_drama.utils.json_parser import parse_json_object

        with self.assertRaises(ShortDramaInvalidModelOutputError):
            parse_json_object("not json")


class TestXAIExtractText(unittest.TestCase):
    def test_responses_output_shape(self):
        from app.short_drama.providers.xai_client import extract_assistant_text

        payload = {
            "id": "resp_1",
            "output": [
                {
                    "type": "message",
                    "role": "assistant",
                    "content": [{"type": "output_text", "text": '{"hello": "world"}'}],
                }
            ],
        }
        self.assertIn("hello", extract_assistant_text(payload))


class TestProductParserXAI(unittest.TestCase):
    def _fake_client(self, text: str):
        client = MagicMock()

        def _post(**kwargs):
            return (
                {
                    "id": "r1",
                    "output": [
                        {
                            "type": "message",
                            "content": [{"type": "output_text", "text": text}],
                        }
                    ],
                },
                "r1",
                12,
            )

        client.post_responses.side_effect = _post
        return client

    def _resp(self, text: str, rid: str = "r1"):
        return (
            {
                "id": rid,
                "output": [
                    {
                        "type": "message",
                        "content": [{"type": "output_text", "text": text}],
                    }
                ],
            },
            rid,
            12,
        )

    def test_valid_json_validates(self):
        from app.short_drama.providers.xai_text_provider import XAITextProvider
        from app.short_drama.services.product_parser_service import XAIProductParserProvider

        good = {
            "product_name": "面膜",
            "category": "美妆",
            "brand_name": "B",
            "visual_features": [],
            "core_features": [],
            "selling_points": [],
            "target_users": "",
            "usage_scenarios": [],
            "brand_tone": "",
            "constraints": [],
            "notes_for_story": "",
        }
        prov = XAIProductParserProvider(XAITextProvider(client=self._fake_client(json.dumps(good))))
        ctx = prov.normalize(42, {"title": "面膜", "image_urls": []})
        self.assertEqual(ctx.product_name, "面膜")

    def test_s1_conflict_is_visible_in_product_context(self):
        from app.short_drama.schemas.product import (
            ProductContextSchema,
            ProductImageUnderstandingSchema,
            ProductRawInputSchema,
        )
        from app.short_drama.services.product_context_builder import _normalize_product_context

        ctx = ProductContextSchema(product_name="红色裙子")
        img = ProductImageUnderstandingSchema(
            detected_product_type="裤子",
            detected_visual_features=["蓝色牛仔裤"],
            image_conflicts=["用户写红色裙子，但图片显示蓝色牛仔裤"],
        )
        out = _normalize_product_context(ctx, ProductRawInputSchema(product_name_raw="红色裙子"), img)
        self.assertIn("蓝色牛仔裤", out.visual_features)
        self.assertTrue(any(x.startswith("conflict:") for x in out.visual_risk_notes))
        self.assertEqual(out.source_trace["product_name"], "user_input")

    def test_invalid_json_raises_after_two_repairs(self):
        from app.short_drama.exceptions import ShortDramaInvalidModelOutputError
        from app.short_drama.providers.xai_text_provider import XAITextProvider
        from app.short_drama.services.product_parser_service import XAIProductParserProvider

        client = MagicMock()
        client.post_responses.side_effect = [
            self._resp("NOT JSON {{{", "a"),
            self._resp("still {broken", "b"),
            self._resp("also bad", "c"),
        ]
        prov = XAIProductParserProvider(XAITextProvider(client=client))
        with self.assertRaises(ShortDramaInvalidModelOutputError) as ctx:
            prov.normalize(1, {"title": "x"})
        self.assertIn("repair", str(ctx.exception).lower())

    def test_json_repair_second_attempt_succeeds(self):
        from app.short_drama.providers.xai_text_provider import XAITextProvider
        from app.short_drama.services.product_parser_service import XAIProductParserProvider

        good = {
            "product_name": "面膜",
            "category": "",
            "brand_name": "",
            "visual_features": [],
            "core_features": [],
            "selling_points": [],
            "target_users": "",
            "usage_scenarios": [],
            "brand_tone": "",
            "constraints": [],
            "notes_for_story": "",
        }
        client = MagicMock()
        client.post_responses.side_effect = [
            self._resp("NOT JSON", "a"),
            self._resp("{broken", "b"),
            self._resp(json.dumps(good), "c"),
        ]
        prov = XAIProductParserProvider(XAITextProvider(client=client))
        ctx = prov.normalize(99, {"title": "面膜", "image_urls": []})
        self.assertEqual(ctx.product_name, "面膜")
        self.assertEqual(client.post_responses.call_count, 3)

    def test_structured_output_too_short_skips_repair(self):
        from app.short_drama.exceptions import ShortDramaInvalidModelOutputError
        from app.short_drama.providers.xai_text_provider import XAITextProvider

        client = MagicMock()
        client.post_responses.side_effect = [self._resp("{}", "a")]
        provider = XAITextProvider(client=client)
        with self.assertRaises(ShortDramaInvalidModelOutputError) as ctx:
            provider.generate_structured_json(
                project_id=1,
                service_name="segment_director",
                system_prompt="sys",
                user_payload={"k": "v"},
                expected_schema_name="SegmentScriptsBundle",
                stage="SEGMENT_GENERATION",
            )
        self.assertIn("too short", str(ctx.exception))
        self.assertEqual(client.post_responses.call_count, 1)


class TestEffectiveXAITextModel(unittest.TestCase):
    def test_fallback_grok_41_fast(self):
        from unittest.mock import patch

        from app.config import settings
        from app.short_drama.providers.xai_client import effective_xai_text_model

        with patch.object(settings, "XAI_TEXT_MODEL", None), patch.object(settings, "XAI_MODEL", None):
            self.assertEqual(effective_xai_text_model(), "grok-4.1-fast-non-reasoning")


class TestShotPromptQuality(unittest.TestCase):
    def test_vague_prompt_fails(self):
        from app.short_drama.exceptions import ShortDramaInvalidModelOutputError
        from app.short_drama.services.segment_director_service import validate_shot_prompt_quality

        with self.assertRaises(ShortDramaInvalidModelOutputError) as ctx:
            validate_shot_prompt_quality(
                "show something nice and cinematic for the ad",
                "make it cool with nice lighting",
                shot_id="s1",
                segment_id="seg_1",
            )
        self.assertTrue(
            "vague" in str(ctx.exception).lower() or "filler" in str(ctx.exception).lower(),
            msg=str(ctx.exception),
        )

    def test_good_prompt_passes(self):
        from app.short_drama.services.segment_director_service import validate_shot_prompt_quality

        validate_shot_prompt_quality(
            (
                "close-up of woman in modern office, holding skincare bottle, "
                "soft window light, cinematic commercial ad style, vertical 9:16"
            ),
            (
                "slow push-in on woman opening bottle, sitting at desk, "
                "shallow depth of field, upbeat pacing for short drama ad"
            ),
            shot_id="s1",
            segment_id="seg_1",
        )


def _minimal_assets_bundle():
    from app.short_drama.schemas.asset import (
        AssetSpecsBundleSchema,
        CharacterAssetSchema,
        ProductAssetSchema,
        SceneAssetSchema,
    )

    return AssetSpecsBundleSchema(
        characters=[
            CharacterAssetSchema(
                id=1,
                name="Lead",
                role_type="lead",
                description="buyer persona",
                visual_prompt="",
                image_url=None,
                meta={},
            )
        ],
        scenes=[
            SceneAssetSchema(
                id=1,
                name="Main Set",
                scene_type="interior",
                description="clean set",
                visual_prompt="neutral studio wall",
                image_url=None,
                meta={},
            )
        ],
        products=[
            ProductAssetSchema(
                id=1,
                name="SKU-A",
                description="generic consumer good",
                visual_prompt="",
                image_url=None,
                meta={},
            )
        ],
    )


class TestSegmentSlotPipeline(unittest.TestCase):
    """Structured slots → compose prompts (no category keyword tables)."""

    def test_four_slots_composes_and_validates(self):
        from app.short_drama.schemas.segment import SegmentScriptSchema, ShotSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.segment_director_service import _enrich_shot_prompts, validate_shot_prompt_quality

        assets = _minimal_assets_bundle()
        blueprint = StoryBlueprintSchema(
            premise="product story",
            segment_plan=[SegmentPlanItemSchema(segment_id="seg_1", summary="beat one")],
        )
        seg = SegmentScriptSchema(segment_id="seg_1", title="A", goal="g", shots=[])
        shot = ShotSchema(
            shot_id="h1",
            scene_ref="Main Set",
            character_refs=["Lead"],
            scene_description="Bright indoor tabletop with soft daylight",
            subject_description="Lead hands presenting the hero pack on matte surface",
            action_description="Rotates the pack slightly to catch a clean label read",
            camera_description="Macro-friendly three-quarter angle, vertical 9:16 ad framing",
            image_prompt="ignored-by-server",
            video_prompt="ignored-by-server",
        )
        sh2 = _enrich_shot_prompts(shot, seg, assets, blueprint, project_id=99)
        self.assertIn("Static keyframe", sh2.image_prompt)
        self.assertIn("Motion and pacing", sh2.video_prompt)
        self.assertNotIn("ignored-by-server", sh2.image_prompt)
        validate_shot_prompt_quality(
            sh2.image_prompt, sh2.video_prompt, shot_id=sh2.shot_id, segment_id=seg.segment_id
        )

    def test_three_slots_missing_camera_filled(self):
        from app.short_drama.schemas.segment import SegmentScriptSchema, ShotSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.segment_director_service import _enrich_shot_prompts

        assets = _minimal_assets_bundle()
        blueprint = StoryBlueprintSchema(segment_plan=[SegmentPlanItemSchema(segment_id="seg_1")])
        seg = SegmentScriptSchema(segment_id="seg_1", title="A", goal="g", shots=[])
        shot = ShotSchema(
            shot_id="h2",
            scene_ref="Main Set",
            character_refs=["Lead"],
            scene_description="Minimal studio corner with neutral gradient",
            subject_description="Lead facing camera with product at chest height",
            action_description="Raises the item smoothly into hero position",
            camera_description="",
        )
        sh2 = _enrich_shot_prompts(shot, seg, assets, blueprint, project_id=1)
        self.assertTrue((sh2.camera_description or "").strip() or "Cinematic" in sh2.image_prompt)

    def test_two_missing_slots_raises_with_missing_fields(self):
        from app.short_drama.exceptions import ShortDramaInvalidModelOutputError
        from app.short_drama.schemas.segment import SegmentScriptSchema, ShotSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.segment_director_service import _enrich_shot_prompts

        assets = _minimal_assets_bundle()
        blueprint = StoryBlueprintSchema(segment_plan=[SegmentPlanItemSchema(segment_id="seg_1")])
        seg = SegmentScriptSchema(segment_id="seg_1", title="A", goal="g", shots=[])
        shot = ShotSchema(
            shot_id="bad1",
            scene_ref="Main Set",
            character_refs=["Lead"],
            scene_description="Only scene filled with enough characters to count",
            subject_description="",
            action_description="",
            camera_description="",
        )
        with self.assertRaises(ShortDramaInvalidModelOutputError) as ctx:
            _enrich_shot_prompts(shot, seg, assets, blueprint, project_id=1)
        self.assertGreaterEqual(len(ctx.exception.missing_fields), 1)

    def test_categories_generic_sneakers_swimsuit_razor(self):
        from app.short_drama.schemas.segment import SegmentScriptSchema, ShotSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.segment_director_service import _enrich_shot_prompts, validate_shot_prompt_quality

        assets = _minimal_assets_bundle()
        blueprint = StoryBlueprintSchema(segment_plan=[SegmentPlanItemSchema(segment_id="seg_1")])
        seg = SegmentScriptSchema(segment_id="seg_1", title="A", goal="g", shots=[])

        sneakers = ShotSchema(
            shot_id="cat1",
            scene_ref="Main Set",
            character_refs=["Lead"],
            scene_description="Urban sidewalk at golden hour with long shadows",
            subject_description="Athletic talent mid-stride wearing the featured footwear",
            action_description="Push-off motion emphasizing sole contact with pavement",
            camera_description="Low tracking shot, handheld micro-shake, 9:16 commercial",
        )
        swim = ShotSchema(
            shot_id="cat2",
            scene_ref="Main Set",
            character_refs=["Lead"],
            scene_description="Pool deck after practice under overcast skylight",
            subject_description="Talent adjusting two-piece athletic swim kit at waist",
            action_description="Small corrective motion while breathing after laps",
            camera_description="Medium close-up, slow lateral drift, soft fill",
        )
        razor = ShotSchema(
            shot_id="cat3",
            scene_ref="Main Set",
            character_refs=["Lead"],
            scene_description="Steam-soft bathroom mirror ledge at morning routine",
            subject_description="Grooming tool resting on porcelain next to faucet",
            action_description="Picks up tool and begins a controlled glide along jawline",
            camera_description="Tight portrait framing, specular highlights, calm pacing",
        )
        for sh in (sneakers, swim, razor):
            sh2 = _enrich_shot_prompts(sh, seg, assets, blueprint, project_id=7)
            validate_shot_prompt_quality(
                sh2.image_prompt, sh2.video_prompt, shot_id=sh2.shot_id, segment_id=seg.segment_id
            )
            self.assertGreater(len(sh2.image_prompt), 35)


class TestLegacySegmentReadNormalize(unittest.TestCase):
    def test_infer_slots_when_new_fields_absent(self):
        from app.short_drama.utils.segment_slots import normalize_shot_dict_for_read

        raw = {
            "shot_id": "old1",
            "visual_description": "Morning routine beat",
            "action_description": "",
            "character_refs": ["Pat"],
            "image_prompt": "Steam-soft bathroom, single-blade tool on sink, close portrait 9:16, soft key light.",
            "video_prompt": "Slow push toward mirror; controlled hand motion; calm ad pacing.",
        }
        out = normalize_shot_dict_for_read(raw)
        self.assertTrue((out.get("scene_description") or "").strip())
        self.assertTrue((out.get("subject_description") or "").strip())
        self.assertTrue((out.get("camera_description") or "").strip())

    def test_preserves_existing_structured_fields(self):
        from app.short_drama.utils.segment_slots import normalize_shot_dict_for_read

        raw = {
            "scene_description": "Office",
            "subject_description": "Manager",
            "action_description": "Nods",
            "camera_description": "Wide",
            "image_prompt": "x" * 80,
            "video_prompt": "y" * 80,
        }
        out = normalize_shot_dict_for_read(raw)
        self.assertEqual(out.get("scene_description"), "Office")


class TestXAIClientTimeout(unittest.TestCase):
    def test_responses_multimodal_payload_shape(self):
        from app.short_drama.providers.xai_client import XAIClient
        from app.short_drama.providers.xai_text_provider import _build_user_content_parts

        content = _build_user_content_parts(
            '{"hello":"world"}',
            ["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"],
        )
        captured = {}

        class FakeResp:
            status_code = 200
            headers = {"x-request-id": "req_1"}
            text = '{"id":"resp_1","output":[]}'

            def json(self):
                return {"id": "resp_1", "output": []}

        with patch("httpx.Client") as MockClient:
            inst = MagicMock()
            inst.__enter__.return_value = inst
            def _capture_post(*a, **k):
                captured["json"] = k.get("json")
                return FakeResp()

            inst.post.side_effect = _capture_post
            MockClient.return_value = inst

            XAIClient(api_key="test-key", base_url="https://example.invalid", timeout_seconds=1.0).post_responses(
                model="m",
                system_prompt="system instructions",
                user_content=content,
                log_context={"project_id": 1},
            )

        body = captured["json"]
        self.assertEqual(body["instructions"], "system instructions")
        self.assertIsInstance(body["input"], list)
        self.assertEqual(body["input"][0]["role"], "user")
        self.assertIsInstance(body["input"][0]["content"], list)
        image_part = body["input"][0]["content"][0]
        second_image_part = body["input"][0]["content"][1]
        text_part = body["input"][0]["content"][2]
        self.assertEqual(image_part["type"], "input_image")
        self.assertIsInstance(image_part["image_url"], str)
        self.assertEqual(second_image_part["type"], "input_image")
        self.assertIsInstance(second_image_part["image_url"], str)
        self.assertEqual(text_part["type"], "input_text")
        self.assertNotIn("instructions", body["input"][0])

    def test_timeout_raises_provider_error(self):
        from app.short_drama.exceptions import ShortDramaProviderError
        from app.short_drama.providers.xai_client import XAIClient

        client = XAIClient(api_key="test-key", base_url="https://example.invalid", timeout_seconds=1.0)

        def boom(*a, **k):
            raise httpx.TimeoutException("timeout")

        with patch("httpx.Client") as MockClient:
            inst = MagicMock()
            inst.__enter__.return_value = inst
            inst.post.side_effect = boom
            MockClient.return_value = inst
            with self.assertRaises(ShortDramaProviderError):
                client.post_responses(
                    model="m",
                    system_prompt="s",
                    user_content="u",
                    log_context={"project_id": 1},
                )


class TestS1ImagePayload(unittest.TestCase):
    def test_s1_image_payload_does_not_put_data_url_in_text(self):
        from app.config import settings
        from app.short_drama.schemas.product import ProductImageInputSchema, ProductRawInputSchema
        from app.short_drama.services.image_understanding_service import ProductImageUnderstandingService

        data_url = "data:image/png;base64," + ("A" * 4096)
        raw = ProductRawInputSchema(
            product_name_raw="测试品",
            product_images=[
                ProductImageInputSchema(
                    image_url=data_url,
                    image_order=1,
                    is_main_image=True,
                )
            ],
        )
        captured: dict = {}

        class _FakeTextProvider:
            def generate_structured_json(self, **kwargs):
                captured["kwargs"] = kwargs
                return {}

        with patch.object(settings, "SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER", False):
            ProductImageUnderstandingService(text_provider=_FakeTextProvider()).understand(1, raw)
        kwargs = captured["kwargs"]
        self.assertEqual(kwargs["image_urls"], [data_url])
        payload = kwargs["user_payload"]
        text_json = json.dumps(payload, ensure_ascii=False)
        self.assertNotIn("data:image", text_json.lower())
        self.assertNotIn("base64", text_json.lower())
        self.assertLess(len(text_json), len(data_url))


class TestStoryPlannerMock(unittest.TestCase):
    def test_three_segments(self):
        from app.short_drama.schemas.product import ProductContextSchema
        from app.short_drama.services.story_planner_service import MockStoryPlannerProvider

        p = ProductContextSchema(product_name="P")
        bp = MockStoryPlannerProvider().plan(1, p, {"format": "single_ad", "duration": "45s"})
        self.assertEqual(len(bp.segment_plan), 3)
        self.assertEqual(bp.segment_plan[0].segment_id, "seg_1")

    def test_s2_consumes_story_subset_changes(self):
        from app.short_drama.schemas.product import ProductContextSchema
        from app.short_drama.services.story_planner_service import MockStoryPlannerProvider

        provider = MockStoryPlannerProvider()
        base = ProductContextSchema(
            product_name="P",
            core_selling_points=["省时"],
            target_users=["新手妈妈"],
            suitable_story_angles=["痛点型"],
        )
        changed_points = base.model_copy(update={"core_selling_points": ["低敏"]})
        changed_users = base.model_copy(update={"target_users": ["通勤白领"]})
        changed_angles = base.model_copy(update={"suitable_story_angles": ["反转型"]})

        bp_points = provider.plan(1, changed_points, {"format": "single_ad", "duration": "45s"})
        bp_users = provider.plan(1, changed_users, {"format": "single_ad", "duration": "45s"})
        bp_angles = provider.plan(1, changed_angles, {"format": "single_ad", "duration": "45s"})

        self.assertIn("低敏", bp_points.product_selling_point_mapping.values())
        self.assertIn("通勤白领", bp_users.premise)
        self.assertIn("反转型", bp_angles.core_conflict)

    def test_brand_seeding_rewrites_legacy_conflict_keywords(self):
        from app.short_drama.schemas.product import ProductContextSchema
        from app.short_drama.schemas.story import SegmentPlanItemSchema, StoryBlueprintSchema
        from app.short_drama.services.story_planner_service import _normalize_blueprint_for_execution

        product = ProductContextSchema(
            product_name="金色手机壳",
            core_selling_points=["金属质感", "轻薄贴合"],
            target_users=["通勤白领"],
            visual_features=["金色边框", "细腻纹理"],
        )
        poisoned = StoryBlueprintSchema(
            title="测试",
            premise="测试",
            hook="手机摔坏引发焦虑",
            core_conflict="风险放大，立即购买",
            twist="解决痛点",
            resolution="强CTA抢购",
            segment_plan=[
                SegmentPlanItemSchema(segment_id="seg_1", goal="痛点暴露", summary="手机摔坏"),
                SegmentPlanItemSchema(segment_id="seg_2", goal="风险放大", summary="保护焦虑"),
                SegmentPlanItemSchema(segment_id="seg_3", goal="立即购买", summary="强CTA"),
            ],
        )
        normalized = _normalize_blueprint_for_execution(
            poisoned,
            product,
            {"marketing_goal": "brand_seeding", "workflow_language": "zh-CN"},
        )
        blob = " ".join(
            [
                normalized.hook,
                normalized.core_conflict,
                normalized.twist,
                normalized.resolution,
                normalized.story_structure.get("hook", ""),
                normalized.story_structure.get("conflict", ""),
                normalized.story_structure.get("twist", ""),
                normalized.story_structure.get("resolution", ""),
            ]
        )
        self.assertFalse(any(word in blob for word in ["摔坏", "痛点", "焦虑", "立即购买", "CTA"]))
        self.assertEqual(normalized.story_framework.get("type"), "brand_seeding")
        self.assertEqual(
            normalized.story_framework.get("structure"),
            ["生活场景", "情绪共鸣", "产品自然出现", "氛围强化", "记忆点"],
        )

    def test_story_style_conflict_normalized_to_light_conflict(self):
        from app.short_drama.services.story_planner_service import _normalize_story_style

        self.assertEqual(_normalize_story_style("conflict"), "light_conflict")
        self.assertEqual(_normalize_story_style(["conflict", "comedy"]), "light_conflict")
        self.assertEqual(_normalize_story_style("healing,comedy"), "healing")


class TestAssetSpecMock(unittest.TestCase):
    def test_image_url_none(self):
        from app.short_drama.schemas.product import ProductContextSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.asset_spec_service import MockAssetSpecProvider

        prod = ProductContextSchema(product_name="X")
        story = StoryBlueprintSchema(
            segment_plan=[
                SegmentPlanItemSchema(segment_id="seg_1"),
                SegmentPlanItemSchema(segment_id="seg_2"),
                SegmentPlanItemSchema(segment_id="seg_3"),
            ]
        )
        bundle = MockAssetSpecProvider().build_specs(1, prod, story)
        self.assertTrue(all(p.image_url is None for p in bundle.products))

    def test_asset_boundaries_dedupe_home_gym_scene(self):
        from app.short_drama.schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
        from app.short_drama.services.asset_spec_service import _normalize_asset_bundle

        bundle = AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    name="Angry Coach Training",
                    role_type="coach",
                    description="Female coach lifting weights in gym struggle",
                    visual_prompt="coach doing energized workout",
                )
            ],
            scenes=[
                SceneAssetSchema(
                    name="Home Gym Struggle",
                    scene_type="hook",
                    description="home gym conflict moment",
                    visual_prompt="home gym with character struggling",
                ),
                SceneAssetSchema(
                    name="Energized Workout",
                    scene_type="resolution",
                    description="same home gym comeback",
                    visual_prompt="home gym energized workout",
                ),
            ],
            products=[
                ProductAssetSchema(
                    name="Xiaomi Protein Powder in Gym Scene",
                    description="person drinking product in gym story scene",
                    visual_prompt="protein powder being used by human in gym",
                )
            ],
        )
        out = _normalize_asset_bundle(bundle, product_name="Xiaomi Protein Powder")
        self.assertEqual([s.name for s in out.scenes], ["Home Gym"])
        self.assertNotIn("Struggle", out.scenes[0].name)
        self.assertIn("empty_location", out.scenes[0].meta["asset_boundary"])
        self.assertNotIn("Training", out.characters[0].name)
        self.assertIn("character_reference", out.characters[0].meta["asset_boundary"])
        self.assertNotIn("Gym Scene", out.products[0].name)
        self.assertIn("product_only", out.products[0].meta["asset_boundary"])


class TestSegmentDirectorMock(unittest.TestCase):
    def test_three_segments_with_shots_and_prompts(self):
        from app.short_drama.schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.segment_director_service import MockSegmentDirectorProvider, SegmentDirectorService

        bp = StoryBlueprintSchema(
            title="T",
            segment_plan=[
                SegmentPlanItemSchema(segment_id="seg_1"),
                SegmentPlanItemSchema(segment_id="seg_2"),
                SegmentPlanItemSchema(segment_id="seg_3"),
            ],
        )
        assets = AssetSpecsBundleSchema(
            characters=[CharacterAssetSchema(name="A", role_type="protagonist")],
            scenes=[SceneAssetSchema(name="S", scene_type="interior")],
            products=[ProductAssetSchema(name="P")],
        )
        segs = SegmentDirectorService(MockSegmentDirectorProvider()).generate(1, bp, assets, {})
        self.assertEqual(len(segs), 3)
        for seg in segs:
            self.assertTrue(len(seg.shots) >= 1)
            for sh in seg.shots:
                self.assertTrue((sh.image_prompt or "").strip())
                self.assertTrue((sh.video_prompt or "").strip())

    def test_s3_translates_visual_subset_to_shot_execution_fields(self):
        from app.short_drama.schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
        from app.short_drama.schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
        from app.short_drama.services.segment_director_service import MockSegmentDirectorProvider, SegmentDirectorService

        bp = StoryBlueprintSchema(
            hook="强 Hook",
            product_selling_point_mapping={"seg_1": "省时"},
            visual_requirements=["蓝色包装必须一致"],
            must_avoid_elements=["不要红色包装"],
            segment_plan=[SegmentPlanItemSchema(segment_id="seg_1"), SegmentPlanItemSchema(segment_id="seg_2"), SegmentPlanItemSchema(segment_id="seg_3")],
        )
        assets = AssetSpecsBundleSchema(
            characters=[CharacterAssetSchema(name="A", role_type="protagonist")],
            scenes=[SceneAssetSchema(name="S", scene_type="interior")],
            products=[ProductAssetSchema(name="P")],
        )
        cfg = {
            "aspect_ratio": "9:16",
            "visual_style": "premium_ad",
            "s1_visual_constraints": {
                "visual_features": ["蓝色包装"],
                "consistency_notes": ["瓶身 logo 固定"],
                "visual_risk_notes": ["不要红色包装"],
            },
        }
        segs = SegmentDirectorService(MockSegmentDirectorProvider()).generate(1, bp, assets, cfg)
        shot = segs[0].shots[0]
        self.assertIn("省时", shot.must_show)
        self.assertIn("不要红色包装", shot.must_avoid)
        self.assertEqual(shot.source_visual_constraints["visual_style"], "premium_ad")


class TestShortDramaPipelineIntegration(unittest.TestCase):
    def test_full_chain_mock(self):
        from fastapi.testclient import TestClient

        from app.database import SessionLocal
        from app.main import app
        from app.models import User

        db = SessionLocal()
        u = db.query(User).first()
        if not u:
            u = User(
                username="sd_phase2",
                name="SD Phase2",
                email="sd_phase2@test.local",
                password_hash="x" * 64,
                is_active=True,
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        uid = u.id
        db.close()

        c = TestClient(app)
        r = c.post("/api/short-drama/project", json={"user_id": uid, "project_name": "phase2"})
        self.assertEqual(r.status_code, 200, r.text)
        pid = r.json()["project"]["id"]
        self.assertEqual(
            200,
            c.post(
                "/api/short-drama/product/parse",
                json={"project_id": pid, "input": {"title": "测试品", "image_urls": []}},
            ).status_code,
        )
        self.assertEqual(200, c.post("/api/short-drama/story/generate", json={"project_id": pid}).status_code)
        self.assertEqual(
            200, c.post("/api/short-drama/assets/specs/generate", json={"project_id": pid}).status_code
        )
        self.assertEqual(200, c.post("/api/short-drama/segment/generate", json={"project_id": pid}).status_code)
        pipe = c.get(f"/api/short-drama/project/{pid}/pipeline")
        self.assertEqual(pipe.status_code, 200)
        body = pipe.json()
        self.assertEqual(body["project"]["status"], "segments_generated")
        self.assertEqual(len(body["segment_scripts"]), 3)
        script0 = body["segment_scripts"][0]["script"]
        self.assertIn("shots", script0)
        self.assertTrue(script0["shots"])
        shot0 = script0["shots"][0]
        self.assertIn("scene_description", shot0)
        self.assertTrue((shot0.get("image_prompt") or "").strip())

    def test_s1_provider_503_returns_busy_message(self):
        from fastapi.testclient import TestClient

        from app.database import SessionLocal
        from app.main import app
        from app.models import User
        from app.short_drama.exceptions import ShortDramaProviderError

        db = SessionLocal()
        u = db.query(User).first()
        if not u:
            u = User(
                username="sd_phase2_s1_503",
                name="SD Phase2 503",
                email="sd_phase2_s1_503@test.local",
                password_hash="x" * 64,
                is_active=True,
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        uid = u.id
        db.close()

        c = TestClient(app)
        r = c.post("/api/short-drama/project", json={"user_id": uid, "project_name": "phase2_s1_503"})
        self.assertEqual(r.status_code, 200, r.text)
        pid = r.json()["project"]["id"]

        with patch(
            "app.short_drama.routes.product.product_parser_service.parse",
            side_effect=ShortDramaProviderError(
                'xAI Responses API HTTP 503: {"code":"The service is currently unavailable","error":"Service temporarily unavailable. The model did not respond to this request."}'
            ),
        ):
            rp = c.post(
                "/api/short-drama/product/parse",
                json={"project_id": pid, "input": {"title": "测试品", "image_urls": []}},
            )
        self.assertEqual(rp.status_code, 502, rp.text)
        detail = rp.json().get("detail") or {}
        self.assertEqual(detail.get("error"), "short_drama_provider_unavailable")
        self.assertEqual(detail.get("user_message"), "当前服务繁忙，请稍后重试。")
        blob = json.dumps(rp.json(), ensure_ascii=False).lower()
        self.assertNotIn("service temporarily unavailable", blob)
        self.assertNotIn("did not respond", blob)
        self.assertNotIn("http 503", blob)


if __name__ == "__main__":
    unittest.main()
