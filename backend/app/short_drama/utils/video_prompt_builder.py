"""Build reference-to-video inputs from segment scripts + asset rows."""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field

from ..exceptions import ShortDramaVideoInputError
from ..models import CharacterAsset, ProductAsset, SceneAsset
from ..schemas.segment import SegmentScriptSchema


MAX_XAI_VIDEO_PROMPT_CHARS = 3500
_HARD_XAI_VIDEO_PROMPT_CHARS = 4096
_MAX_REFS = 7
_STYLE_SUFFIX = "commercial ad video, consistent identity, no text overlay, no watermark"
_REPETITIVE_PROMPT_PHRASES = (
    "Cinematic 9:16 vertical composition",
    "movie-grade lighting",
    "dynamic camera movement",
)
logger = logging.getLogger(__name__)


@dataclass
class SegmentVideoPlan:
    segment_id: str
    segment_video_prompt: str
    selected_reference_image_urls: list[str] = field(default_factory=list)
    duration_seconds: int = 6
    aspect_ratio: str = "9:16"
    resolution: str | None = "720p"
    execution_input: dict = field(default_factory=dict)
    prompt_budget: dict = field(default_factory=dict)


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


def _compact_text(text: str, max_chars: int) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars].rstrip()
    boundary = max(cut.rfind("."), cut.rfind(";"), cut.rfind("，"), cut.rfind("。"))
    if boundary > max_chars * 0.65:
        cut = cut[: boundary + 1].rstrip()
    return cut.rstrip(" ,;，；") + "..."


def _drop_repetitive_boilerplate(text: str) -> str:
    out = text
    for phrase in _REPETITIVE_PROMPT_PHRASES:
        out = re.sub(re.escape(phrase), "", out, flags=re.IGNORECASE)
    out = re.sub(r"\s*[,;，；]\s*[,;，；]+\s*", ", ", out)
    return re.sub(r"\s+", " ", out).strip(" ,;，；")


def _dedupe_text_items(items: list[str], *, max_items: int) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in items:
        item = re.sub(r"\s+", " ", str(raw or "").strip())
        if not item:
            continue
        key = item.casefold()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
        if len(out) >= max_items:
            break
    return out


def _summarize_visual_constraints(segment: SegmentScriptSchema) -> list[str]:
    vals: list[str] = []
    for shot in segment.shots:
        sc = shot.source_visual_constraints or {}
        if not isinstance(sc, dict):
            continue
        for key in ("visual_style", "aspect_ratio"):
            v = sc.get(key)
            if isinstance(v, str) and v.strip():
                vals.append(f"{key}: {v.strip()}")
        for key in ("visual_features", "consistency_notes", "visual_risk_notes", "s2_required_visual_elements"):
            v = sc.get(key)
            if isinstance(v, list):
                vals.extend(str(x) for x in v[:2] if x)
    return _dedupe_text_items(vals, max_items=2)


def _budgeted_segment_prompt(segment: SegmentScriptSchema, *, aspect_ratio: str) -> tuple[str, dict]:
    dropped_sections: list[str] = []
    before_parts: list[str] = []
    final_parts: list[str] = []

    def add(label: str, value: str, max_chars: int) -> None:
        value = re.sub(r"\s+", " ", (value or "").strip())
        if not value:
            return
        before_parts.append(value)
        cleaned = _drop_repetitive_boilerplate(value)
        if cleaned != value:
            dropped_sections.append("repetitive_template_phrases")
        value = cleaned
        if not value:
            return
        compacted = _compact_text(value, max_chars)
        if compacted != value:
            dropped_sections.append(f"{label}_truncated")
        final_parts.append(compacted)

    for shot in segment.shots:
        vp = (shot.video_prompt or "").strip()
        action = (shot.action_description or "").strip()
        shot_text = " ".join(x for x in [f"Shot {shot.shot_id}:", action, vp] if x)
        add(f"shot_{shot.shot_id}", shot_text, 700)

    if not final_parts:
        for shot in segment.shots:
            fallback = " ".join(
                x
                for x in (
                    (shot.visual_description or "").strip(),
                    (shot.action_description or "").strip(),
                )
                if x
            ).strip()
            add(f"fallback_{shot.shot_id}", fallback, 500)

    character_refs = _dedupe_text_items([r for s in segment.shots for r in s.character_refs], max_items=8)
    scene_refs = _dedupe_text_items([s.scene_ref for s in segment.shots if s.scene_ref], max_items=3)
    product_refs = _dedupe_text_items([r for s in segment.shots for r in s.product_refs], max_items=5)
    must_show = _dedupe_text_items([r for s in segment.shots for r in s.must_show], max_items=3)
    must_avoid = _dedupe_text_items([r for s in segment.shots for r in s.must_avoid], max_items=3)
    source_selling = _dedupe_text_items([s.source_selling_point for s in segment.shots if s.source_selling_point], max_items=1)
    visual_constraints = _summarize_visual_constraints(segment)

    add("refs", f"Characters: {', '.join(character_refs)}. Scenes: {', '.join(scene_refs)}. Products: {', '.join(product_refs)}.", 360)
    add("must_show", f"Must show: {'; '.join(must_show)}.", 320)
    add("must_avoid", f"Must avoid: {'; '.join(must_avoid)}.", 320)
    add("visual", f"Aspect ratio: {aspect_ratio}. Visual constraints: {'; '.join(visual_constraints)}.", 260)
    add("source_selling_point", f"Selling point: {'; '.join(source_selling)}.", 180)
    add("style", _STYLE_SUFFIX, 140)

    before_text = " ".join(before_parts)
    text = re.sub(r"\s+", " ", " ".join(final_parts)).strip()
    if not text:
        raise ShortDramaVideoInputError(
            f"Segment {segment.segment_id!r} has empty video_prompt (and no usable shot fallback)"
        )

    before_chars = len(before_text)
    truncated = len(text) > MAX_XAI_VIDEO_PROMPT_CHARS
    if truncated:
        dropped_sections.append("budget_hard_trim")
        text = _compact_text(text, MAX_XAI_VIDEO_PROMPT_CHARS)
    if len(text) > _HARD_XAI_VIDEO_PROMPT_CHARS:
        dropped_sections.append("xai_hard_limit_trim")
        text = _compact_text(text, MAX_XAI_VIDEO_PROMPT_CHARS)
    budget = {
        "before_chars": before_chars,
        "after_chars": len(text),
        "truncated": truncated or bool(dropped_sections),
        "dropped_sections": list(dict.fromkeys(dropped_sections)),
        "final_prompt_preview": text[:500],
    }
    return text, budget


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
    ar = (project_aspect_ratio or "9:16").strip()
    if ":" not in ar:
        ar = "9:16"
    prompt, budget = _budgeted_segment_prompt(segment, aspect_ratio=ar)
    duration = _duration_for_segment(segment)
    logger.info(
        "[S4_VIDEO_PROMPT_BUDGET] segment_id=%s before_chars=%s after_chars=%s truncated=%s dropped_sections=%s final_prompt_preview=%s",
        segment.segment_id,
        budget["before_chars"],
        budget["after_chars"],
        budget["truncated"],
        budget["dropped_sections"],
        budget["final_prompt_preview"],
    )

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
        prompt_budget=budget,
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
            "prompt_budget": budget,
        },
    )
