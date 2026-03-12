"""
Sentiment Analysis Module

Provides sentiment analysis for mentions across all platforms.
Uses xAI API for sentiment calculation.
"""

from typing import List
from ..providers.base import Mention
from ..config import settings
from pydantic import BaseModel
import httpx
import json


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

    headers = {
        "Content-Type": "application/json",
        "x-api-key": settings.XAI_API_KEY
    }

    system_prompt = """You are a sentiment analysis assistant. Analyze the sentiment of social media mentions and classify each as positive, negative, or neutral.

Return ONLY a valid JSON object with these exact keys:
- "positive": number of positive mentions
- "negative": number of negative mentions
- "neutral": number of neutral mentions

Do not include any other text, explanation, or commentary. Just the JSON."""

    try:
        if not texts:
            return SentimentResult(positive=0.0, negative=0.0, neutral=0.0)

        # Format mentions as numbered list for clarity
        mentions_text = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.XAI_API_URL}/chat/completions",
                headers=headers,
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Analyze the sentiment of these mentions:\n\n{mentions_text}"}
                    ],
                    "model": settings.XAI_MODEL,
                    "stream": False,
                    "temperature": 0.1  # Low temperature for consistent output
                }
            )

        if response.status_code != 200:
            print(f"xAI API error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return SentimentResult(positive=0.0, negative=0.0, neutral=0.0)

        result = response.json()

        # Parse xAI response
        if "choices" in result and len(result["choices"]) > 0:
            message = result["choices"][0].get("message", {})
            content = message.get("content", "{}")
            try:
                # Clean up the content - remove markdown code blocks if present
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[-1]
                if content.endswith("```"):
                    content = content.rsplit("\n", 1)[0]
                content = content.strip()

                parsed = json.loads(content)

                # Ensure all keys exist and are numbers
                positive = float(parsed.get("positive", 0))
                negative = float(parsed.get("negative", 0))
                neutral = float(parsed.get("neutral", 0))

                # If all zero, fall back to neutral
                total = positive + negative + neutral
                if total == 0:
                    neutral = len(texts)

                return SentimentResult(positive=positive, negative=negative, neutral=neutral)

            except json.JSONDecodeError as e:
                print(f"Failed to parse sentiment JSON: {e}")
                print(f"Raw content: {content[:500]}")
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
