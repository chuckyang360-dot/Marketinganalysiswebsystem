"""
Sentiment Analysis Module

Provides sentiment analysis for mentions across all platforms.
Uses xAI API for sentiment calculation.
"""

from typing import List
from ..providers.base import Mention
from ..config import settings
from pydantic import BaseModel


class SentimentResult(BaseModel):
    """Result of sentiment analysis."""
    positive: float
    negative: float
    neutral: float


async def analyze_sentiment(mentions: List[Mention]) -> SentimentResult:
    """
    Analyze sentiment for a list of mentions.

    Args:
        mentions: List of Mention objects

    Returns:
        SentimentResult with sentiment breakdown
    """
    # Extract texts for AI analysis
    texts = [mention.text[:200] for mention in mentions]

    # Use xAI to analyze sentiment
    import httpx
    headers = {
        "Content-Type": "application/json",
        "x-api-key": settings.XAI_API_KEY
    }

    prompt = f"""Analyze the sentiment of the following social media mentions about the given brand/topic.
Return only JSON with these keys:
- "positive": number of positive mentions
- "negative": number of negative mentions
- "neutral": number of neutral mentions

Do NOT include any other commentary or explanation. Just return the counts.

Mentions:
{texts}
"""

    try:
        if not texts:
            return SentimentResult(positive=0.0, negative=0.0, neutral=0.0)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.XAI_API_URL}/chat/completions",
                headers=headers,
                json={
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": texts}
                    ],
                    "model": settings.XAI_MODEL,
                    "stream": False
                }
            )

        if response.status_code != 200:
            print(f"xAI API error: {response.status_code}")
            return SentimentResult(positive=0.0, negative=0.0, neutral=0.0)

        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            message = result["choices"][0].get("message", {})
            content = message.get("content", "{}")
            try:
                import json
                parsed = json.loads(content)
                return parsed
            except:
                return SentimentResult(positive=0.0, negative=0.0, neutral=len(texts))
        else:
            return SentimentResult(positive=0.0, negative=0.0, neutral=len(texts))

    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return SentimentResult(positive=0.0, negative=0.0, neutral=len(texts))


def calculate_sentiment_score(text: str, sentiment: str) -> float:
    """Calculate sentiment score from text and label."""
    if sentiment == "positive":
        return 0.7
    elif sentiment == "negative":
        return -0.7
    else:
        return 0.0
