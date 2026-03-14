"""
Exa Provider Module

This module handles web search and content retrieval using Exa API.
It implements the unified BaseProvider interface.
"""

import httpx
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base import BaseProvider, Mention, SearchResult, ProviderError
from ..config import settings

# Configure logging
logger = logging.getLogger(__name__)


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
        logger.info(f"[EXA_PROVIDER] Search called with query: '{query}', limit: {limit}")
        print(f"[EXA_PROVIDER] Search called with query: '{query}', limit: {limit}")

        if not await self.validate_query(query):
            logger.warning(f"[EXA_PROVIDER] Query validation failed for: '{query}'")
            print(f"[EXA_PROVIDER] Query validation failed for: '{query}'")
            return SearchResult(mentions=[], total_count=0, has_more=False)

        try:
            # Search URLs using Exa
            logger.info(f"[EXA_PROVIDER] Calling Exa API to search URLs...")
            print(f"[EXA_PROVIDER] Calling Exa API to search URLs...")

            search_response = await self._search_urls(query, limit)

            if not search_response:
                logger.error(f"[EXA_PROVIDER] Exa API returned empty response")
                print(f"[EXA_PROVIDER] Exa API returned empty response")
                return SearchResult(mentions=[], total_count=0, has_more=False)

            results = search_response.get("results", [])
            logger.info(f"[EXA_PROVIDER] Exa API returned {len(results)} results")
            print(f"[EXA_PROVIDER] Exa API returned {len(results)} results")

            if not results:
                logger.warning(f"[EXA_PROVIDER] No results found for query: '{query}'")
                print(f"[EXA_PROVIDER] No results found for query: '{query}'")
                return SearchResult(mentions=[], total_count=0, has_more=False)

            # Print raw results for debugging (first 3)
            sample_size = min(3, len(results))
            logger.info(f"[EXA_PROVIDER] Raw results (first {sample_size}):")
            print(f"[EXA_PROVIDER] Raw results (first {sample_size}):")
            for i in range(sample_size):
                result = results[i]
                result_info = {
                    "url": result.get("url", "")[:100],
                    "title": result.get("title", "")[:100],
                    "text": result.get("text", "")[:100]
                }
                logger.info(f"[EXA_PROVIDER]   Result {i+1}: {result_info}")
                print(f"[EXA_PROVIDER]   Result {i+1}: {result_info}")

            # Extract content from discovered URLs
            logger.info(f"[EXA_PROVIDER] Creating mention objects from results...")
            print(f"[EXA_PROVIDER] Creating mention objects from results...")

            mentions = []
            for i, result in enumerate(results[:limit]):
                mention = await self._create_mention_from_result(result)
                if mention:
                    mentions.append(mention)
                    logger.info(f"[EXA_PROVIDER]   Created mention {i+1}: url={mention.url[:80]}, text={mention.text[:80] if mention.text else 'N/A'}")
                else:
                    logger.warning(f"[EXA_PROVIDER]   Failed to create mention from result {i+1}")

            logger.info(f"[EXA_PROVIDER] Created {len(mentions)} mentions from {len(results)} results")
            print(f"[EXA_PROVIDER] Created {len(mentions)} mentions from {len(results)} results")

            return SearchResult(
                mentions=mentions,
                total_count=len(mentions),
                has_more=len(mentions) < limit
            )

        except httpx.TimeoutException:
            logger.error(f"[EXA_PROVIDER] Exa API request timed out after {self.DEFAULT_TIMEOUT}s")
            print(f"[EXA_PROVIDER] Exa API request timed out after {self.DEFAULT_TIMEOUT}s")
            raise ProviderError(f"Exa API request timed out after {self.DEFAULT_TIMEOUT}s")
        except httpx.RequestError as e:
            logger.error(f"[EXA_PROVIDER] Network error connecting to Exa API: {str(e)}")
            print(f"[EXA_PROVIDER] Network error connecting to Exa API: {str(e)}")
            raise ProviderError(f"Network error connecting to Exa API: {str(e)}")
        except Exception as e:
            logger.error(f"[EXA_PROVIDER] Unexpected error with Exa API: {str(e)}")
            print(f"[EXA_PROVIDER] Unexpected error with Exa API: {str(e)}")
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

            logger.debug(f"[EXA_PROVIDER] _create_mention_from_result: url={url[:80]}, title={title[:80] if title else 'N/A'}")
            print(f"[EXA_PROVIDER] _create_mention_from_result: url={url[:80]}, title={title[:80] if title else 'N/A'}")

            if not url:
                logger.warning("[EXA_PROVIDER] No URL found in result, skipping")
                print("[EXA_PROVIDER] No URL found in result, skipping")
                return None

            # Detect platform
            platform = self._detect_platform_from_url(url)
            logger.debug(f"[EXA_PROVIDER] Detected platform: {platform}")
            print(f"[EXA_PROVIDER] Detected platform: {platform}")

            # Extract author info based on platform
            author_info = {"author": "", "author_username": "", "author_display_name": ""}

            # Use Exa API's author field if available
            if result.get("author"):
                author_name = result.get("author", "")
                author_info["author"] = author_name
                author_info["author_username"] = author_name
                author_info["author_display_name"] = author_name

            # For Reddit, also try to extract from URL as fallback
            if platform == "reddit" and not author_info["author"]:
                author_info = self._extract_reddit_author(url, title)
            elif platform == "x" or platform == "twitter":
                # Try to extract from title for Twitter/X
                if title and not author_info["author"]:
                    twitter_match = re.search(r'@\w+', title)
                    if twitter_match:
                        username = twitter_match.group(0).lstrip('@')
                        author_info["author_username"] = username
                        author_info["author"] = username
                        author_info["author_display_name"] = username

            # Use the title as the text if snippet is empty
            # Use text field (contains full content including Score) or snippet as fallback
            text = result.get("text", snippet)

            if not text:
                logger.warning(f"[EXA_PROVIDER] No text or title found for URL: {url}")
                print(f"[EXA_PROVIDER] No text or title found for URL: {url}")

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
                    logger.debug(f"[EXA_PROVIDER] Extracted subreddit: {subreddit_match.group(1)}")
                    print(f"[EXA_PROVIDER] Extracted subreddit: {subreddit_match.group(1)}")

            # Get timestamp from result (Exa API uses publishedDate for all platforms)
            timestamp = None
            if result.get("publishedDate"):
                try:
                    timestamp = datetime.fromisoformat(result["publishedDate"].replace("Z", "+00:00"))
                except:
                    pass
            if not timestamp:
                timestamp = datetime.utcnow()

            # Parse engagement metrics from text content for Reddit posts
            # Exa API embeds Reddit score in text format: "Score: XXX"
            likes = 0
            comments = 0
            if platform == "reddit" and text:
                # Parse score from text (e.g., "Score: 352")
                score_match = re.search(r'Score:\s*(-?\d+)', text, re.IGNORECASE)
                if score_match:
                    likes = int(score_match.group(1))

                # Parse comment count from text (e.g., "215 Comments")
                comments_match = re.search(r'(\d+)\s+Comments?', text, re.IGNORECASE)
                if comments_match:
                    comments = int(comments_match.group(1))

            shares = result.get("quote_count", 0) if platform == "x" else 0
            followers = result.get("follower_count", 0)

            # Get sentiment from result
            sentiment = result.get("sentiment", "neutral")

            # Create mention structure
            mention = Mention(
                id=self._generate_id(result),
                platform=platform,
                author=author_info["author"],
                author_username=author_info["author_username"],
                author_display_name=author_info["author_display_name"],
                text=text,
                url=url,
                timestamp=timestamp,
                likes=likes,
                comments=comments,
                shares=shares,
                followers=followers,
                sentiment=sentiment,
                sentiment_score=0.0,
                influencer_tier="unknown",
                platform_metadata=metadata,
                raw=result
            )

            logger.debug(f"[EXA_PROVIDER] Created mention object: id={mention.id}, platform={mention.platform}, text_length={len(mention.text) if mention.text else 0}")
            print(f"[EXA_PROVIDER] Created mention object: id={mention.id}, platform={mention.platform}, text_length={len(mention.text) if mention.text else 0}")

            return mention

        except Exception as e:
            # Log error but don't fail the entire batch
            logger.error(f"[EXA_PROVIDER] Error creating mention from result: {e}")
            print(f"[EXA_PROVIDER] Error creating mention from result: {e}")
            return None

    def _generate_id(self, result: Dict[str, Any]) -> str:
        """Generate a unique ID for mention."""
        url = result.get("url", "")
        return url or str(hash(url))


# Singleton instance for easy import
exa_provider = ExaProvider()
