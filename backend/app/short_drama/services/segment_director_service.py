from __future__ import annotations

import logging
from typing import Any, Dict, Protocol

from ...config import settings
from ..exceptions import ShortDramaInvalidModelOutputError
from ..providers.xai_text_provider import XAITextProvider, get_xai_text_provider
from ..schemas.asset import AssetSpecsBundleSchema
from ..schemas.segment import SegmentScriptSchema, ShotSchema
from ..schemas.story import StoryBlueprintSchema, SegmentPlanItemSchema
from ..utils.prompts import SEGMENT_DIRECTOR_SYSTEM_PROMPT
from ..utils.segment_slots import (
    compose_image_prompt_from_slots,
    compose_video_prompt_from_slots,
    filled_slot_count,
    fill_one_missing_slot,
    log_slot_raw,
    missing_slot_field_names,
    validate_composed_prompt_text,
)

logger = logging.getLogger(__name__)

_EXPECTED_SEGMENTS = ("seg_1", "seg_2", "seg_3")


def enrich_shot_via_slot_pipeline(
    shot: ShotSchema,
    seg: SegmentScriptSchema,
    assets: AssetSpecsBundleSchema,
    blueprint: StoryBlueprintSchema,
    *,
    project_id: int,
) -> ShotSchema:
    """Structured slots → optional single-slot fill → compose image/video prompts."""
    log_slot_raw(project_id=project_id, segment_id=seg.segment_id, shot_id=shot.shot_id, shot=shot)

    missing_before = missing_slot_field_names(shot)
    cur = shot
    if len(missing_before) == 1:
        field = missing_before[0]
        cur = fill_one_missing_slot(cur, seg, assets, blueprint, field)
        missing_after_names = missing_slot_field_names(cur)
        logger.info(
            "SEGMENT_SLOT_FILLED project_id=%s segment_id=%s shot_id=%s missing_before=%s missing_after=%s filled_fields=%s",
            project_id,
            seg.segment_id,
            shot.shot_id,
            ",".join(missing_before),
            ",".join(missing_after_names),
            field,
        )
    else:
        missing_after_names = missing_slot_field_names(cur)

    fc = filled_slot_count(cur)
    mf = missing_slot_field_names(cur)
    if fc < 3 or len(mf) >= 2:
        logger.warning(
            "SEGMENT_SLOT_VALIDATION_FAILED project_id=%s segment_id=%s shot_id=%s missing_fields=%s",
            project_id,
            seg.segment_id,
            shot.shot_id,
            ",".join(mf),
        )
        raise ShortDramaInvalidModelOutputError(
            "Shot slot validation failed: at least 3 of 4 structured description fields must be non-empty "
            f"(segment={seg.segment_id}, shot={shot.shot_id})",
            segment_id=seg.segment_id,
            shot_id=shot.shot_id,
            missing_fields=mf,
            code="slot_validation_failed",
        )

    image_prompt = compose_image_prompt_from_slots(cur)
    video_prompt = compose_video_prompt_from_slots(cur)
    logger.info(
        "SEGMENT_PROMPT_COMPOSED project_id=%s segment_id=%s shot_id=%s image_prompt=%s video_prompt=%s",
        project_id,
        seg.segment_id,
        shot.shot_id,
        image_prompt,
        video_prompt,
    )
    validate_composed_prompt_text(
        image_prompt, field="image_prompt", shot_id=cur.shot_id, segment_id=seg.segment_id
    )
    validate_composed_prompt_text(
        video_prompt, field="video_prompt", shot_id=cur.shot_id, segment_id=seg.segment_id
    )

    return cur.model_copy(update={"image_prompt": image_prompt, "video_prompt": video_prompt})


def _enrich_shot_prompts(
    shot: ShotSchema,
    seg: SegmentScriptSchema,
    assets: AssetSpecsBundleSchema,
    blueprint: StoryBlueprintSchema,
    *,
    project_id: int = 0,
) -> ShotSchema:
    """Back-compat name for tests; delegates to slot pipeline."""
    return enrich_shot_via_slot_pipeline(shot, seg, assets, blueprint, project_id=project_id)


