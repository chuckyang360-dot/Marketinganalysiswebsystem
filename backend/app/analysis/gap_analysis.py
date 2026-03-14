"""
Keyword Gap Analysis Module

Compares Reddit Agent (demand side) and SEO Agent (supply side) topics
to identify keyword opportunities where demand > supply.

Purpose: Find content opportunities by analyzing the gap between
what users are discussing (Reddit) and what content exists (SEO).
"""

from typing import List, Dict, Any
from collections import Counter
from pydantic import BaseModel
import re


class KeywordOpportunity(BaseModel):
    """Single keyword opportunity."""
    keyword: str
    demand: int
    supply: int
    gap_score: float


class GapAnalysisResult(BaseModel):
    """Result of gap analysis."""
    opportunities: List[KeywordOpportunity]
    reddit_topics: List[str]
    seo_topics: List[str]


def normalize_topic(topic: str) -> str:
    """
    Normalize topic string for matching.

    - Convert to lowercase
    - Strip leading/trailing whitespace
    - Merge multiple spaces into one
    - Remove common punctuation
    - Preserve word/phrase semantics

    Args:
        topic: Raw topic string

    Returns:
        Normalized topic string

    Examples:
        "Shopify SEO" -> "shopify seo"
        "Shopify Seo" -> "shopify seo"
        " Cursor IDE " -> "cursor ide"
        "Copilot Alternative!" -> "copilot alternative"
    """
    if not topic:
        return ""

    # Strip leading/trailing whitespace
    normalized = topic.strip()

    # Convert to lowercase
    normalized = normalized.lower()

    # Remove common punctuation (preserve spaces and hyphens in words)
    # Remove: !, ?, ., ,, ", ', (, ), [, ], {, }, :, ;, *, /, +, =, <, >, |
    normalized = re.sub(r'[!?,.\'"()\[\]{}:;/*+=<>|]', '', normalized)

    # Replace multiple spaces with single space
    normalized = re.sub(r'\s+', ' ', normalized)

    # Strip again (in case punctuation left leading/trailing spaces)
    normalized = normalized.strip()

    return normalized


def analyze_keyword_gap(
    reddit_topics: List[str],
    seo_topics: List[str]
) -> Dict[str, Any]:
    """
    Analyze keyword gap between Reddit (demand) and SEO (supply).

    Args:
        reddit_topics: List of topics from Reddit Agent (demand side)
        seo_topics: List of topics from SEO Agent (supply side)

    Returns:
        Dictionary with opportunities list, sorted by gap_score
    """
    # Normalize reddit_topics
    normalized_reddit_topics = [normalize_topic(t) for t in reddit_topics if t]

    # Normalize seo_topics
    normalized_seo_topics = [normalize_topic(t) for t in seo_topics if t]

    # Count demand from normalized reddit_topics
    demand_counts = Counter(normalized_reddit_topics)

    # Count supply from normalized seo_topics
    supply_counts = Counter(normalized_seo_topics)

    # Get all unique keywords
    all_keywords = set(normalized_reddit_topics) | set(normalized_seo_topics)

    # Calculate gap scores
    opportunities = []

    for keyword in all_keywords:
        demand = demand_counts.get(keyword, 0)
        supply = supply_counts.get(keyword, 0)

        # Only include keywords with demand > 0 (meaningful opportunities)
        if demand == 0:
            continue

        # Calculate gap score: demand / (supply + 1)
        gap_score = demand / (supply + 1)

        opportunities.append(KeywordOpportunity(
            keyword=keyword,
            demand=demand,
            supply=supply,
            gap_score=round(gap_score, 2)
        ))

    # Sort by gap_score (highest first), then by demand (highest first)
    opportunities.sort(
        key=lambda x: (-x.gap_score, -x.demand)
    )

    # Return top 10 opportunities
    top_opportunities = opportunities[:10]

    return {
        "reddit_topics": reddit_topics,
        "seo_topics": seo_topics,
        "opportunities": [
            {
                "keyword": opp.keyword,
                "demand": opp.demand,
                "supply": opp.supply,
                "gap_score": opp.gap_score
            }
            for opp in top_opportunities
        ]
    }
