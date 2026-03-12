"""
Reddit Adapter Module

This module converts Reddit data to unified Mention format.
It does NOT inherit from BaseProvider - it's a pure adapter that receives a provider via dependency injection.

Architecture:
- Provider Layer: Data fetching (ExaProvider)
- Adapter Layer: Data normalization with source filtering
- Services Layer: Business logic coordination
"""

from typing import List, Optional
from datetime import datetime, timedelta
from ..providers.base import Mention
from ..config import settings


class RedditAdapter:
    """
    Adapter for Reddit platform.

    Responsibilities:
    - Normalize Reddit data to unified Mention format
    - Receive provider via dependency injection (not inheritance)
    - Filter results to only include reddit.com sources
    """

    def __init__(self, provider):
        """Initialize Reddit adapter with injected provider."""
        self.provider = provider

    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> List[Mention]:
        """
        Search for mentions using provider and normalize to Mention format.
        Only returns results from reddit.com sources.

        Args:
            query: Search query string
            limit: Maximum number of results to return

        Returns:
            List of Mention objects (filtered to reddit.com only)
        """
        # Use provider to search raw data
        search_result = await self.provider.search_mentions(query, limit)

        # Filter results: only include mentions from reddit.com or with reddit.com in URL
        filtered_mentions = []
        for mention in search_result.mentions:
            if self._is_reddit_source(mention):
                filtered_mentions.append(mention)

        return filtered_mentions

    def _is_reddit_source(self, mention: Mention) -> bool:
        """
        Check if a mention is from a valid Reddit source.
        Valid sources include:
        - URLs containing reddit.com
        - URLs with reddit.com domain
        """
        url = mention.url.lower() if mention.url else ""
        return "reddit.com" in url


# Factory function for dependency injection
def create_reddit_adapter(provider) -> RedditAdapter:
    """
    Factory function to create RedditAdapter with provider.
    This decouples the adapter from the provider implementation.
    """
    return RedditAdapter(provider)