def validate_shot_prompt_quality(
    image_prompt: str,
    video_prompt: str,
    *,
    shot_id: str,
    segment_id: str,
) -> None:
    """Validate final composed prompts (length / vague / filler), not keyword dimensions."""
    validate_composed_prompt_text(image_prompt, field="image_prompt", shot_id=shot_id, segment_id=segment_id)
    validate_composed_prompt_text(video_prompt, field="video_prompt", shot_id=shot_id, segment_id=segment_id)


class SegmentDirectorProvider(Protocol):
    def direct(
        self,
        project_id: int,
        blueprint: StoryBlueprintSchema,
        assets: AssetSpecsBundleSchema,
        project_config: Dict[str, Any],
    ) -> list[SegmentScriptSchema]: ...


class MockSegmentDirectorProvider:
    def direct(
        self,
        project_id: int,
        blueprint: StoryBlueprintSchema,
        assets: AssetSpecsBundleSchema,
        project_config: Dict[str, Any],
    ) -> list[SegmentScriptSchema]:
        char0 = assets.characters[0].name if assets.characters else "主角"
        scene0 = assets.scenes[0].name if assets.scenes else "场景A"
        prod = assets.products[0].name if assets.products else "产品"
        ar = project_config.get("aspect_ratio") or "9:16"
        return [
            SegmentScriptSchema(
                segment_id="seg_1",
                title="Hook",
                duration_limit=12.0,
                goal="共鸣开场",
                shots=[
                    ShotSchema(
                        shot_id="s1_01",
                        shot_type="establishing",
                        scene_ref=scene0,
                        character_refs=[char0],
                        visual_description=f"竖屏 {ar}，手持跟拍",
                        scene_description=f"Busy city street in morning light near commuter foot traffic",
                        subject_description=f"{char0} as the lead talent in everyday wardrobe",
                        action_description="Walking quickly with urgency through the crowd toward work",
                        camera_description=f"Handheld vertical {ar} with shallow depth and natural sunlight",
                        dialogue="又要迟到了…",
                        narration="",
                        emotion="窘迫",
                        duration_seconds=6.0,
                        image_prompt="",
                        video_prompt="",
                    )
                ],
                meta={"provider": "mock", "segment": "hook"},
            ),
            SegmentScriptSchema(
                segment_id="seg_2",
                title="Conflict / Build",
                duration_limit=15.0,
                goal="产品引入",
                shots=[
                    ShotSchema(
                        shot_id="s2_01",
                        shot_type="insert",
                        scene_ref=scene0,
                        character_refs=[char0],
                        visual_description="产品入画",
                        scene_description="Retail-leaning interior with clean surfaces and readable labels",
                        subject_description=f"{char0} presenting {prod} as the focal hero object",
                        action_description="Unboxing and trying the product with curious hand choreography",
                        camera_description="Soft rim light, slow push-in, vertical commercial macro-friendly framing",
                        dialogue=f"试试 {prod}。",
                        narration="",
                        emotion="好奇",
                        duration_seconds=8.0,
                        image_prompt="",
                        video_prompt="",
                    )
                ],
                meta={"provider": "mock", "segment": "build"},
            ),
            SegmentScriptSchema(
                segment_id="seg_3",
                title="Twist / Resolution",
                duration_limit=18.0,
                goal="收尾与 CTA",
                shots=[
                    ShotSchema(
                        shot_id="s3_01",
                        shot_type="reaction",
                        scene_ref=scene0,
                        character_refs=[char0],
                        visual_description="表情放松",
                        scene_description="Quiet office nook with warm practicals and soft background separation",
                        subject_description=f"{char0} relaxed after resolving the earlier tension",
                        action_description="Nods with a satisfied smile toward an implied payoff",
                        camera_description="Portrait close-up with bokeh, gentle pull-back beat for resolution",
                        dialogue="原来这么简单。",
                        narration=blueprint.title or f"了解 {prod}",
                        emotion="满足",
                        duration_seconds=7.0,
                        image_prompt="",
                        video_prompt="",
                    )
                ],
                meta={"provider": "mock", "segment": "resolution"},
            ),
        ]


