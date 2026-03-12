"""
Exa Provider Module

This module handles web search and content retrieval using Exa API.
It implements the unified BaseProvider interface.
"""

import httpx
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
        """Return the platform identifier."""
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
            SearchResult with list of Mention objects (with minimal metadata)
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

    async def _create_mention_from_result(self, result: Dict[str, Any]) -> Optional[Mention]:
        """
        Create a Mention object from an Exa search result.

        For basic search, we only have URL and title.
        Content extraction would be done separately.
        """
        try:
            url = result.get("url", "")
            title = result.get("title", "")
            snippet = result.get("text", "")

            if not url:
                return None

            # Create basic mention structure
            mention = Mention(
                id=self._generate_id(result),
                platform="exa",
                author="",
                author_username="",
                author_display_name="",
                text=snippet or title,
                url=url,
                timestamp=datetime.utcnow(),
                likes=0,
                comments=0,
                shares=0,
                followers=0,
                sentiment="neutral",
                sentiment_score=0.0,
                influencer_tier="unknown",
                platform_metadata={
                    "exa_result": result,
                    "snippet": snippet
                },
                raw=result
            )

            return mention

        except Exception as e:
            # Log error but don't fail the entire batch
            print(f"Error creating mention from result: {e}")
            return None

    def _generate_id(self, result: Dict[str, Any]) -> str:
        """Generate a unique ID for the mention."""
        url = result.get("url", "")
        return url or str(hash(url))


# Singleton instance for easy import
exa_provider = ExaProvider()
