"""
Reddit Agent Service

This module coordinates Reddit data retrieval with comprehensive analysis.
It integrates search, sentiment, summary, topics, and alerts modules.

Architecture:
- Uses RedditSearchService for data retrieval
- Coordinates with Analysis Layer modules
- Provides unified interface for Reddit platform intelligence
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from .reddit_search import reddit_search_service
from ..analysis.sentiment import analyze_sentiment
from ..analysis.summary import summary_generator
from ..analysis.topics import get_topics
from ..analysis.alerts import detect_alerts


class RedditAgent:
    """
    Reddit Analysis Agent (MVP)

    Responsibilities:
    - Retrieve Reddit data using search service
    - Perform sentiment analysis
    - Generate summary
    - Extract topics
    - Detect alerts
    - Provide unified analysis output
    """

    def __init__(self):
        """Initialize Reddit agent with search service and analysis modules."""
        self.search_service = reddit_search_service
        self.summary_generator = summary_generator

    async def run_analysis(
        self,
        keywords: List[str],
        subreddits: Optional[List[str]] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis on Reddit mentions.

        Args:
            keywords: List of keywords to search
            subreddits: Optional list of subreddit names to search
            limit: Maximum number of results

        Returns:
            Dictionary with unified analysis structure:
            - summary: Generated summary text
            - sentiment: Sentiment breakdown (positive, negative, neutral)
            - topics: List of trending topics
            - alerts: List of detected alerts
            - mentions: List of Mention objects
        """
        # 1. Retrieve mentions
        mentions = await self.search_service.search_by_keywords(
            keywords=keywords,
            subreddits=subreddits,
            limit=limit
        )

        if not mentions:
            return {
                "summary": "未找到相关提及",
                "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 0.0},
                "topics": [],
                "alerts": [],
                "mentions": []
            }

        # 2. Sentiment analysis
        sentiment_result = await analyze_sentiment(mentions)

        # 3. Summary generation
        summary_result = self.summary_generator.generate(
            mentions=mentions,
            top_n=min(10, len(mentions)),
            influencers_count=3
        )

        # 4. Topic extraction
        topics = await get_topics(mentions, top_n=5)

        # 5. Alert detection
        alerts = await detect_alerts(mentions)

        # Format alerts for response
        formatted_alerts = [
            {
                "level": alert.level,
                "message": alert.message,
                "count": alert.count,
                "affected_users": alert.affected_users
            }
            for alert in alerts
        ]

        return {
            "summary": summary_result.summary,
            "sentiment": {
                "positive": sentiment_result.positive,
                "negative": sentiment_result.negative,
                "neutral": sentiment_result.neutral
            },
            "topics": topics,
            "alerts": formatted_alerts,
            "mentions": mentions
        }


# Singleton instance for easy import
reddit_agent = RedditAgent()
