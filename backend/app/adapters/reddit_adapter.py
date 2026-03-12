"""
Reddit Adapter Module

This module converts Reddit data to unified Mention format.
It does NOT inherit from BaseProvider - it's a pure adapter that receives a provider via dependency injection.

Architecture:
- Provider Layer: Data fetching (ExaProvider)
- Adapter Layer: Data normalization with source filtering and Reddit-specific enhancement
- Services Layer: Business logic coordination
"""

from typing import List, Optional
from datetime import datetime
from ..providers.base import Mention
from ..config import settings
import re


class RedditAdapter:
    """
    Adapter for Reddit platform.

    Responsibilities:
    - Normalize Reddit data to unified Mention format
    - Receive provider via dependency injection (not inheritance)
    - Filter results to only include reddit.com sources
    - Enhance Reddit mentions with platform-specific metadata
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

        # Filter results: only include mentions from reddit.com
        filtered_mentions = []
        for mention in search_result.mentions:
            if self._is_reddit_source(mention):
                # Enhance with Reddit-specific metadata
                enhanced_mention = self._enhance_reddit_mention(mention)
                filtered_mentions.append(enhanced_mention)

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

    def _enhance_reddit_mention(self, mention: Mention) -> Mention:
        """
        Enhance a Reddit mention with platform-specific metadata.
        Extracts additional information from the URL and text.
        """
        # Create a copy to modify
        metadata = dict(mention.platform_metadata) if mention.platform_metadata else {}

        # Extract subreddit from URL
        url = mention.url or ""
        subreddit_match = re.search(r'/r/([^/]+)', url)
        if subreddit_match:
            metadata["subreddit"] = subreddit_match.group(1)

        # Try to extract author from text (Reddit posts often have "u/username" or similar)
        text = mention.text or ""

        # Pattern 1: "by u/username" or "posted by u/username"
        author_match = re.search(r'(?:by|posted by|from)\s*u/(\w+)', text, re.IGNORECASE)
        if author_match and not mention.author_username:
            username = author_match.group(1)
            # Create enhanced mention with author info (Pydantic model_copy)
            mention = mention.model_copy(
                update={
                    "author": username,
                    "author_username": username,
                    "author_display_name": username
                }
            )

        # Pattern 2: @username format
        at_mention_match = re.search(r'@(\w{3,})', text)
        if at_mention_match and not mention.author_username:
            username = at_mention_match.group(1)
            mention = mention.model_copy(
                update={
                    "author": username,
                    "author_username": username,
                    "author_display_name": username
                }
            )

        # Update metadata
        mention.platform_metadata = metadata

        return mention


# Factory function for dependency injection
def create_reddit_adapter(provider) -> RedditAdapter:
    """
    Factory function to create RedditAdapter with provider.
    This decouples the adapter from the provider implementation.
    """
    return RedditAdapter(provider)
