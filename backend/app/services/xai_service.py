import httpx
from typing import Dict, List, Optional
from datetime import datetime
from ..config import settings


class XAIService:
    """Service for interacting with X AI API"""

    def __init__(self):
        self.api_key = settings.XAI_API_KEY
        self.api_url = settings.XAI_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def analyze_keyword(self, keyword: str, analysis_type: str = "trending") -> Dict:
        """
        Analyze keyword on X platform

        Args:
            keyword: The keyword to analyze
            analysis_type: Type of analysis (trending, sentiment, both)

        Returns:
            Dictionary containing analysis results
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Prepare the prompt based on analysis type
                if analysis_type == "trending":
                    prompt = f"""Analyze trending topics and discussions about "{keyword}" on X (Twitter) platform.
                    Provide:
                    1. Top 5 trending topics related to "{keyword}"
                    2. Popular hashtags
                    3. Key influencers discussing this topic
                    4. Recent engagement trends
                    Format the response as structured JSON."""

                elif analysis_type == "sentiment":
                    prompt = f"""Analyze the sentiment and public opinion about "{keyword}" on X (Twitter) platform.
                    Provide:
                    1. Overall sentiment (positive, negative, neutral) with percentage
                    2. Key themes and topics in discussions
                    3. Common concerns or praise points
                    4. Notable mentions and quotes
                    Format the response as structured JSON."""

                else:  # both
                    prompt = f"""Provide a comprehensive analysis of "{keyword}" on X (Twitter) platform.
                    Include:
                    1. TRENDING ANALYSIS:
                       - Top trending topics
                       - Popular hashtags
                       - Key influencers
                       - Engagement trends

                    2. SENTIMENT ANALYSIS:
                       - Overall sentiment breakdown
                       - Key discussion themes
                       - Common concerns and praise
                       - Notable mentions

                    3. ACTIONABLE INSIGHTS:
                       - Marketing opportunities
                       - Risk factors
                       - Recommended actions

                    Format the response as structured JSON."""

                # Make API call to X AI
                response = await client.post(
                    f"{self.api_url}/analyze",
                    headers=self.headers,
                    json={
                        "keyword": keyword,
                        "analysis_type": analysis_type,
                        "prompt": prompt
                    }
                )

                if response.status_code != 200:
                    raise Exception(f"X AI API returned status {response.status_code}: {response.text}")

                result = response.json()

                return {
                    "keyword": keyword,
                    "analysis_type": analysis_type,
                    "data": result,
                    "timestamp": datetime.utcnow().isoformat()
                }

        except httpx.TimeoutException:
            raise Exception("Request to X AI API timed out")
        except httpx.RequestError as e:
            raise Exception(f"Error connecting to X AI API: {str(e)}")
        except Exception as e:
            raise Exception(f"Error analyzing keyword: {str(e)}")

    async def get_trending_topics(self, keyword: Optional[str] = None) -> List[Dict]:
        """
        Get trending topics, optionally filtered by keyword

        Args:
            keyword: Optional keyword to filter trending topics

        Returns:
            List of trending topics
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {}
                if keyword:
                    params["keyword"] = keyword

                response = await client.get(
                    f"{self.api_url}/trending",
                    headers=self.headers,
                    params=params
                )

                if response.status_code != 200:
                    raise Exception(f"X AI API returned status {response.status_code}")

                return response.json()

        except Exception as e:
            raise Exception(f"Error fetching trending topics: {str(e)}")


# Singleton instance
xai_service = XAIService()
