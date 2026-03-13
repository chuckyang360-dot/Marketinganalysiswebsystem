"""
SEO Search Service

This module provides high-level search and analysis services for SEO.
It coordinates between SEO adapter and business logic.

Purpose: SUPPLY SIDE
This agent retrieves HIGH-QUALITY SEARCH RESULTS to analyze:
- Content supply and availability
- Competitor content landscape
- Keyword coverage gaps
- Content types and formats
- Search intent matching
- High-value content sources (blogs, docs, articles, tutorials)

NOT for: Discussion posts, Q&A, community content (unless query specifically requires it)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from ..adapters.seo_adapter import create_seo_adapter
from ..providers.exa_provider import exa_provider
from ..providers.base import SearchResult, Mention, ProviderError

# Configure logging
logger = logging.getLogger(__name__)


class SEOSearchService:
    """
    Service layer for SEO search operations.

    Purpose: SUPPLY SIDE - Get high-quality search results

    Responsibilities:
    - Orchestrate SEO data retrieval
    - Support multiple query types (keyword, site, competitor)
    - Provide structured output for analysis
    - Filter out discussion-heavy sites (Reddit, forums, Q&A)
    - Prioritize blog posts, documentation, news, tutorials
    """

    def __init__(self):
        """Initialize SEO search service."""
        # Create adapter with ExaProvider via dependency injection
        self.adapter = create_seo_adapter(exa_provider)

    async def search_by_keyword(
        self,
        keyword: str,
        site_url: Optional[str] = None,
        limit: int = 20
    ) -> SearchResult:
        """
        Search web content by keyword.

        Args:
            keyword: Search keyword
            site_url: Optional site domain to filter (e.g., "example.com")
            limit: Maximum results

        Returns:
            SearchResult with list of mentions from keyword search
        """
        query_info = {
            "keyword": keyword,
            "site_url": site_url,
            "limit": limit
        }

        logger.info(f"[SEO_SEARCH] Starting search: {query_info}")
        print(f"[SEO_SEARCH] Starting search: {query_info}")

        # Build query - if site_url provided, use site: operator
        if site_url:
            query = f"site:{site_url} {keyword}"
        else:
            query = keyword

        logger.info(f"[SEO_SEARCH] Query built: '{query}'")
        print(f"[SEO_SEARCH] Query built: '{query}'")

        mentions = await self.adapter.search_mentions(query, limit)

        logger.info(f"[SEO_SEARCH] Adapter returned {len(mentions)} mentions for query: '{query}'")
        print(f"[SEO_SEARCH] Adapter returned {len(mentions)} mentions for query: '{query}'")

        # Print sample mentions for debugging
        if mentions:
            sample_size = min(3, len(mentions))
            logger.info(f"[SEO_SEARCH] Sample mentions (first {sample_size}):")
            print(f"[SEO_SEARCH] Sample mentions (first {sample_size}):")
            for i in range(sample_size):
                mention = mentions[i]
                mention_info = {
                    "id": getattr(mention, 'id', ''),
                    "text": getattr(mention, 'text', '')[:100],
                    "url": getattr(mention, 'url', ''),
                    "author": getattr(mention, 'author', '')
                }
                logger.info(f"[SEO_SEARCH]   Mention {i+1}: {mention_info}")
                print(f"[SEO_SEARCH]   Mention {i+1}: {mention_info}")

        return SearchResult(mentions=mentions, total_count=len(mentions), has_more=False)

    async def search_by_keywords_and_sites(
        self,
        keywords: List[str],
        site_urls: Optional[List[str]] = None,
        limit: int = 20
    ) -> SearchResult:
        """
        Search multiple keywords across multiple sites.

        Args:
            keywords: List of keywords to search
            site_urls: Optional list of site domains to filter
            limit: Maximum results per keyword

        Returns:
            SearchResult with aggregated mentions from all searches
        """
        all_mentions = []

        for keyword in keywords:
            # Search this keyword on all specified sites
            if site_urls:
                for site_url in site_urls:
                    mentions = await self._search_single_keyword_on_site(
                        keyword,
                        site_url,
                        limit
                    )
                    all_mentions.extend(mentions)
            else:
                result = await self.search_by_keyword(keyword, limit)
                all_mentions.extend(result.mentions)

        return SearchResult(
            mentions=all_mentions,
            total_count=len(all_mentions),
            has_more=False
        )

    async def _search_single_keyword_on_site(
        self,
        keyword: str,
        site_url: str,
        limit: int
    ) -> List:
        """
        Search for a single keyword on a specific site.

        Args:
            keyword: Search keyword
            site_url: Site domain to filter
            limit: Maximum results

        Returns:
            List of Mention objects
        """
        query = f"site:{site_url} {keyword}"
        return await self.adapter.search_mentions(query, limit)

    async def search_competitors(
        self,
        keyword: str,
        competitors: List[str],
        limit: int = 20
    ) -> SearchResult:
        """
        Search for content about a keyword and competitor sites.

        Args:
            keyword: Search keyword
            competitors: List of competitor domains
            limit: Maximum results

        Returns:
            SearchResult with aggregated mentions and analysis
        """
        all_mentions = []

        # Search own site
        own_result = await self.search_by_keyword(keyword, limit)
        all_mentions.extend(own_result.mentions)

        # Search each competitor
        for competitor in competitors:
            comp_result = await self.search_by_keyword(competitor, limit)
            all_mentions.extend(comp_result.mentions)

        return SearchResult(
            mentions=all_mentions,
            total_count=len(all_mentions),
            has_more=False
        )

    async def analyze_content_gaps(
        self,
        keyword: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Analyze content gaps for a keyword across sites.

        Returns:
            Dictionary with content gap analysis
        """
        # MVP: Simple implementation
        return {
            "summary": f"内容缺口分析：关键词 '{keyword}'",
            "own_content_count": 0,
            "competitor_content_counts": [],
            "content_gaps": [],
            "suggestions": ["优化关键词策略"]
        }


# Singleton instance for easy import
seo_search_service = SEOSearchService()
