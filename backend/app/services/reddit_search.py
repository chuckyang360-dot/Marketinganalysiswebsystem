"""
Reddit Search Service

This module provides high-level search and analysis services for Reddit.
It coordinates between Reddit adapter and business logic.

Purpose: DEMAND SIDE
This agent retrieves REAL USER DISCUSSIONS from Reddit to analyze:
- User needs and pain points
- User sentiment and opinions
- Controversies and debates
- Authentic user expressions
- Product/service feedback from real users
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from ..adapters.reddit_adapter import create_reddit_adapter
from ..providers.exa_provider import exa_provider
from ..providers.base import SearchResult, Mention

# Configure logging
logger = logging.getLogger(__name__)


class RedditSearchService:
    """
    Service layer for Reddit search operations.

    Purpose: DEMAND SIDE - Get real user discussions from Reddit

    Responsibilities:
    - Orchestrate Reddit data retrieval
    - Combine results from multiple subreddits
    - Provide structured error handling
    - Ensure only Reddit discussions are returned
    """

    def __init__(self):
        """Initialize Reddit search service with injected adapter."""
        # Create adapter with ExaProvider via dependency injection
        self.adapter = create_reddit_adapter(exa_provider)

    async def search_by_keywords(
        self,
        keywords: List[str],
        subreddits: Optional[List[str]] = None,
        limit: int = 20
    ) -> List:
        """
        Search Reddit by keywords across specified subreddits.

        Args:
            keywords: List of keywords to search
            subreddits: Optional list of subreddit names to search
            limit: Maximum number of results per keyword

        Returns:
            List of Mention objects
        """
        query_info = {
            "keywords": keywords,
            "subreddits": subreddits,
            "limit": limit
        }

        logger.info(f"[REDDIT_SEARCH] Starting search: {query_info}")
        print(f"[REDDIT_SEARCH] Starting search: {query_info}")

        all_mentions = []

        for i, keyword in enumerate(keywords, 1):
            logger.info(f"[REDDIT_SEARCH] Searching keyword {i}/{len(keywords)}: '{keyword}'")
            print(f"[REDDIT_SEARCH] Searching keyword {i}/{len(keywords)}: '{keyword}'")

            mentions = await self._search_single_keyword(
                keyword,
                subreddits=subreddits,
                limit=limit
            )

            logger.info(f"[REDDIT_SEARCH] Keyword '{keyword}' returned {len(mentions)} mentions")
            print(f"[REDDIT_SEARCH] Keyword '{keyword}' returned {len(mentions)} mentions")

            all_mentions.extend(mentions)

        logger.info(f"[REDDIT_SEARCH] Search complete. Total mentions across all keywords: {len(all_mentions)}")
        print(f"[REDDIT_SEARCH] Search complete. Total mentions across all keywords: {len(all_mentions)}")

        # Print sample mentions for debugging
        if all_mentions:
            sample_size = min(3, len(all_mentions))
            logger.info(f"[REDDIT_SEARCH] Sample mentions (first {sample_size}):")
            print(f"[REDDIT_SEARCH] Sample mentions (first {sample_size}):")
            for i in range(sample_size):
                mention = all_mentions[i]
                mention_info = {
                    "id": getattr(mention, 'id', ''),
                    "text": getattr(mention, 'text', '')[:100],
                    "url": getattr(mention, 'url', ''),
                    "author": getattr(mention, 'author', '')
                }
                logger.info(f"[REDDIT_SEARCH]   Mention {i+1}: {mention_info}")
                print(f"[REDDIT_SEARCH]   Mention {i+1}: {mention_info}")

        return all_mentions

    async def _search_single_keyword(
        self,
        keyword: str,
        subreddits: Optional[List[str]],
        limit: int
    ) -> List:
        """
        Search for a single keyword.

        Args:
            keyword: Search keyword
            subreddits: Optional list of subreddits (if None, search all)
            limit: Maximum results

        Returns:
            List of Mention objects
        """
        # Build query with reddit.com site restriction and optional subreddit filter
        if subreddits:
            subreddit_query = " OR ".join([f"subreddit:{sr}" for sr in subreddits])
            # Reddit 搜索必须强制包含 site:reddit.com
            query = f"site:reddit.com {keyword} {subreddit_query}"
        else:
            # 即使没有指定 subreddits，也强制 site:reddit.com
            query = f"site:reddit.com {keyword}"

        logger.info(f"[REDDIT_SEARCH] Query built: '{query}'")
        print(f"[REDDIT_SEARCH] Query built: '{query}'")

        mentions = await self.adapter.search_mentions(query, limit)

        logger.info(f"[REDDIT_SEARCH] Adapter returned {len(mentions)} mentions for query: '{query}'")
        print(f"[REDDIT_SEARCH] Adapter returned {len(mentions)} mentions for query: '{query}'")

        return mentions


# Singleton instance for easy import
reddit_search_service = RedditSearchService()
