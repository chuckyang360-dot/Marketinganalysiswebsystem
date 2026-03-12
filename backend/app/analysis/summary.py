"""
Summary Analysis Module

Generates comprehensive summary from mentions across platforms.
"""

from typing import List
from ..providers.base import Mention
from .sentiment import SentimentResult, analyze_sentiment
from ..config import settings
from pydantic import BaseModel


class SummaryResult(BaseModel):
    """Result of summary analysis."""
    mentions: List[Mention]
    total_mentions: int
    summary: str
    top_influencers: List[dict]
    content_gaps: List[str]


class SummaryGenerator:
    """Generates analysis summary from mentions."""

    def __init__(self):
        self._common_insights = [
            "用户对品牌的核心关注点",
            "最常讨论的痛点和需求",
            "用户满意度指标"
        ]

    def _get_influencers(self, mentions: List[Mention], limit: int = 5) -> List[dict]:
        """Extract top influencers from mentions."""
        # Simple implementation based on engagement
        sorted_by_engagement = sorted(
            [m for m in mentions if m.engagement_total > 0],
            key=lambda x: x.engagement_total,
            reverse=True
        )

        influencers = []
        for mention in sorted_by_engagement[:limit]:
            influencer = {
                "name": mention.author_username or mention.author,
                "handle": f"@{mention.author_username}",
                "followers": mention.followers,
                "engagement": mention.engagement_total,
                "influence": self._calculate_influence_tier(mention.followers)
            }
            influencers.append(influencer)

        return influencers

    def _calculate_influence_tier(self, followers: int) -> str:
        """Calculate influence tier based on follower count."""
        if followers >= 100000:
            return "macro"
        elif followers >= 10000:
            return "mid"
        elif followers >= 1000:
            return "micro"
        else:
            return "nano"

    def generate(
        self,
        mentions: List[Mention],
        top_n: int = 10,
        influencers_count: int = 3
    ) -> SummaryResult:
        """
        Generate comprehensive summary from mentions.

        Args:
            mentions: List of Mention objects
            top_n: Number of top mentions to include
            influencers_count: Number of top influencers to extract

        Returns:
            SummaryResult with complete analysis
        """
        # Extract top mentions for summary
        top_mentions = sorted(
            mentions,
            key=lambda x: x.engagement_total,
            reverse=True
        )[:top_n]

        # Get influencers
        top_influencers = self._get_influencers(mentions, limit=influencers_count)

        # Generate summary
        themes = self._extract_themes(top_mentions)
        sentiment = self._analyze_overall_sentiment(mentions)
        summary_parts = [
            f"基于 {top_n} 条最新提及的分析",
            f"检测到 {len(top_influencers)} 位高影响力用户",
            f"用户主要讨论：{', '.join(themes)}",
            f"整体情绪：{sentiment}"
        ]

        full_summary = "\n\n".join(summary_parts)

        return SummaryResult(
            mentions=top_mentions,
            total_mentions=len(mentions),
            summary=full_summary,
            top_influencers=top_influencers,
            content_gaps=[]
        )

    def _extract_themes(self, mentions: List[Mention]) -> List[str]:
        """Extract common themes from mentions."""
        theme_counts = {}
        for mention in mentions:
            # Simple theme extraction (could be improved with LLM)
            text_lower = mention.text.lower()
            for theme_keyword in ["quality", "price", "service", "feature", "support", "delivery", "experience"]:
                if theme_keyword in text_lower:
                    theme_counts[theme_keyword] = theme_counts.get(theme_keyword, 0) + 1

        # Get top themes
        top_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return [f"{theme}: {count}" for theme, count in top_themes]

    def _analyze_overall_sentiment(self, mentions: List[Mention]) -> str:
        """Analyze overall sentiment from mentions."""
        positive_count = sum(1 for m in mentions if m.sentiment == "positive")
        negative_count = sum(1 for m in mentions if m.sentiment == "negative")
        neutral_count = len(mentions) - positive_count - negative_count

        total = len(mentions)

        if total > 0:
            if positive_count / total > 0.6:
                return "positive"
            elif negative_count / total > 0.2:
                return "negative"
            else:
                return "neutral"
        else:
            return "neutral"


# Singleton
summary_generator = SummaryGenerator()
