"""
X AI Search Service - Real X/Twitter search using xAI API
"""

import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime
from ..config import settings
import logging

logger = logging.getLogger(__name__)


class XAISearchService:
    """Service for searching X/Twitter using xAI API"""

    def __init__(self):
        self.api_key = settings.XAI_API_KEY
        self.base_url = "https://api.x.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "VibeMarketing/1.0"
        }

    async def search_x(
        self,
        keyword: str,
        count: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search for tweets about a keyword on X/Twitter

        Args:
            keyword: The search keyword
            count: Number of results to return

        Returns:
            List of tweet objects with text, author, metrics, etc.
        """
        if not self.api_key:
            logger.warning("XAI_API_KEY not configured, returning empty results")
            return []

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Using xAI's search endpoint
                search_url = f"{self.base_url}/search"

                # Prepare search request
                payload = {
                    "query": keyword,
                    "count": min(count, 100),
                    "search_type": "latest"
                }

                logger.info(f"Calling xAI search for keyword: {keyword}")

                response = await client.post(
                    search_url,
                    headers=self.headers,
                    json=payload
                )

                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"xAI API error: {response.status_code} - {error_text}")
                    # Try to parse error response
                    try:
                        error_data = response.json()
                        logger.error(f"xAI error details: {error_data}")
                    except:
                        pass
                    raise Exception(f"xAI API returned {response.status_code}: {error_text}")

                result = response.json()
                logger.info(f"xAI search returned {len(result.get('tweets', []))} tweets")

                # Normalize response to match expected format
                tweets = []
                for tweet in result.get('tweets', []):
                    tweets.append({
                        'id': tweet.get('id', ''),
                        'text': tweet.get('text', ''),
                        'author': tweet.get('author', {}).get('username', 'unknown'),
                        'author_display': tweet.get('author', {}).get('display_name', ''),
                        'created_at': tweet.get('created_at', datetime.utcnow().isoformat()),
                        'public_metrics': tweet.get('public_metrics', {}),
                        'media': tweet.get('media', []),
                        'urls': tweet.get('urls', []),
                        'hashtags': [tag.get('tag', '') for tag in tweet.get('entities', {}).get('hashtags', [])],
                        'mentions': [mention.get('username', '') for mention in tweet.get('entities', {}).get('mentions', [])]
                    })

                return tweets

        except httpx.TimeoutException:
            logger.error("xAI API request timed out")
            raise Exception("xAI API request timed out")
        except httpx.RequestError as e:
            logger.error(f"xAI API connection error: {str(e)}")
            raise Exception(f"Failed to connect to xAI API: {str(e)}")
        except Exception as e:
            logger.error(f"xAI search error: {str(e)}")
            raise Exception(f"Error searching X: {str(e)}")

    async def analyze_sentiment_batch(
        self,
        texts: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Analyze sentiment for a batch of texts

        Args:
            texts: List of text to analyze

        Returns:
            List of sentiment results with label and score
        """
        if not self.api_key:
            logger.warning("XAI_API_KEY not configured for sentiment analysis")
            # Return neutral sentiment for all texts
            return [{'label': 'neutral', 'score': 0.0} for _ in texts]

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                sentiment_url = f"{self.base_url}/sentiment"

                payload = {
                    "texts": texts[:50]  # Limit batch size
                }

                logger.info(f"Calling xAI sentiment analysis for {len(texts)} texts")

                response = await client.post(
                    sentiment_url,
                    headers=self.headers,
                    json=payload
                )

                if response.status_code != 200:
                    logger.error(f"xAI sentiment API error: {response.status_code}")
                    # Return neutral sentiment as fallback
                    return [{'label': 'neutral', 'score': 0.0} for _ in texts]

                result = response.json()
                logger.info(f"xAI sentiment analysis completed")

                # Normalize sentiment results
                sentiments = []
                for item in result.get('sentiments', []):
                    score = item.get('score', 0.0)
                    label = 'neutral'
                    if score > 0.3:
                        label = 'positive'
                    elif score < -0.3:
                        label = 'negative'

                    sentiments.append({
                        'label': label,
                        'score': score,
                        'confidence': item.get('confidence', 0.5)
                    })

                # Pad results if fewer returned than requested
                while len(sentiments) < len(texts):
                    sentiments.append({'label': 'neutral', 'score': 0.0, 'confidence': 0.5})

                return sentiments

        except Exception as e:
            logger.error(f"xAI sentiment analysis error: {str(e)}")
            # Return neutral sentiment as fallback
            return [{'label': 'neutral', 'score': 0.0} for _ in texts]


# Singleton instance
xai_search_service = XAISearchService()
