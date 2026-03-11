"""
X Provider Module

This module handles fetching real tweets from X (Twitter) API.
It is a data provider layer only - no sentiment analysis or content processing.

Responsibilities:
- Fetch recent tweets based on search queries
- Handle X API authentication via Bearer token
- Provide structured error handling for API failures
"""

import httpx
from typing import Dict, Optional
from ..config import settings


class XAPIError(Exception):
    """Custom exception for X API errors."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class XProvider:
    """
    Provider for X (Twitter) API v2 - Recent Search Endpoint.
    Fetches real tweet data without any analysis.
    """

    # X API v2 endpoint for recent tweet search
    API_URL = "https://api.x.com/2/tweets/search/recent"
    DEFAULT_TIMEOUT = 30.0

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
                    "tweet.fields": "created_at,public_metrics"
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


# Singleton instance for easy import
x_provider = XProvider()
