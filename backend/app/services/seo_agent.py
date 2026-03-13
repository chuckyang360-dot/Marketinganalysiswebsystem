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
import logging
import re
from .seo_search import seo_search_service
from ..analysis.sentiment import analyze_sentiment
from ..analysis.summary import summary_generator
from ..analysis.topics import get_topics
from ..analysis.alerts import detect_alerts

# Configure logging
logger = logging.getLogger(__name__)


class SEOAgent:
    """
    SEO Analysis Agent (MVP)

    Purpose: SUPPLY SIDE - Analyze high-quality search results and content supply

    Responsibilities:
    - Retrieve high-quality web content using search service
    - Analyze content supply and availability
    - Perform sentiment analysis on content
    - Generate summary of content landscape
    - Extract topics from content
    - Detect alerts (content gaps, negative coverage)
    - Provide unified analysis output

    Focus: Content types, competitor analysis, keyword coverage, search intent
    NOT: Discussion posts, Q&A, community content (unless query requires it)
    """

    def __init__(self):
        """Initialize SEO agent with search service and analysis modules."""
        self.search_service = seo_search_service
        self.summary_generator = summary_generator

    def _deduplicate_mentions(self, mentions: List) -> List:
        """
        Deduplicate mentions based on URL or id.

        Args:
            mentions: List of Mention objects

        Returns:
            Deduplicated list of mentions
        """
        seen_urls = set()
        seen_ids = set()
        unique_mentions = []

        for mention in mentions:
            url = getattr(mention, 'url', '') or ''
            mention_id = getattr(mention, 'id', '') or ''

            # Deduplicate by URL first, then by id
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_mentions.append(mention)
            elif mention_id and mention_id not in seen_ids:
                seen_ids.add(mention_id)
                unique_mentions.append(mention)

        return unique_mentions

    def _validate_mentions(self, mentions: List) -> List:
        """
        Validate mentions - filter out empty or invalid ones.

        Args:
            mentions: List of Mention objects

        Returns:
            Validated list of mentions
        """
        valid_mentions = []
        for mention in mentions:
            # Check for required fields
            text = getattr(mention, 'text', '') or ''
            url = getattr(mention, 'url', '') or ''

            # Only keep mentions with at least text or URL
            if text or url:
                # Add platform if missing
                if not hasattr(mention, 'platform') or not mention.platform:
                    mention.platform = "seo"
                valid_mentions.append(mention)
            else:
                logger.warning(f"Filtered out invalid mention: {mention}")

        return valid_mentions

    def clean_text(self, text: str) -> str:
        """
        Clean web text by removing HTML, UI elements, and navigation noise.

        Args:
            text: Raw text from web scraping

        Returns:
            Cleaned text containing only meaningful content
        """
        if not text:
            return ""

        cleaned = text

        # 1. Remove HTML tags
        cleaned = re.sub(r'<[^>]+>', ' ', cleaned)

        # 2. Remove HTML attributes (class="", style="", etc.)
        cleaned = re.sub(r'\s+[a-zA-Z-]+\s*=\s*["\'][^"\']*["\']', ' ', cleaned)

        # 3. Remove HTML entities (&amp;, &nbsp;, etc.)
        cleaned = re.sub(r'&[a-zA-Z]+;', ' ', cleaned)

        # 4. Remove UI/navigation elements
        ui_patterns = [
            r'Sitemap', r'Open in app', r'Sign up', r'Sign in', r'Get app',
            r'Write', r'Search', r'Medium Logo', r'Get Started', r'Github',
            r'Product', r'Features', r'Logo', r'Live Event', r'Sign Up Now',
            r'Episode', r'Published', r'Min read', r'Last updated',
            r'Article', r'News', r'Blog', r'Guide', r'Tutorial'
        ]
        for pattern in ui_patterns:
            cleaned = re.sub(pattern, ' ', cleaned, flags=re.IGNORECASE)

        # 5. Remove Markdown markers
        cleaned = re.sub(r'#+\s*', '', cleaned)  # Headers
        cleaned = re.sub(r'\*\*', '', cleaned)  # Bold
        cleaned = re.sub(r'\*', '', cleaned)  # Italic
        cleaned = re.sub(r'__', '', cleaned)  # Bold
        cleaned = re.sub(r'_', '', cleaned)  # Italic
        cleaned = re.sub(r'`+', '', cleaned)  # Code markers
        cleaned = re.sub(r'>\s*', '', cleaned)  # Quotes
        cleaned = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', cleaned)  # Links: [text](url)
        cleaned = re.sub(r'\[.*?\]', '', cleaned)  # Links without url

        # 6. Remove URL patterns
        cleaned = re.sub(r'https?://\S+', '', cleaned)
        cleaned = re.sub(r'www\.\S+', '', cleaned)

        # 7. Remove JSON/attribute field structures
        cleaned = re.sub(r'\{[^}]*\}', ' ', cleaned)  # Remove JSON-like objects
        cleaned = re.sub(r'["\'][\w_]+["\']\s*:\s*', '', cleaned)  # Remove "field": patterns
        cleaned = re.sub(r'[\w_]+\s*:\s*["\']?', '', cleaned)  # Remove field: patterns

        # 8. Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned)
        cleaned = cleaned.strip()

        return cleaned

    def _clean_mentions_text(self, mentions: List) -> List:
        """
        Clean text in all mentions for better analysis.

        Args:
            mentions: List of Mention objects

        Returns:
            List of mentions with cleaned text
        """
        cleaned_mentions = []
        for mention in mentions:
            # Create a copy with cleaned text
            original_text = getattr(mention, 'text', '') or ''
            cleaned_text = self.clean_text(original_text)

            if hasattr(mention, 'model_copy'):
                # For Pydantic models, use model_copy
                mention = mention.model_copy(update={"text": cleaned_text})
            else:
                # For regular objects/dicts, directly update
                mention.text = cleaned_text

            cleaned_mentions.append(mention)

        return cleaned_mentions

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
            - source: Data source identifier ("seo")
            - query: Original search query
            - keywords: Keywords used for search
            - site_url: Site URL used for filtering (if any)
            - summary: Generated summary text
            - sentiment: Sentiment breakdown (positive, negative, neutral)
            - topics: List of trending topics
            - alerts: List of detected alerts
            - mentions: List of Mention objects
            - total_mentions: Total count of mentions
            - unique_mentions: Count of unique mentions after deduplication
        """
        # Log input
        query_info = {
            "keywords": keywords,
            "site_url": site_url,
            "limit": limit
        }
        logger.info(f"[SEO_AGENT] Starting analysis with query: {query_info}")
        print(f"[SEO_AGENT] Starting analysis with query: {query_info}")

        # Use the first keyword for MVP
        keyword = keywords[0] if keywords else ""
        if not keyword:
            logger.error("[SEO_AGENT] No keywords provided")
            print("[SEO_AGENT] No keywords provided")
            return {
                "source": "seo",
                "query": "",
                "keywords": [],
                "site_url": site_url,
                "summary": "未提供关键词",
                "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 0.0},
                "topics": [],
                "alerts": [],
                "mentions": [],
                "total_mentions": 0,
                "unique_mentions": 0
            }

        # 1. Retrieve mentions
        logger.info("[SEO_AGENT] Step 1: Retrieving mentions from search service...")
        print("[SEO_AGENT] Step 1: Retrieving mentions from search service...")

        search_result = await self.search_service.search_by_keyword(
            keyword=keyword,
            site_url=site_url,
            limit=limit
        )

        raw_mentions = search_result.mentions

        logger.info(f"[SEO_AGENT] Step 1: Retrieved {len(raw_mentions)} raw mentions")
        print(f"[SEO_AGENT] Step 1: Retrieved {len(raw_mentions)} raw mentions")

        if raw_mentions:
            # Print first mention for debugging
            first_mention = raw_mentions[0]
            logger.info(f"[SEO_AGENT] First raw mention: {first_mention}")
            print(f"[SEO_AGENT] First raw mention: {first_mention}")

        if not raw_mentions:
            logger.warning("[SEO_AGENT] No mentions found, returning empty result")
            print("[SEO_AGENT] No mentions found, returning empty result")

            return {
                "source": "seo",
                "query": keyword,
                "keywords": keywords,
                "site_url": site_url,
                "summary": "未找到相关内容",
                "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 0.0},
                "topics": [],
                "alerts": [],
                "mentions": [],
                "total_mentions": 0,
                "unique_mentions": 0
            }

        # 2. Validate mentions
        logger.info("[SEO_AGENT] Step 2: Validating mentions...")
        print("[SEO_AGENT] Step 2: Validating mentions...")

        validated_mentions = self._validate_mentions(raw_mentions)

        logger.info(f"[SEO_AGENT] Step 2: Validated {len(validated_mentions)} mentions")
        print(f"[SEO_AGENT] Step 2: Validated {len(validated_mentions)} mentions")

        if not validated_mentions:
            logger.warning("[SEO_AGENT] All mentions failed validation")
            print("[SEO_AGENT] All mentions failed validation")

            return {
                "source": "seo",
                "query": keyword,
                "keywords": keywords,
                "site_url": site_url,
                "summary": "未找到有效内容",
                "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 0.0},
                "topics": [],
                "alerts": [],
                "mentions": [],
                "total_mentions": len(raw_mentions),
                "unique_mentions": 0
            }

        # 3. Deduplicate mentions
        logger.info("[SEO_AGENT] Step 3: Deduplicating mentions...")
        print("[SEO_AGENT] Step 3: Deduplicating mentions...")

        mentions = self._deduplicate_mentions(validated_mentions)

        logger.info(f"[SEO_AGENT] Step 3: Deduplicated to {len(mentions)} unique mentions")
        print(f"[SEO_AGENT] Step 3: Deduplicated to {len(mentions)} unique mentions")

        # 4. Clean text (remove HTML, UI elements, navigation noise)
        logger.info("[SEO_AGENT] Step 4: Cleaning text to remove HTML/UI elements...")
        print("[SEO_AGENT] Step 4: Cleaning text to remove HTML/UI elements...")

        mentions = self._clean_mentions_text(mentions)

        logger.info(f"[SEO_AGENT] Step 4: Text cleaning complete for {len(mentions)} mentions")
        print(f"[SEO_AGENT] Step 4: Text cleaning complete for {len(mentions)} mentions")

        # 5. Sentiment analysis
        logger.info("[SEO_AGENT] Step 5: Performing sentiment analysis...")
        print("[SEO_AGENT] Step 5: Performing sentiment analysis...")

        sentiment_result = await analyze_sentiment(mentions)

        logger.info(f"[SEO_AGENT] Step 5: Sentiment result - positive: {sentiment_result.positive}, negative: {sentiment_result.negative}, neutral: {sentiment_result.neutral}")
        print(f"[SEO_AGENT] Step 5: Sentiment result - positive: {sentiment_result.positive}, negative: {sentiment_result.negative}, neutral: {sentiment_result.neutral}")

        # 6. Summary generation
        logger.info("[SEO_AGENT] Step 6: Generating summary...")
        print("[SEO_AGENT] Step 6: Generating summary...")

        summary_result = await self.summary_generator.generate(
            mentions=mentions,
            top_n=min(10, len(mentions)),
            influencers_count=3
        )

        logger.info(f"[SEO_AGENT] Step 6: Generated summary: {summary_result.summary}")
        print(f"[SEO_AGENT] Step 6: Generated summary: {summary_result.summary}")

        # 7. Topic extraction
        logger.info("[SEO_AGENT] Step 7: Extracting topics...")
        print("[SEO_AGENT] Step 7: Extracting topics...")

        topics = await get_topics(mentions, top_n=5)

        logger.info(f"[SEO_AGENT] Step 7: Extracted {len(topics)} topics: {topics}")
        print(f"[SEO_AGENT] Step 7: Extracted {len(topics)} topics: {topics}")

        # 8. Alert detection
        logger.info("[SEO_AGENT] Step 8: Detecting alerts...")
        print("[SEO_AGENT] Step 8: Detecting alerts...")

        alerts = await detect_alerts(mentions)

        logger.info(f"[SEO_AGENT] Step 7: Detected {len(alerts)} alerts")
        print(f"[SEO_AGENT] Step 7: Detected {len(alerts)} alerts")

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

        # Prepare mentions data for response
        mentions_data = []
        for mention in mentions:
            if hasattr(mention, 'to_dict'):
                mentions_data.append(mention.to_dict())
            else:
                # Fallback for objects without to_dict method
                mentions_data.append(mention)

        result = {
            "source": "seo",
            "query": keyword,
            "keywords": keywords,
            "site_url": site_url,
            "summary": summary_result.summary,
            "sentiment": {
                "positive": sentiment_result.positive,
                "negative": sentiment_result.negative,
                "neutral": sentiment_result.neutral
            },
            "topics": topics,
            "alerts": formatted_alerts,
            "mentions": mentions_data,
            "total_mentions": len(raw_mentions),
            "unique_mentions": len(mentions)
        }

        logger.info(f"[SEO_AGENT] Analysis complete. Result: {result}")
        print(f"[SEO_AGENT] Analysis complete. Total: {len(raw_mentions)} raw, {len(mentions)} unique mentions")

        return result


# Singleton instance for easy import
seo_agent = SEOAgent()
