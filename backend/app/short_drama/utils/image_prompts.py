from __future__ import annotations

import logging
import re

from ..exceptions import ShortDramaImageProviderError

_MIN_LEN = 12
_MAX_LEN = 4000

logger = logging.getLogger(__name__)

NEGATIVE_PROMPT = "no text, no captions, no subtitles, no watermark, no logo"

_STYLE_SUFFIX = (
    "consistent commercial ad photography, clean composition, premium brand visual, "
    "high detail, realistic style, natural lighting"
)

_UI_NOISE_TERMS = (
    "新增角色",
    "添加角色",
    "新增场景",
    "添加场景",
    "新增产品",
    "添加产品",
    "新添加角色",
    "新添加场景",
    "新添加产品",
)


def _strip_ui_noise(text: str) -> str:
    out = text
    for term in _UI_NOISE_TERMS:
        out = out.replace(term, " ")
    out = re.sub(r"\s+", " ", out).strip()
    return out


def _contains_chinese(text: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", text))


def _sanitize_source_for_prompt(text: str, max_len: int = 180) -> str:
    s = re.sub(r"\s+", " ", str(text or "")).strip()
    s = re.sub(r"[\r\n\t]+", " ", s)
    s = re.sub(r"[\"'`]+", "", s)
    if len(s) > max_len:
        s = s[:max_len].rstrip(" ,.;:") + "..."
    return s


def _extract_visual_tags(raw: str, asset_type: str) -> list[str]:
    tags: list[str] = []
    mapping = [
        (r"(女|女性|女生|女人)", "female"),
        (r"(男|男性|男生|男人)", "male"),
        (r"(教练|健身教练)", "fitness coach"),
        (r"(经理|总经理|高管)", "business executive"),
        (r"(年轻|20|二十|28)", "late 20s"),
        (r"(长发)", "long dark hair"),
        (r"(短发)", "short neat hair"),
        (r"(小麦色|健康肤色)", "healthy tan skin tone"),
        (r"(身材好|健美|肌肉|匀称|运动)", "athletic build"),
        (r"(自信|专业)", "confident expression"),
        (r"(办公室)", "modern office environment"),
        (r"(健身房|gym)", "bright gym environment"),
        (r"(产品|商品)", "hero product focus"),
        (r"(电商|广告|商业)", "commercial advertising look"),
        (r"(写实|真实)", "photorealistic style"),
    ]
    low = raw.lower()
    for pattern, phrase in mapping:
        if re.search(pattern, raw, flags=re.IGNORECASE):
            tags.append(phrase)
    if "product" in low and "hero product focus" not in tags:
        tags.append("hero product focus")
    if asset_type == "product" and "studio product photography" not in tags:
        tags.append("studio product photography")
    if asset_type == "scene" and "environment-focused composition" not in tags:
        tags.append("environment-focused composition")
    return list(dict.fromkeys(tags))


def build_visual_prompt(asset_input: dict[str, str]) -> str:
    """Build an English, visual-only prompt from user input."""
    asset_type = (asset_input.get("asset_type") or "").strip().lower()
    name = _strip_ui_noise((asset_input.get("name") or "").strip())
    description = _strip_ui_noise((asset_input.get("description") or "").strip())
    source = " ".join([name, description]).strip()

    subject_by_type = {
        "character": "A character portrait for short-form commercial storytelling",
        "scene": "A cinematic environment scene for short-form commercial storytelling",
        "product": "A premium product hero shot for short-form commercial storytelling",
    }
    subject = subject_by_type.get(asset_type, "A commercial visual concept image")
    tags = _extract_visual_tags(source, asset_type)
    source_details = _sanitize_source_for_prompt(source)
    if not tags:
        if asset_type == "character":
            tags = ["clean portrait framing", "professional styling", "confident posture"]
        elif asset_type == "scene":
            tags = ["clear depth layering", "cinematic composition", "clean environment details"]
        else:
            tags = ["hero product composition", "high-end materials", "studio lighting"]

    # Preserve user semantic subject even when source text is Chinese.
    detail_parts: list[str] = []
    if source_details:
        detail_parts.append(f"subject details: {source_details}")
    detail_parts.extend(tags)
    detail = ", ".join(detail_parts)

    if _contains_chinese(source):
        return f"{subject}, {detail}, {NEGATIVE_PROMPT}"

    return f"{subject}, {detail}, {NEGATIVE_PROMPT}"


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
    final_prompt = raw
    if NEGATIVE_PROMPT not in low:
        final_prompt = f"{final_prompt}, {NEGATIVE_PROMPT}"
    if "commercial" not in low:
        final_prompt = f"{final_prompt}. {_STYLE_SUFFIX}"
    return final_prompt
