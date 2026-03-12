"""
Unified Provider Layer - Base Abstract Class

This module defines the unified interface that all platform providers must implement.
Each provider is responsible for fetching raw data from their respective platform.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class Mention(BaseModel):
    """
    Unified mention model for all social media platforms.

    This is the core data model that standardizes data from different platforms.
    """

    # Core identification
    id: str
    platform: str  # "x", "reddit", "instagram", "tiktok", etc.
    author: str = ""
    author_username: str = ""
    author_display_name: str = ""
    text: str
    url: str = ""
    timestamp: Optional[datetime] = None

    # Engagement metrics
    likes: int = 0
    comments: int = 0
    shares: int = 0
    followers: int = 0

    # Analysis fields (populated by analysis services)
    sentiment: str = "neutral"
    sentiment_score: float = 0.0
    influencer_tier: str = "unknown"

    # Platform-specific metadata
    platform_metadata: Dict[str, Any] = {}
    raw: Dict[str, Any] = {}

    @property
    def engagement_total(self) -> int:
        """Total engagement (likes + comments + shares)."""
        return self.likes + self.comments + self.shares

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = {
            "id": self.id,
            "platform": self.platform,
            "author": self.author,
            "author_username": self.author_username,
            "author_display_name": self.author_display_name,
            "text": self.text,
            "url": self.url,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "likes": self.likes,
            "comments": self.comments,
            "shares": self.shares,
            "followers": self.followers,
            "engagement_total": self.engagement_total,
            "sentiment": self.sentiment,
            "sentiment_score": self.sentiment_score,
            "influencer_tier": self.influencer_tier,
            "platform_metadata": self.platform_metadata,
            "raw": self.raw
        }
        return data


class SearchResult(BaseModel):
    """
    Standardized search result container for all providers.
    """
    mentions: List[Mention]
    total_count: int = 0
    has_more: bool = False


class ProviderError(Exception):
    """Base exception for provider errors."""
    pass


class BaseProvider(ABC):
    """
    Abstract base class for all social media data providers.

    All platform providers must inherit from this class and implement:
    - search_mentions(query: str, limit: int = 20) -> List[Mention]
    - get_platform_name() -> str
    """

    @abstractmethod
    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> SearchResult:
        """
        Search for mentions on the platform.

        Args:
            query: Search query string
            limit: Maximum number of results to return

        Returns:
            SearchResult with list of Mention objects

        Raises:
            ProviderError: If the search fails
        """
        pass

    @abstractmethod
    def get_platform_name(self) -> str:
        """Return the platform identifier (e.g., 'x', 'reddit')."""
        pass

    async def validate_query(self, query: str) -> bool:
        """
        Validate the search query before making API calls.

        Args:
            query: The search query to validate

        Returns:
            True if valid, False otherwise
        """
        return bool(query and query.strip())
