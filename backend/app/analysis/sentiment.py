"""
Sentiment Analysis Module

Provides sentiment analysis for mentions across all platforms.
Uses xAI API for sentiment calculation.
"""

from typing import List, Literal, Optional
from ..models.mention import Mention
from ..config import settings
from pydantic import BaseModel
import httpx
import json


class SentimentResult(BaseModel):
    """Result of sentiment analysis."""
    positive: float
    negative: float
    neutral: float


class SentimentItem(BaseModel):
    """Per-mention sentiment output."""
    label: Literal["positive", "negative", "neutral"]
    score: float  # [-1, 1]


def _heuristic_sentiment(text: str) -> SentimentItem:
    """
    Local heuristic fallback when xAI is unavailable.
    This is intentionally simple but produces non-neutral outputs.
    """
    t = (text or "").lower()
    positive_terms = [
        "love", "great", "awesome", "amazing", "good", "best", "helpful", "works", "recommend",
        "满意", "喜欢", "好用", "不错", "棒", "推荐", "太好了", "值",
    ]
    negative_terms = [
        "hate", "bad", "terrible", "awful", "worst", "broken", "scam", "fraud", "issue", "problem",
        "垃圾", "差", "糟糕", "坑", "骗", "崩", "坏了", "投诉", "问题", "失败",
    ]

    pos = sum(1 for w in positive_terms if w in t)
    neg = sum(1 for w in negative_terms if w in t)

    if pos > neg and pos > 0:
        score = min(1.0, 0.4 + 0.2 * pos)
        return SentimentItem(label="positive", score=score)
    if neg > pos and neg > 0:
        score = max(-1.0, -(0.4 + 0.2 * neg))
        return SentimentItem(label="negative", score=score)
    return SentimentItem(label="neutral", score=0.0)


async def analyze_sentiment_per_item(mentions: List[Mention]) -> List[SentimentItem]:
    """
    Analyze sentiment per mention and return label/score for each input mention.

    Uses xAI when configured; falls back to a local heuristic otherwise.
    """
    texts = [(mention.text or "")[:500] for mention in mentions]
    if not texts:
        return []

    # If key is missing, use heuristic fallback
    if not settings.XAI_API_KEY or not settings.XAI_API_URL or not settings.XAI_MODEL:
        return [_heuristic_sentiment(t) for t in texts]

    headers = {
        "Content-Type": "application/json",
        "x-api-key": settings.XAI_API_KEY,
    }

    system_prompt = """You are a sentiment analysis tool.
Classify each mention as positive, negative, or neutral.

Return ONLY valid JSON as an array, in the SAME ORDER as input.
Each item must have:
- label: "positive" | "negative" | "neutral"
- score: float between -1 and 1 (negative for negative, positive for positive, 0 for neutral)

No markdown. No extra text."""

    mentions_text = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.XAI_API_URL}/chat/completions",
                headers=headers,
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Mentions:\n\n{mentions_text}"},
                    ],
                    "model": settings.XAI_MODEL,
                    "stream": False,
                    "temperature": 0.1,
                },
            )

        if response.status_code != 200:
            return [_heuristic_sentiment(t) for t in texts]

        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "[]")

        content = (content or "").strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
        if content.endswith("```"):
            content = content.rsplit("\n", 1)[0]
        content = content.strip()

        parsed = json.loads(content)
        if not isinstance(parsed, list):
            return [_heuristic_sentiment(t) for t in texts]

        items: List[SentimentItem] = []
        for i, obj in enumerate(parsed):
            if not isinstance(obj, dict):
                items.append(_heuristic_sentiment(texts[i] if i < len(texts) else ""))
                continue
            label = str(obj.get("label", "neutral")).lower().strip()
            if label not in ("positive", "negative", "neutral"):
                label = "neutral"
            try:
                score = float(obj.get("score", 0.0))
            except Exception:
                score = 0.0
            score = max(-1.0, min(1.0, score))
            items.append(SentimentItem(label=label, score=score))

        # Ensure length matches input
        if len(items) != len(texts):
            return [_heuristic_sentiment(t) for t in texts]

        return items

    except Exception:
        return [_heuristic_sentiment(t) for t in texts]


async def analyze_sentiment(mentions: List[Mention]) -> SentimentResult:
    """
    Analyze sentiment for a list of mentions.

    Args:
        mentions: List of Mention objects

    Returns:
        SentimentResult with sentiment breakdown
    """
    items = await analyze_sentiment_per_item(mentions)
    pos = sum(1 for it in items if it.label == "positive")
    neg = sum(1 for it in items if it.label == "negative")
    neu = sum(1 for it in items if it.label == "neutral")
    return SentimentResult(positive=float(pos), negative=float(neg), neutral=float(neu))


def calculate_sentiment_score(text: str, sentiment: str) -> float:
    """Calculate sentiment score from text and label."""
    if sentiment == "positive":
        return 0.7
    elif sentiment == "negative":
        return -0.7
    else:
        return 0.0
