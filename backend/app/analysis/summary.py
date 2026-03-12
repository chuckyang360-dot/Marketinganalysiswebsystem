"""
Summary Analysis Module

Generates comprehensive summary from mentions across platforms.
"""

from typing import List, Dict, Any
from ..providers.base import Mention
from .sentiment import SentimentResult, analyze_sentiment
from ..config import settings
from pydantic import BaseModel
import httpx
import json


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
        """Extract top influencers from mentions based on engagement."""
        # Filter mentions with engagement data
        with_engagement = [m for m in mentions if m.engagement_total > 0]

        if not with_engagement:
            return []

        sorted_by_engagement = sorted(
            with_engagement,
            key=lambda x: x.engagement_total,
            reverse=True
        )[:limit]

        influencers = []
        for mention in sorted_by_engagement:
            name = mention.author_username or mention.author or "匿名用户"
            influencer = {
                "name": name,
                "handle": f"@{mention.author_username}" if mention.author_username else "",
                "followers": mention.followers,
                "engagement": mention.engagement_total,
                "influence": self._calculate_influence_tier(mention.followers),
                "platform": mention.platform
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

    async def _ai_enhanced_summary(self, mentions: List[Mention]) -> str:
        """
        Use AI to generate an enhanced summary based on actual mention content.
        Falls back to simple summary if AI fails.
        """
        if not mentions:
            return "未找到相关提及"

        # Extract relevant information for AI analysis
        mention_data = []
        for i, mention in enumerate(mentions[:20], 1):  # Limit to top 20 for API efficiency
            author = mention.author_username or mention.author or "匿名"
            mention_data.append({
                "id": i,
                "author": author,
                "text": mention.text[:300],
                "engagement": mention.engagement_total
            })

        # Get sentiment breakdown
        sentiment_result = await analyze_sentiment(mentions)

        # Prepare prompt for AI
        prompt = f"""Analyze the following social media mentions and generate a concise summary in Chinese.

Mention data:
{json.dumps(mention_data, ensure_ascii=False, indent=2)}

Sentiment breakdown:
- Positive: {sentiment_result.positive}
- Negative: {sentiment_result.negative}
- Neutral: {sentiment_result.neutral}

Return a summary that includes:
1. Main topics being discussed (extract from the actual content)
2. Overall user sentiment
3. Key concerns or praise mentioned by users
4. Notable patterns in the discussions

Keep the summary under 200 Chinese characters. Be specific and data-driven."""

        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": settings.XAI_API_KEY
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.XAI_API_URL}/chat/completions",
                    headers=headers,
                    json={
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a social media analysis expert. Generate concise, data-driven summaries in Chinese."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "model": settings.XAI_MODEL,
                        "stream": False,
                        "temperature": 0.3
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    if "choices" in result and len(result["choices"]) > 0:
                        content = result["choices"][0].get("message", {}).get("content", "").strip()
                        # Clean markdown if present
                        if content.startswith("```"):
                            content = content.split("\n", 1)[-1]
                        if content.endswith("```"):
                            content = content.rsplit("\n", 1)[0]
                        return content.strip()

        except Exception as e:
            print(f"AI summary generation error: {e}")

        # Fallback to simple summary
        return self._generate_simple_summary(mentions, sentiment_result)

    def _generate_simple_summary(self, mentions: List[Mention], sentiment_result: SentimentResult) -> str:
        """Generate a simple summary when AI is not available."""
        total = len(mentions)

        # Extract main themes from text
        themes = self._extract_themes(mentions)

        # Build summary
        parts = [f"分析了 {total} 条社交媒体提及"]

        if sentiment_result.positive > 0:
            parts.append(f"其中积极情绪占比约 {int((sentiment_result.positive/total)*100)}%")
        if sentiment_result.negative > 0:
            parts.append(f"负面情绪占比约 {int((sentiment_result.negative/total)*100)}%")

        if themes:
            parts.append(f"主要关注：{', '.join(themes[:3])}")

        return "。".join(parts) + "。"

    def _extract_themes(self, mentions: List[Mention]) -> List[str]:
        """Extract common themes from mentions based on keywords."""
        theme_keywords = {
            "价格/成本": ["price", "cost", "expensive", "cheap", "affordable", "pricing", "费用", "价格", "贵", "便宜"],
            "质量/性能": ["quality", "performance", "fast", "slow", "reliable", "bug", "crash", "质量", "性能", "稳定", "卡顿"],
            "服务/支持": ["support", "service", "help", "customer", "response", "服务", "客服", "支持", "帮助"],
            "功能/体验": ["feature", "function", "ui", "ux", "design", "easy", "hard", "功能", "体验", "设计", "好用"],
            "更新/变化": ["update", "new", "change", "version", "release", "更新", "版本", "新", "变化"],
            "推荐/分享": ["recommend", "share", "tell", "friend", "推荐", "分享", "朋友", "告诉"],
        }

        theme_counts = {theme: 0 for theme in theme_keywords}

        for mention in mentions:
            text_lower = mention.text.lower()
            for theme, keywords in theme_keywords.items():
                if any(kw in text_lower for kw in keywords):
                    theme_counts[theme] += 1

        # Sort by count and return top themes
        sorted_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)
        return [theme for theme, count in sorted_themes if count > 0]

    async def generate(
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
        if not mentions:
            return SummaryResult(
                mentions=[],
                total_mentions=0,
                summary="未找到相关提及",
                top_influencers=[],
                content_gaps=[]
            )

        # Get top mentions by engagement
        top_mentions = sorted(
            mentions,
            key=lambda x: x.engagement_total,
            reverse=True
        )[:top_n]

        # Get influencers
        top_influencers = self._get_influencers(mentions, limit=influencers_count)

        # Generate AI-enhanced summary
        summary = await self._ai_enhanced_summary(top_mentions)

        return SummaryResult(
            mentions=top_mentions,
            total_mentions=len(mentions),
            summary=summary,
            top_influencers=top_influencers,
            content_gaps=[]
        )


# Singleton
summary_generator = SummaryGenerator()
