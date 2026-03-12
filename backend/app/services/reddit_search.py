"""
Reddit Search Service

This module provides high-level search and analysis services for Reddit.
It coordinates between Reddit adapter and business logic.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from ..adapters.reddit_adapter import create_reddit_adapter
from ..providers.exa_provider import exa_provider
from ..providers.base import SearchResult, Mention


class RedditSearchService:
    """
    Service layer for Reddit search operations.

    Responsibilities:
    - Orchestrate Reddit data retrieval
    - Combine results from multiple subreddits
    - Provide structured error handling
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
        all_mentions = []

        for keyword in keywords:
            mentions = await self._search_single_keyword(
                keyword,
                subreddits=subreddits,
                limit=limit
            )
            all_mentions.extend(mentions)

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

        return await self.adapter.search_mentions(query, limit)


# Singleton instance for easy import
reddit_search_service = RedditSearchService()
