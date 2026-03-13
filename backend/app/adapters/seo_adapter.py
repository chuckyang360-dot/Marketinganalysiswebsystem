"""
SEO Adapter Module

This module converts SEO data to unified Mention format.
It does NOT inherit from BaseProvider - it's a pure adapter that receives a provider via dependency injection.

Purpose: SUPPLY SIDE
Filters and prioritizes HIGH-QUALITY CONTENT SOURCES:
- Blog posts (Medium, Substack, personal blogs)
- Official documentation
- News articles
- Tutorials and guides
- Product pages
- Industry reports

DISCARDS/DISCOUNTS:
- Discussion-heavy sites (Reddit, forums, Q&A)
- Social media posts
- Community content

Architecture:
- Provider Layer: Data fetching (ExaProvider)
- Adapter Layer: Data normalization and quality filtering
- Services Layer: Business logic coordination
"""

from typing import List, Optional
from datetime import datetime
import logging
import re
from ..providers.base import Mention
from ..config import settings

# Configure logging
logger = logging.getLogger(__name__)


class SEOAdapter:
    """
    Adapter for SEO platform.

    Purpose: SUPPLY SIDE - Get high-quality search results

    Responsibilities:
    - Normalize SEO data to unified Mention format
    - Receive provider via dependency injection (not inheritance)
    - Filter out discussion-heavy sites (Reddit, forums, Q&A)
    - Prioritize blog posts, documentation, news, tutorials
    """

    # High-quality content sources to prioritize
    HIGH_QUALITY_DOMAINS = {
        # Blogs and publishing platforms
        "medium.com", "substack.com", "ghost.org", "wordpress.com",
        # Documentation
        "docs.", "developer.", "dev.to",
        # Tech and tutorials
        "github.io", "gitlab.io", "hashnode.dev",
        # News
        "news.", "theverge.com", "techcrunch.com", "wired.com",
        # Learning platforms
        "coursera.org", "udemy.com", "pluralsight.com", "egghead.io",
        # Official product sites (heuristic)
        "docs.", "developers.", "support.",
    }

    # Discussion-heavy sites to filter out
    DISCUSSION_DOMAINS = {
        "reddit.com", "quora.com", "stackoverflow.com", "stackexchange.com",
        "discourse.org", "proboards.com", "vbulletin.net", "xenforo.com",
        "invisioncommunity.com", "community.", "forum.", "discussions.",
        "disqus.com", "comment.", "comments.",
    }

    def __init__(self, provider):
        """Initialize SEO adapter with injected provider."""
        self.provider = provider

    def _is_high_quality_source(self, mention: Mention) -> bool:
        """
        Check if a mention is from a high-quality content source.

        Returns:
            True if the source is high-quality, False otherwise
        """
        url = (mention.url or "").lower()

        # Check for high-quality domains
        for domain in self.HIGH_QUALITY_DOMAINS:
            if domain in url:
                return True

        # Check for blog-like URLs
        if any(pattern in url for pattern in ["/blog/", "/guide/", "/tutorial/", "/learn/"]):
            return True

        # Check for documentation URLs
        if any(pattern in url for pattern in ["/docs/", "/documentation/", "/api/", "/reference/"]):
            return True

        return False

    def _is_discussion_source(self, mention: Mention) -> bool:
        """
        Check if a mention is from a discussion-heavy site.

        Returns:
            True if the source is discussion-heavy, False otherwise
        """
        url = (mention.url or "").lower()

        # Check for discussion domains
        for domain in self.DISCUSSION_DOMAINS:
            if domain in url:
                return True

        # Check for forum-like URLs
        if any(pattern in url for pattern in ["/forum/", "/forums/", "/thread/", "/discussion/", "/comment/"]):
            return True

        return False

    def _calculate_content_quality_score(self, mention: Mention) -> int:
        """
        Calculate a quality score for a mention based on various factors.

        Returns:
            Quality score (higher is better)
        """
        score = 0
        url = (mention.url or "").lower()
        title = (mention.text or "").lower()

        # High-quality source bonus
        if self._is_high_quality_source(mention):
            score += 50

        # Discussion source penalty
        if self._is_discussion_source(mention):
            score -= 100

        # URL pattern bonuses
        if "/blog/" in url:
            score += 30
        if "/guide/" in url or "/tutorial/" in url:
            score += 40
        if "/docs/" in url:
            score += 35
        if "/article/" in url or "/news/" in url:
            score += 25

        # Content length bonus (longer content is usually more detailed)
        text_length = len(mention.text or "")
        if text_length > 500:
            score += 20
        elif text_length > 200:
            score += 10

        return score

    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> List[Mention]:
        """
        Search for mentions using provider and normalize to Mention format.
        Filters and prioritizes high-quality content sources.

        Args:
            query: Search query string
            limit: Maximum number of results to return

        Returns:
            List of Mention objects (filtered and ranked by quality)
        """
        logger.info(f"[SEO_ADAPTER] search_mentions called with query: '{query}', limit: {limit}")
        print(f"[SEO_ADAPTER] search_mentions called with query: '{query}', limit: {limit}")

        # Use provider to search raw data
        search_result = await self.provider.search_mentions(query, limit)

        raw_mentions = search_result.mentions
        logger.info(f"[SEO_ADAPTER] Provider returned {len(raw_mentions)} mentions")
        print(f"[SEO_ADAPTER] Provider returned {len(raw_mentions)} mentions")

        # Filter out discussion-heavy sites and calculate quality scores
        filtered_mentions = []
        filtered_out_count = 0

        for i, mention in enumerate(raw_mentions):
            url = getattr(mention, 'url', '') or ''
            is_discussion = self._is_discussion_source(mention)
            quality_score = self._calculate_content_quality_score(mention)

            # Log the filtering decision
            logger.debug(f"[SEO_ADAPTER] Mention {i+1}: url={url[:80]}, is_discussion={is_discussion}, quality_score={quality_score}")

            # Filter out low-quality and discussion-heavy content
            if is_discussion and quality_score < 0:
                filtered_out_count += 1
                logger.debug(f"[SEO_ADAPTER] Mention {i+1} FILTERED OUT (discussion source)")
                print(f"[SEO_ADAPTER] Mention {i+1} FILTERED OUT (discussion source): {url[:80]}")
                continue

            # Add quality score to metadata
            metadata = dict(mention.platform_metadata) if mention.platform_metadata else {}
            metadata["seo_quality_score"] = quality_score
            mention.platform_metadata = metadata

            filtered_mentions.append(mention)

        # Sort by quality score (highest first)
        filtered_mentions.sort(key=lambda m: m.platform_metadata.get("seo_quality_score", 0), reverse=True)

        # Take top results
        result_mentions = filtered_mentions[:limit]

        logger.info(f"[SEO_ADAPTER] Filtered: {len(raw_mentions)} raw -> {len(filtered_mentions)} after filtering -> {len(result_mentions)} final (filtered out {filtered_out_count} discussion sources)")
        print(f"[SEO_ADAPTER] Filtered: {len(raw_mentions)} raw -> {len(filtered_mentions)} after filtering -> {len(result_mentions)} final (filtered out {filtered_out_count} discussion sources)")

        # Print top mentions for debugging
        if result_mentions:
            sample_size = min(3, len(result_mentions))
            logger.info(f"[SEO_ADAPTER] Top mentions (first {sample_size}):")
            print(f"[SEO_ADAPTER] Top mentions (first {sample_size}):")
            for i in range(sample_size):
                mention = result_mentions[i]
                mention_info = {
                    "url": getattr(mention, 'url', '')[:80],
                    "quality_score": mention.platform_metadata.get("seo_quality_score", 0)
                }
                logger.info(f"[SEO_ADAPTER]   Mention {i+1}: {mention_info}")
                print(f"[SEO_ADAPTER]   Mention {i+1}: {mention_info}")

        return result_mentions


# Factory function for dependency injection
def create_seo_adapter(provider) -> SEOAdapter:
    """
    Factory function to create SEOAdapter with provider.
    This decouples the adapter from the provider implementation.
    """
    return SEOAdapter(provider)
