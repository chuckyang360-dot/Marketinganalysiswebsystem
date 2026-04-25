from __future__ import annotations

from typing import Any


_NORTH_AMERICA_MARKET_TERMS = (
    "north america",
    "usa",
    " us ",
    "u.s.",
    "united states",
    "us market",
    "america",
    "canada",
    "北美",
    "美国",
    "加拿大",
)


def _flatten_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(_flatten_text(v) for v in value.values())
    if isinstance(value, (list, tuple, set)):
        return " ".join(_flatten_text(v) for v in value)
    return str(value)


def infer_workflow_language(*values: Any) -> str:
    text = _flatten_text(values)
    return "zh-CN" if any("\u4e00" <= ch <= "\u9fff" for ch in text) else "en-US"


def infer_video_language(workflow_language: str, *market_values: Any) -> str:
    market_text = f" {_flatten_text(market_values).casefold()} "
    if any(term in market_text for term in _NORTH_AMERICA_MARKET_TERMS):
        return "en-US"
    return workflow_language or "zh-CN"


def build_language_policy(*, workflow_source: Any, market_source: Any = None) -> dict[str, str]:
    workflow_language = infer_workflow_language(workflow_source)
    video_language = infer_video_language(workflow_language, market_source if market_source is not None else workflow_source)
    return {
        "workflow_language": workflow_language,
        "video_language": video_language,
    }


def language_prompt_rules(policy: dict[str, str] | None) -> str:
    p = policy or {}
    workflow_language = p.get("workflow_language") or "zh-CN"
    video_language = p.get("video_language") or workflow_language
    return (
        f"workflow_language: {workflow_language}. "
        "All planning fields, explanations, asset names, scene descriptions, and UI-facing text must use this language. "
        f"video_language: {video_language}. "
        "Only dialogue, voiceover, subtitles, screen text, and audience-facing video copy should use this language."
    )
