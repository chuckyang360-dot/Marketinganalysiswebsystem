from __future__ import annotations

import re

from ..exceptions import ShortDramaImageProviderError

_MIN_LEN = 12
_MAX_LEN = 4000

_STYLE_SUFFIX = (
    "consistent commercial ad photography, clean composition, premium brand visual, "
    "no text overlay, no watermark, high detail"
)


def prepare_image_prompt(visual_prompt: str | None) -> str:
    """
    Light sanitizer / enhancer: trim, length bounds, reject empty/vague-only,
    append unified style hints without replacing subject/scene content.
    """
    raw = (visual_prompt or "").strip()
    raw = re.sub(r"\s+", " ", raw)
    if not raw:
        raise ShortDramaImageProviderError("visual_prompt is empty; cannot generate image")
    if len(raw) < _MIN_LEN:
        raise ShortDramaImageProviderError(
            f"visual_prompt too short for image generation (min {_MIN_LEN} chars)"
        )
    if len(raw) > _MAX_LEN:
        raw = raw[:_MAX_LEN]

    vague_only = {"nice", "good", "cool", "beautiful", "cinematic", "shot", "product", "image", "a", "an", "the"}
    tokens = re.findall(r"[a-z0-9]+", raw.lower())
    if tokens and all(t in vague_only for t in tokens):
        raise ShortDramaImageProviderError("visual_prompt is too vague for image generation")

    # Do not duplicate suffix if user already packed similar cues
    low = raw.lower()
    if "no text overlay" in low and "commercial" in low:
        return raw
    return f"{raw}. {_STYLE_SUFFIX}"
