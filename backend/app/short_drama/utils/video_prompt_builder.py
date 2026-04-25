"""Build reference-to-video inputs from segment scripts + asset rows."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from ..exceptions import ShortDramaVideoInputError
from ..models import CharacterAsset, ProductAsset, SceneAsset
from ..schemas.segment import SegmentScriptSchema


_MAX_PROMPT_LEN = 3800
_MAX_REFS = 7
_STYLE_SUFFIX = (
    "consistent commercial ad video, smooth motion, premium brand tone, "
    "no text overlay, no watermark"
)


@dataclass
class SegmentVideoPlan:
    segment_id: str
    segment_video_prompt: str
    selected_reference_image_urls: list[str] = field(default_factory=list)
    duration_seconds: int = 6
    aspect_ratio: str = "9:16"
    resolution: str | None = "720p"
    execution_input: dict = field(default_factory=dict)


def _norm_name(s: str) -> str:
    return (s or "").strip().casefold()


def _dedupe_preserve(urls: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for u in urls:
        u = (u or "").strip()
        if not u or u in seen:
            continue
        seen.add(u)
        out.append(u)
    return out


def _merge_shot_video_prompts(segment: SegmentScriptSchema) -> str:
    parts: list[str] = []
    for shot in segment.shots:
        vp = (shot.video_prompt or "").strip()
        if not vp:
            continue
        if vp not in parts:
            parts.append(vp)
        extras = " ".join(
            x
            for x in [
                f"MUST SHOW: {'; '.join(shot.must_show)}." if shot.must_show else "",
                f"DO NOT SHOW: {'; '.join(shot.must_avoid)}." if shot.must_avoid else "",
                f"SOURCE SELLING POINT: {shot.source_selling_point}." if shot.source_selling_point else "",
            ]
            if x
        ).strip()
        if extras and extras not in parts:
            parts.append(extras)
    if not parts:
        for shot in segment.shots:
            fallback = " ".join(
                x
                for x in (
                    (shot.visual_description or "").strip(),
                    (shot.action_description or "").strip(),
                )
                if x
            ).strip()
            if fallback and fallback not in parts:
                parts.append(fallback)
    text = " ".join(parts).strip()
    text = re.sub(r"\s+", " ", text)
    if not text:
        raise ShortDramaVideoInputError(
            f"Segment {segment.segment_id!r} has empty video_prompt (and no usable shot fallback)"
        )
    suffix = f". {_STYLE_SUFFIX}"
    max_main = max(100, _MAX_PROMPT_LEN - len(suffix))
    if len(text) > max_main:
        text = text[:max_main].rstrip() + "…"
    return (text + suffix).strip()


def _duration_for_segment(segment: SegmentScriptSchema) -> int:
    limit = float(segment.duration_limit or 0.0)
    if limit > 10.0:
        raise ShortDramaVideoInputError(
            f"Segment {segment.segment_id!r} duration_limit {limit}s exceeds 10s (reference-to-video cap)"
        )
    if limit > 0:
        d = int(round(limit))
    else:
        total = sum(float(s.duration_seconds or 0.0) for s in segment.shots)
        d = int(round(total)) if total > 0 else 6
    if d > 10:
        raise ShortDramaVideoInputError(
            f"Segment {segment.segment_id!r} effective duration {d}s exceeds 10s"
        )
    if d < 1:
        d = 1
    return min(10, d)


def _char_by_name(chars: list[CharacterAsset]) -> dict[str, CharacterAsset]:
    return {_norm_name(c.name): c for c in chars}


def _scene_by_name(scenes: list[SceneAsset]) -> dict[str, SceneAsset]:
    return {_norm_name(s.name): s for s in scenes}


def build_segment_video_plan(
    segment: SegmentScriptSchema,
    *,
    characters: list[CharacterAsset],
    scenes: list[SceneAsset],
    products: list[ProductAsset],
    project_aspect_ratio: str | None,
) -> SegmentVideoPlan:
    prompt = _merge_shot_video_prompts(segment)
    duration = _duration_for_segment(segment)
    ar = (project_aspect_ratio or "9:16").strip()
    if ":" not in ar:
        ar = "9:16"

    cmap = _char_by_name(characters)
    smap = _scene_by_name(scenes)

    ref_urls: list[str] = []
    for shot in segment.shots:
        for cref in shot.character_refs or []:
            key = _norm_name(str(cref))
            row = cmap.get(key)
            if row and row.image_url:
                ref_urls.append(row.image_url)
        sref = _norm_name(str(shot.scene_ref or ""))
        if sref:
            row = smap.get(sref)
            if row and row.image_url:
                ref_urls.append(row.image_url)

    for p in sorted(products, key=lambda x: x.id):
        if p.image_url:
            ref_urls.append(p.image_url)

    ref_urls = _dedupe_preserve(ref_urls)
    if not ref_urls:
        raise ShortDramaVideoInputError(
            f"Segment {segment.segment_id!r} has no reference images "
            "(character/scene/product image_url required for reference-to-video)"
        )
    if len(ref_urls) > _MAX_REFS:
        ref_urls = ref_urls[:_MAX_REFS]

    return SegmentVideoPlan(
        segment_id=segment.segment_id,
        segment_video_prompt=prompt,
        selected_reference_image_urls=ref_urls,
        duration_seconds=duration,
        aspect_ratio=ar,
        resolution="720p",
        execution_input={
            "segment_id": segment.segment_id,
            "shot_ids": [s.shot_id for s in segment.shots],
            "video_prompt": prompt,
            "duration_limit": duration,
            "character_refs": list(dict.fromkeys([r for s in segment.shots for r in s.character_refs])),
            "scene_ref": list(dict.fromkeys([s.scene_ref for s in segment.shots if s.scene_ref])),
            "product_refs": list(dict.fromkeys([r for s in segment.shots for r in s.product_refs])),
            "must_show": list(dict.fromkeys([r for s in segment.shots for r in s.must_show])),
            "must_avoid": list(dict.fromkeys([r for s in segment.shots for r in s.must_avoid])),
            "source_selling_point": list(dict.fromkeys([s.source_selling_point for s in segment.shots if s.source_selling_point])),
            "source_visual_constraints": [s.source_visual_constraints for s in segment.shots if s.source_visual_constraints],
            "aspect_ratio": ar,
            "reference_image_urls": ref_urls,
        },
    )
