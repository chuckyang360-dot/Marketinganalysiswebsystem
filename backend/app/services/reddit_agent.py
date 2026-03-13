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
import logging
import re
from .reddit_search import reddit_search_service
from ..analysis.sentiment import analyze_sentiment
from ..analysis.summary import summary_generator
from ..analysis.topics import get_topics
from ..analysis.alerts import detect_alerts

# Configure logging
logger = logging.getLogger(__name__)


class RedditAgent:
    """
    Reddit Analysis Agent (MVP)

    Purpose: DEMAND SIDE - Analyze real user discussions from Reddit

    Responsibilities:
    - Retrieve Reddit data using search service
    - Perform sentiment analysis on user discussions
    - Generate summary of user opinions
    - Extract topics from user conversations
    - Detect alerts (issues, complaints, trending issues)
    - Provide unified analysis output

    Focus: User needs, pain points, sentiment, authentic feedback
    """

    def __init__(self):
        """Initialize Reddit agent with search service and analysis modules."""
        self.search_service = reddit_search_service
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
                    mention.platform = "reddit"
                valid_mentions.append(mention)
            else:
                logger.warning(f"Filtered out invalid mention: {mention}")

        return valid_mentions

    def clean_text(self, text: str) -> str:
        """
        Clean Reddit text by removing HTML, Markdown, JSON, and URL noise.
        Follows "light cleaning" principle - removes structural noise only.

        Preserves natural language including programming keywords and product names.

        Args:
            text: Raw text from Reddit

        Returns:
            Cleaned text containing only natural language
        """
        if not text:
            return ""

        # Log sample before cleaning
        original_sample = text[:200]
        logger.debug(f"[REDDIT_AGENT] clean_text - BEFORE: {original_sample}")

        cleaned = text

        # 1. Remove HTML tags
        cleaned = re.sub(r'<[^>]+>', ' ', cleaned)

        # 2. Remove HTML attributes (class="", style="", token="", etc.)
        cleaned = re.sub(r'\s+[a-zA-Z-]+\s*=\s*["\'][^"\']*["\']', ' ', cleaned)

        # 3. Remove HTML entities (&amp;, &nbsp;, etc.)
        cleaned = re.sub(r'&[a-zA-Z]+;', ' ', cleaned)

        # 4. Remove Markdown markers
        cleaned = re.sub(r'#+\s*', '', cleaned)  # Headers
        cleaned = re.sub(r'\*\*', '', cleaned)  # Bold
        cleaned = re.sub(r'\*', '', cleaned)  # Italic
        cleaned = re.sub(r'__', '', cleaned)  # Bold
        cleaned = re.sub(r'_', '', cleaned)  # Italic
        cleaned = re.sub(r'~~', '', cleaned)  # Strikethrough
        cleaned = re.sub(r'`+', '', cleaned)  # Code markers
        cleaned = re.sub(r'>\s*', '', cleaned)  # Quotes
        cleaned = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', cleaned)  # Links: [text](url)
        cleaned = re.sub(r'\[.*?\]', '', cleaned)  # Links without url

        # 5. Remove URL patterns
        cleaned = re.sub(r'https?://\S+', '', cleaned)
        cleaned = re.sub(r'www\.\S+', '', cleaned)

        # 6. Remove JSON/attribute field structures (keep field names, remove structure)
        cleaned = re.sub(r'\{[^}]*\}', ' ', cleaned)  # Remove JSON-like objects
        cleaned = re.sub(r'["\'][\w_]+["\']\s*:\s*', '', cleaned)  # Remove "field": patterns
        cleaned = re.sub(r'[\w_]+\s*:\s*["\']?', '', cleaned)  # Remove field: patterns

        # 7. Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned)
        cleaned = cleaned.strip()

        # Log sample after cleaning
        cleaned_sample = cleaned[:200]
        logger.debug(f"[REDDIT_AGENT] clean_text - AFTER: {cleaned_sample}")

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
            - source: Data source identifier ("reddit")
            - query: Original search query
            - keywords: Keywords used for search
            - subreddits: Subreddits searched (if any)
            - summary: Generated summary text
            - sentiment: Sentiment breakdown (positive, negative, neutral)
            - topics: List of trending topics (from cleaned text)
            - alerts: List of detected alerts
            - mentions: List of Mention objects (with cleaned text)
            - total_mentions: Total count of mentions
            - unique_mentions: Count of unique mentions after deduplication

        Analysis Flow:
        1. Retrieve mentions from Reddit
        2. Validate mentions
        3. Deduplicate mentions
        4. Clean text (remove HTML, JSON, code tokens)
        5. Extract topics from cleaned text
        6. Perform sentiment analysis
        7. Generate summary
        8. Detect alerts
        """
        # Log input
        query_info = {
            "keywords": keywords,
            "subreddits": subreddits,
            "limit": limit
        }
        logger.info(f"[REDDIT_AGENT] Starting analysis with query: {query_info}")
        print(f"[REDDIT_AGENT] Starting analysis with query: {query_info}")

        # 1. Retrieve mentions
        logger.info("[REDDIT_AGENT] Step 1: Retrieving mentions from search service...")
        print("[REDDIT_AGENT] Step 1: Retrieving mentions from search service...")

        raw_mentions = await self.search_service.search_by_keywords(
            keywords=keywords,
            subreddits=subreddits,
            limit=limit
        )

        logger.info(f"[REDDIT_AGENT] Step 1: Retrieved {len(raw_mentions)} raw mentions")
        print(f"[REDDIT_AGENT] Step 1: Retrieved {len(raw_mentions)} raw mentions")

        if raw_mentions:
            # Print first mention for debugging
            first_mention = raw_mentions[0]
            logger.info(f"[REDDIT_AGENT] First raw mention: {first_mention}")
            print(f"[REDDIT_AGENT] First raw mention: {first_mention}")

        if not raw_mentions:
            logger.warning("[REDDIT_AGENT] No mentions found, returning empty result")
            print("[REDDIT_AGENT] No mentions found, returning empty result")

            return {
                "source": "reddit",
                "query": " ".join(keywords) if keywords else "",
                "keywords": keywords,
                "subreddits": subreddits,
                "summary": "未找到相关提及",
                "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 0.0},
                "topics": [],
                "alerts": [],
                "mentions": [],
                "total_mentions": 0,
                "unique_mentions": 0
            }

        # 2. Validate mentions
        logger.info("[REDDIT_AGENT] Step 2: Validating mentions...")
        print("[REDDIT_AGENT] Step 2: Validating mentions...")

        validated_mentions = self._validate_mentions(raw_mentions)

        logger.info(f"[REDDIT_AGENT] Step 2: Validated {len(validated_mentions)} mentions")
        print(f"[REDDIT_AGENT] Step 2: Validated {len(validated_mentions)} mentions")

        if not validated_mentions:
            logger.warning("[REDDIT_AGENT] All mentions failed validation")
            print("[REDDIT_AGENT] All mentions failed validation")

            return {
                "source": "reddit",
                "query": " ".join(keywords) if keywords else "",
                "keywords": keywords,
                "subreddits": subreddits,
                "summary": "未找到有效内容",
                "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 0.0},
                "topics": [],
                "alerts": [],
                "mentions": [],
                "total_mentions": len(raw_mentions),
                "unique_mentions": 0
            }

        # 3. Deduplicate mentions
        logger.info("[REDDIT_AGENT] Step 3: Deduplicating mentions...")
        print("[REDDIT_AGENT] Step 3: Deduplicating mentions...")

        mentions = self._deduplicate_mentions(validated_mentions)

        logger.info(f"[REDDIT_AGENT] Step 3: Deduplicated to {len(mentions)} unique mentions")
        print(f"[REDDIT_AGENT] Step 3: Deduplicated to {len(mentions)} unique mentions")

        # 4. Clean text (NEW - before topic extraction)
        logger.info("[REDDIT_AGENT] Step 4: Cleaning text to remove HTML/JSON/code tokens...")
        print("[REDDIT_AGENT] Step 4: Cleaning text to remove HTML/JSON/code tokens...")

        mentions = self._clean_mentions_text(mentions)

        logger.info(f"[REDDIT_AGENT] Step 4: Text cleaning complete for {len(mentions)} mentions")
        print(f"[REDDIT_AGENT] Step 4: Text cleaning complete for {len(mentions)} mentions")

        # 5. Topic extraction (uses cleaned text)
        logger.info("[REDDIT_AGENT] Step 5: Extracting topics from cleaned text...")
        print("[REDDIT_AGENT] Step 5: Extracting topics from cleaned text...")

        topics = await get_topics(mentions, top_n=5)

        logger.info(f"[REDDIT_AGENT] Step 5: Extracted {len(topics)} topics: {topics}")
        print(f"[REDDIT_AGENT] Step 5: Extracted {len(topics)} topics: {topics}")

        # 6. Sentiment analysis
        logger.info("[REDDIT_AGENT] Step 6: Performing sentiment analysis...")
        print("[REDDIT_AGENT] Step 6: Performing sentiment analysis...")

        sentiment_result = await analyze_sentiment(mentions)

        logger.info(f"[REDDIT_AGENT] Step 6: Sentiment result - positive: {sentiment_result.positive}, negative: {sentiment_result.negative}, neutral: {sentiment_result.neutral}")
        print(f"[REDDIT_AGENT] Step 6: Sentiment result - positive: {sentiment_result.positive}, negative: {sentiment_result.negative}, neutral: {sentiment_result.neutral}")

        # 7. Summary generation
        logger.info("[REDDIT_AGENT] Step 7: Generating summary...")
        print("[REDDIT_AGENT] Step 7: Generating summary...")

        summary_result = await self.summary_generator.generate(
            mentions=mentions,
            top_n=min(10, len(mentions)),
            influencers_count=3
        )

        logger.info(f"[REDDIT_AGENT] Step 7: Generated summary: {summary_result.summary}")
        print(f"[REDDIT_AGENT] Step 7: Generated summary: {summary_result.summary}")

        # 8. Alert detection
        logger.info("[REDDIT_AGENT] Step 8: Detecting alerts...")
        print("[REDDIT_AGENT] Step 8: Detecting alerts...")

        alerts = await detect_alerts(mentions)

        logger.info(f"[REDDIT_AGENT] Step 8: Detected {len(alerts)} alerts")
        print(f"[REDDIT_AGENT] Step 8: Detected {len(alerts)} alerts")

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
            "source": "reddit",
            "query": " ".join(keywords) if keywords else "",
            "keywords": keywords,
            "subreddits": subreddits,
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

        logger.info(f"[REDDIT_AGENT] Analysis complete. Result: {result}")
        print(f"[REDDIT_AGENT] Analysis complete. Total: {len(raw_mentions)} raw, {len(mentions)} unique mentions")

        return result


# Singleton instance for easy import
reddit_agent = RedditAgent()
