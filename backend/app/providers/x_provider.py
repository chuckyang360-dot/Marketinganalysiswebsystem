"""
X Provider Module

This module handles fetching real tweets from X (Twitter) API.
It is a data provider layer only - no sentiment analysis or content processing.

Responsibilities:
- Fetch recent tweets based on search queries
- Handle X API authentication via Bearer token
- Provide structured error handling for API failures
- Convert X API responses to unified Mention objects
"""

import httpx
from typing import Dict, Optional, List
from datetime import datetime
from .base import BaseProvider, ProviderError
from ..models import Mention, Platform
from ..config import settings


class XAPIError(Exception):
    """Custom exception for X API errors."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class XProvider(BaseProvider):
    """
    Provider for X (Twitter) API v2 - Recent Search Endpoint.
    Fetches real tweet data and converts to unified Mention objects.
    """

    # X API v2 endpoint for recent tweet search
    API_URL = "https://api.x.com/2/tweets/search/recent"
    DEFAULT_TIMEOUT = 30.0
    PLATFORM = Platform.X

    def get_platform_name(self) -> str:
        """Return the platform identifier."""
        return self.PLATFORM.value

    def __init__(self):
        """Initialize X provider with Bearer token from environment."""
        if not settings.X_BEARER_TOKEN:
            raise ValueError(
                "X_BEARER_TOKEN environment variable is required. "
                "Please set it in your .env file."
            )

        self.bearer_token = settings.X_BEARER_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.bearer_token}"
        }

    async def fetch_recent_tweets(
        self,
        query: str,
        max_results: int = 10
    ) -> Dict:
        """
        Fetch recent tweets from X API matching the search query.

        Args:
            query: Search query string (supports X search syntax)
            max_results: Number of tweets to return (default: 10, max: 100)

        Returns:
            Dictionary with parsed JSON response from X API.

        Raises:
            XAPIError: If API request fails or returns non-200 status.
        """
        if not query or not query.strip():
            raise ValueError("Query parameter cannot be empty")

        if max_results < 1 or max_results > 100:
            raise ValueError("max_results must be between 1 and 100")

        try:
            async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT) as client:
                params = {
                    "query": f"{query} -is:retweet lang:en",
                    "max_results": max_results,
                    "tweet.fields": "created_at,public_metrics,author_id,conversation_id,in_reply_to_user_id",
                    "expansions": "author_id",
                    "user.fields": "username,name,public_metrics"
                }

                response = await client.get(
                    self.API_URL,
                    headers=self.headers,
                    params=params
                )

                if response.status_code != 200:
                    # Include full X API error response for debugging
                    error_detail = response.text if response.text else "No details available"
                    raise XAPIError(
                        f"X API returned status {response.status_code}: {error_detail}",
                        status_code=response.status_code
                    )

                # Safely parse and return JSON
                try:
                    return response.json()
                except Exception as json_error:
                    raise XAPIError(f"Failed to parse JSON response: {str(json_error)}")

        except httpx.TimeoutException:
            raise XAPIError(f"Request to X API timed out after {self.DEFAULT_TIMEOUT}s")

        except httpx.RequestError as e:
            raise XAPIError(f"Network error connecting to X API: {str(e)}")

        except XAPIError:
            # Re-raise our custom errors
            raise

        except Exception as e:
            raise XAPIError(f"Unexpected error fetching tweets: {str(e)}")

    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> List[Mention]:
        """
        Search for mentions on X (Twitter).

        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 20, max: 100)

        Returns:
            List of Mention objects

        Raises:
            ProviderError: If the search fails
        """
        # Validate query
        if not await self.validate_query(query):
            raise ProviderError("Invalid query")

        # Validate limit (X API requires minimum 10, maximum 100)
        if limit < 10 or limit > 100:
            raise ProviderError("limit must be between 10 and 100")

        try:
            # Fetch raw tweets from X API
            response = await self.fetch_recent_tweets(query, max_results=limit)

            # Convert to Mention objects
            tweets_data = response.get('data', [])
            includes = response.get('includes', {})
            users_map = {u['id']: u for u in includes.get('users', [])}

            mentions = []
            for tweet in tweets_data:
                mention = self._to_mention(tweet, users_map)
                if mention:
                    mentions.append(mention)

            return mentions

        except XAPIError as e:
            raise ProviderError(f"X API error: {e.message}")
        except Exception as e:
            raise ProviderError(f"Error searching X mentions: {str(e)}")

    def _to_mention(
        self,
        tweet: Dict,
        users_map: Dict[str, Dict]
    ) -> Optional[Mention]:
        """
        Convert X API tweet response to unified Mention object.

        Args:
            tweet: Raw tweet data from X API
            users_map: Dictionary mapping user IDs to user data

        Returns:
            Mention object or None if conversion fails
        """
        try:
            tweet_id = tweet.get('id', '')
            text = tweet.get('text', '')

            # Get author information
            author_id = tweet.get('author_id', '')
            user_data = users_map.get(author_id, {})

            author_username = user_data.get('username', '')
            author_display_name = user_data.get('name', '')
            followers = user_data.get('public_metrics', {}).get('followers_count', 0)

            # Get public metrics
            metrics = tweet.get('public_metrics', {})
            likes = metrics.get('like_count', 0)
            retweets = metrics.get('retweet_count', 0)
            replies = metrics.get('reply_count', 0)
            quotes = metrics.get('quote_count', 0)

            # Parse timestamp
            created_at_str = tweet.get('created_at', '')
            try:
                timestamp = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                timestamp = datetime.utcnow()

            # Construct URL
            url = f"https://x.com/{author_username}/status/{tweet_id}" if author_username else ""

            # Create Mention object
            mention = Mention(
                id=tweet_id,
                platform=self.PLATFORM,
                author=author_display_name,
                author_username=author_username,
                author_display_name=author_display_name,
                text=text,
                url=url,
                timestamp=timestamp,
                likes=likes,
                comments=replies,
                shares=retweets,  # X uses "retweets" as shares
                followers=followers,
                # Sentiment fields will be populated by analysis services
                sentiment="neutral",
                sentiment_score=0.0,
                influencer_tier="unknown",
                # Store platform-specific metadata
                platform_metadata={
                    "quote_count": quotes,
                    "conversation_id": tweet.get("conversation_id", ""),
                    "in_reply_to_user_id": tweet.get("in_reply_to_user_id", ""),
                },
                # Store raw data for reference
                raw=tweet
            )

            return mention

        except Exception as e:
            # Log but don't fail entire batch for one bad tweet
            print(f"Error converting tweet to Mention: {e}")
            return None


# Singleton instance for easy import
x_provider = XProvider()
