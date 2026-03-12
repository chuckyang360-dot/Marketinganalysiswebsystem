"""
SEO Agent Service

This module coordinates SEO data retrieval with comprehensive analysis.
It integrates search, sentiment, summary, topics, and alerts modules.

Architecture:
- Uses SEOSearchService for data retrieval
- Coordinates with Analysis Layer modules
- Provides unified interface for SEO platform intelligence
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from .seo_search import seo_search_service
from ..analysis.sentiment import analyze_sentiment
from ..analysis.summary import summary_generator
from ..analysis.topics import get_topics
from ..analysis.alerts import detect_alerts


class SEOAgent:
    """
    SEO Analysis Agent (MVP)

    Responsibilities:
    - Retrieve web content using search service
    - Perform sentiment analysis
    - Generate summary
    - Extract topics
    - Detect alerts
    - Provide unified analysis output
    """

    def __init__(self):
        """Initialize SEO agent with search service and analysis modules."""
        self.search_service = seo_search_service
        self.summary_generator = summary_generator

    async def run_analysis(
        self,
        keywords: List[str],
        site_url: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis on SEO search results.

        Args:
            keywords: List of keywords to search
            site_url: Optional site domain to filter results
            limit: Maximum number of results

        Returns:
            Dictionary with unified analysis structure:
            - summary: Generated summary text
            - sentiment: Sentiment breakdown (positive, negative, neutral)
            - topics: List of trending topics
            - alerts: List of detected alerts
            - mentions: List of Mention objects
        """
        # 1. Retrieve mentions using first keyword for MVP
        search_result = await self.search_service.search_by_keyword(
            keyword=keywords[0],
            site_url=site_url,
            limit=limit
        )

        mentions = search_result.mentions

        if not mentions:
            return {
                "summary": "未找到相关内容",
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
seo_agent = SEOAgent()