class XAISegmentDirectorProvider:
    def __init__(self, text_provider: XAITextProvider):
        self._text = text_provider

    def direct(
        self,
        project_id: int,
        blueprint: StoryBlueprintSchema,
        assets: AssetSpecsBundleSchema,
        project_config: Dict[str, Any],
    ) -> list[SegmentScriptSchema]:
        logger.info(
            "SEGMENT_GENERATION_STARTED %s",
            {"project_id": project_id, "stage": "SEGMENT_GENERATION", "provider": "xai"},
        )
        try:
            data = self._text.generate_structured_json(
                project_id=project_id,
                service_name="segment_director",
                system_prompt=SEGMENT_DIRECTOR_SYSTEM_PROMPT,
                user_payload={
                    "project_id": project_id,
                    "project_config": project_config,
                    "story_blueprint": blueprint.model_dump(),
                    "asset_specs": assets.model_dump(),
                },
                image_urls=None,
                expected_schema_name="SegmentScriptsBundle",
                stage="SEGMENT_GENERATION",
            )
            segments = _validate_segments(
                data, project_id=project_id, assets=assets, blueprint=blueprint
            )
            logger.info(
                "SEGMENT_GENERATION_SUCCEEDED %s",
                {"project_id": project_id, "stage": "SEGMENT_GENERATION", "provider": "xai"},
            )
            return segments
        except Exception as e:
            logger.info(
                "SEGMENT_GENERATION_FAILED %s",
                {
                    "project_id": project_id,
                    "stage": "SEGMENT_GENERATION",
                    "provider": "xai",
                    "error_type": type(e).__name__,
                },
            )
            raise


def _validate_segments(
    data: dict[str, Any],
    *,
    project_id: int,
    assets: AssetSpecsBundleSchema,
    blueprint: StoryBlueprintSchema,
) -> list[SegmentScriptSchema]:
    raw_list = data.get("segments")
    if not isinstance(raw_list, list):
        raise ShortDramaInvalidModelOutputError("Missing segments array")
    if len(raw_list) != 3:
        raise ShortDramaInvalidModelOutputError(f"Expected 3 segments, got {len(raw_list)}")
    out: list[SegmentScriptSchema] = []
    for i, row in enumerate(raw_list):
        if not isinstance(row, dict):
            raise ShortDramaInvalidModelOutputError("Invalid segment row")
        seg = SegmentScriptSchema.model_validate(row)
        if seg.segment_id != _EXPECTED_SEGMENTS[i]:
            seg = seg.model_copy(update={"segment_id": _EXPECTED_SEGMENTS[i]})
        if not seg.shots:
            raise ShortDramaInvalidModelOutputError(f"segment {seg.segment_id} has no shots")
        enriched_shots: list[ShotSchema] = []
        for sh in seg.shots:
            sh2 = enrich_shot_via_slot_pipeline(
                sh, seg, assets, blueprint, project_id=project_id
            )
            validate_shot_prompt_quality(
                sh2.image_prompt,
                sh2.video_prompt,
                shot_id=sh2.shot_id,
                segment_id=seg.segment_id,
            )
            enriched_shots.append(sh2)
        out.append(seg.model_copy(update={"shots": enriched_shots}))
    return out


class SegmentDirectorService:
    def __init__(self, provider: SegmentDirectorProvider | None = None):
        self._provider = provider or MockSegmentDirectorProvider()

    def generate(
        self,
        project_id: int,
        blueprint: StoryBlueprintSchema,
        assets: AssetSpecsBundleSchema,
        project_config: Dict[str, Any],
    ) -> list[SegmentScriptSchema]:
        segments = self._provider.direct(project_id, blueprint, assets, project_config)
        if isinstance(self._provider, MockSegmentDirectorProvider):
            out: list[SegmentScriptSchema] = []
            for seg in segments:
                shots2 = [
                    enrich_shot_via_slot_pipeline(sh, seg, assets, blueprint, project_id=project_id)
                    for sh in seg.shots
                ]
                out.append(seg.model_copy(update={"shots": shots2}))
            return out
        return segments


def _build_segment_director_service() -> SegmentDirectorService:
    if settings.SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER:
        return SegmentDirectorService(MockSegmentDirectorProvider())
    return SegmentDirectorService(XAISegmentDirectorProvider(get_xai_text_provider()))


segment_director_service = _build_segment_director_service()
