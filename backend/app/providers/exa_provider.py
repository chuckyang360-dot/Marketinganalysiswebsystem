"""
Exa Provider Module

This module handles web search and content retrieval using Exa API.
It implements the unified BaseProvider interface.
"""

import httpx
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base import BaseProvider, Mention, SearchResult, ProviderError
from ..config import settings


class ExaProvider(BaseProvider):
    """
    Provider for Exa (Exa.ai) - Neural Search Engine.

    Responsibilities:
    - Search web content using Exa API
    - Extract full content from discovered URLs
    - Provide structured error handling
    - Extract author information from Reddit URLs
    """

    API_URL = "https://api.exa.ai/search"
    DEFAULT_TIMEOUT = 60.0
    CONTENT_TIMEOUT = 90.0

    def __init__(self):
        """Initialize Exa provider with API key from environment."""
        if not settings.EXA_API_KEY:
            raise ValueError(
                "EXA_API_KEY environment variable is required. "
                "Please set it in your .env file."
            )

        self.api_key = settings.EXA_API_KEY
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }

    def get_platform_name(self) -> str:
        """Return platform identifier."""
        return "exa"

    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> SearchResult:
        """
        Search for mentions using Exa API.

        Args:
            query: Search query string
            limit: Maximum number of results to return

        Returns:
            SearchResult with list of Mention objects (with metadata)
        """
        if not await self.validate_query(query):
            return SearchResult(mentions=[], total_count=0, has_more=False)

        try:
            # Search URLs using Exa
            search_response = await self._search_urls(query, limit)

            if not search_response or not search_response.get("results"):
                return SearchResult(mentions=[], total_count=0, has_more=False)

            # Extract content from discovered URLs
            mentions = []
            for result in search_response["results"][:limit]:
                mention = await self._create_mention_from_result(result)
                if mention:
                    mentions.append(mention)

            return SearchResult(
                mentions=mentions,
                total_count=len(mentions),
                has_more=len(mentions) < limit
            )

        except httpx.TimeoutException:
            raise ProviderError(f"Exa API request timed out after {self.DEFAULT_TIMEOUT}s")
        except httpx.RequestError as e:
            raise ProviderError(f"Network error connecting to Exa API: {str(e)}")
        except Exception as e:
            raise ProviderError(f"Unexpected error with Exa API: {str(e)}")

    async def _search_urls(self, query: str, limit: int) -> Dict[str, Any]:
        """Search for URLs using Exa API."""
        params = {
            "query": query,
            "numResults": limit,
            "useAutopromptString": True,
            "contents": {
                "text": True,
                "livecrawl": "never"  # Options: "never" | "always" | "fallback" | "auto" | "preferred"
            }
        }

        async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT) as client:
            response = await client.post(
                self.API_URL,
                headers=self.headers,
                json=params
            )

            if response.status_code != 200:
                error_detail = response.text if response.text else "No details available"
                raise ProviderError(f"Exa API returned status {response.status_code}: {error_detail}")

            return response.json()

    def _extract_reddit_author(self, url: str, title: str = "") -> Dict[str, str]:
        """
        Extract author information from Reddit URL.

        Reddit URLs follow patterns like:
        - https://www.reddit.com/r/subreddit/comments/abc123/post_title/
        - https://reddit.com/r/subreddit/comments/abc123/post_title/
        - https://old.reddit.com/r/subreddit/comments/abc123/post_title/

        However, the author name is not in the URL - it's in the page content.
        This method attempts to extract author from title or uses a placeholder.
        """
        author_info = {
            "author": "",
            "author_username": "",
            "author_display_name": ""
        }

        # Try to extract from title if it contains author info (Reddit sometimes includes "by u/username" in titles)
        if title:
            # Pattern: "by u/username" or "submitted by u/username"
            author_match = re.search(r'(?:by|submitted by)\s*(?:u/)?(\w+)', title, re.IGNORECASE)
            if author_match:
                username = author_match.group(1)
                author_info["author_username"] = username
                author_info["author"] = username
                author_info["author_display_name"] = username

        return author_info

    def _detect_platform_from_url(self, url: str) -> str:
        """Detect platform from URL."""
        url_lower = url.lower()

        if "reddit.com" in url_lower:
            return "reddit"
        elif "twitter.com" in url_lower or "x.com" in url_lower:
            return "x"
        elif "linkedin.com" in url_lower:
            return "linkedin"
        elif "instagram.com" in url_lower:
            return "instagram"
        elif "tiktok.com" in url_lower:
            return "tiktok"
        elif "youtube.com" in url_lower:
            return "youtube"
        elif "facebook.com" in url_lower:
            return "facebook"
        else:
            return "web"

    async def _create_mention_from_result(self, result: Dict[str, Any]) -> Optional[Mention]:
        """
        Create a Mention object from an Exa search result.
        Extracts as much metadata as possible from available data.
        """
        try:
            url = result.get("url", "")
            title = result.get("title", "")
            snippet = result.get("text", "")

            if not url:
                return None

            # Detect platform
            platform = self._detect_platform_from_url(url)

            # Extract author info based on platform
            author_info = {"author": "", "author_username": "", "author_display_name": ""}
            if platform == "reddit":
                author_info = self._extract_reddit_author(url, title)
            elif platform == "x" or platform == "twitter":
                # Try to extract from title for Twitter/X
                if title:
                    twitter_match = re.search(r'@\w+', title)
                    if twitter_match:
                        username = twitter_match.group(0).lstrip('@')
                        author_info["author_username"] = username
                        author_info["author"] = username
                        author_info["author_display_name"] = username

            # Use the title as the text if snippet is empty
            text = snippet if snippet else title

            # Parse URL for potential subreddits or other metadata
            metadata = {
                "exa_result": result,
                "snippet": snippet,
                "title": title,
                "detected_platform": platform
            }

            # Extract subreddit from Reddit URL
            if platform == "reddit":
                subreddit_match = re.search(r'/r/([^/]+)', url)
                if subreddit_match:
                    metadata["subreddit"] = subreddit_match.group(1)

            # Create mention structure
            mention = Mention(
                id=self._generate_id(result),
                platform=platform,
                author=author_info["author"],
                author_username=author_info["author_username"],
                author_display_name=author_info["author_display_name"],
                text=text,
                url=url,
                timestamp=datetime.utcnow(),
                likes=0,
                comments=0,
                shares=0,
                followers=0,
                sentiment="neutral",
                sentiment_score=0.0,
                influencer_tier="unknown",
                platform_metadata=metadata,
                raw=result
            )

            return mention

        except Exception as e:
            # Log error but don't fail the entire batch
            print(f"Error creating mention from result: {e}")
            return None

    def _generate_id(self, result: Dict[str, Any]) -> str:
        """Generate a unique ID for mention."""
        url = result.get("url", "")
        return url or str(hash(url))


# Singleton instance for easy import
exa_provider = ExaProvider()
