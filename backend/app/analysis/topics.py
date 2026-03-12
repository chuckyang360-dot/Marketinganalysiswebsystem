"""
Topics Analysis Module

Extracts trending topics from mentions.
"""

from typing import List, Set
from ..providers.base import Mention
from pydantic import BaseModel


class TopicItem(BaseModel):
    """Single topic item."""
    keyword: str
    count: int


class TopicResult(BaseModel):
    """Result of topic analysis."""
    topics: List[str]
    total_topics: int


# 常用英文停用词
STOPWORDS = {
    # 代词和冠词
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "had", "has", "have", "he", "her", "his", "i", "in", "is", "it", "its", "of", "on", "or", "she", "so", "that", "the", "their", "them", "there", "these", "they", "this", "those", "to", "was", "were", "will", "with",
    # 助动词
    "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "shall", "should", "will", "would", "could", "can", "may", "might", "must", "ought",
    # 其他常见停用词
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "than", "too", "very", "just", "also", "now", "here", "how", "why", "when", "where", "which", "while", "about", "up", "out", "down", "off", "over", "under", "again", "further", "then", "once", "new", "into", "through", "during", "before", "after", "above", "below", "between"
}


async def get_topics(mentions: List[Mention], top_n: int = 5) -> List[str]:
    """
    Extract trending topics from mentions.

    Args:
        mentions: List of Mention objects
        top_n: Number of top mentions to analyze
        limit: Maximum number of topics to return

    Returns:
            List of topic strings
    """
    if not mentions:
        return []

    # Extract keywords from mentions with filtering
    all_keywords = []
    for mention in mentions:
        words = mention.text.lower().split()
        # Filter out stopwords and short words
        for word in words:
            word = word.strip(".,!?;:\"'()[]{}")
            if word and len(word) >= 3 and word not in STOPWORDS:
                all_keywords.append(word)

    # Count keyword frequency
    keyword_counts = {}
    for keyword in all_keywords:
        keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1

    # Get top keywords
    sorted_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:top_n * 2]

    # Generate topic suggestions from top keywords
    topics = []
    seen_keywords = set()

    for keyword, count in sorted_keywords:
        if count >= 3 and keyword not in seen_keywords:
            # Skip words that are too generic
            generic_words = {"time", "way", "day", "people", "make", "get", "use", "need", "find", "look", "see", "go", "know", "think", "come"}
            if keyword not in generic_words:
                topic = f"{keyword}: 被 {count} 次讨论"
                topics.append(topic)
                seen_keywords.add(keyword)

        if len(topics) >= top_n:
            break

    return topics[:top_n]


async def analyze_topic_trends(
    mentions: List[Mention]
) -> dict:
    """Analyze topic trends over time from mentions."""
    # MVP: Simple implementation
    return {
        "trends": [],
        "insights": "需要更多数据来分析趋势"
    }
