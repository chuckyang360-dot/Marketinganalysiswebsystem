"""
Unified Mention Model

A standardized data model for social media mentions across platforms.
This is the core data layer v1 for GlobalPulseAI.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class Platform(str, Enum):
    """Supported social media platforms."""
    X = "x"
    REDDIT = "reddit"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    YOUTUBE = "youtube"


class Sentiment(str, Enum):
    """Sentiment labels."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class InfluencerTier(str, Enum):
    """Influencer classification tiers."""
    MACRO = "macro"      # > 100k followers
    MID = "mid"          # 10k - 100k followers
    MICRO = "micro"      # 1k - 10k followers
    NANO = "nano"        # < 1k followers
    UNKNOWN = "unknown"


class Mention(BaseModel):
    """
    Unified mention model for all social media platforms.

    This model standardizes data from different social platforms into a
    consistent format for analysis and storage.
    """

    # Core identification
    id: str = Field(..., description="Unique identifier from platform")
    platform: Platform = Field(..., description="Source platform")

    # Author information
    author: str = Field(default="", description="Author display name")
    author_username: str = Field(default="", description="Author handle/username")
    author_display_name: str = Field(default="", description="Author display name")

    # Content
    text: str = Field(..., description="Post text/content")
    url: str = Field(default="", description="Post URL")

    # Timestamp
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Post creation time")

    # Engagement metrics
    likes: int = Field(default=0, ge=0, description="Like count")
    comments: int = Field(default=0, ge=0, description="Comment count")
    shares: int = Field(default=0, ge=0, description="Share/retweet count")
    followers: int = Field(default=0, ge=0, description="Author follower count")

    @property
    def engagement_total(self) -> int:
        """Total engagement (likes + comments + shares)."""
        return self.likes + self.comments + self.shares

    # Analysis fields (populated by analysis services)
    sentiment: Sentiment = Field(default=Sentiment.NEUTRAL, description="Sentiment label")
    sentiment_score: float = Field(default=0.0, ge=-1.0, le=1.0, description="Sentiment score (-1 to 1)")
    influencer_tier: InfluencerTier = Field(default=InfluencerTier.UNKNOWN, description="Author influence tier")

    # Platform-specific metadata
    platform_metadata: Dict[str, Any] = Field(default_factory=dict, description="Platform-specific fields")

    # Raw data for reference
    raw: Dict[str, Any] = Field(default_factory=dict, description="Original raw data from platform API")

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "id": "1234567890",
                "platform": "x",
                "author": "John Doe",
                "author_username": "johndoe",
                "author_display_name": "John Doe",
                "text": "This is a great product!",
                "url": "https://x.com/johndoe/status/1234567890",
                "timestamp": "2026-03-12T10:30:00Z",
                "likes": 150,
                "comments": 25,
                "shares": 10,
                "followers": 5000,
                "sentiment": "positive",
                "sentiment_score": 0.8,
                "influencer_tier": "micro",
                "platform_metadata": {},
                "raw": {}
            }
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with computed fields."""
        data = self.model_dump()
        data["engagement_total"] = self.engagement_total
        return data


class MentionList(BaseModel):
    """Container for multiple mentions."""
    mentions: list[Mention] = Field(default_factory=list, description="List of mentions")
    total_count: int = Field(default=0, description="Total number of mentions")

    def __init__(self, mentions: list[Mention] | None = None):
        super().__init__(mentions=mentions or [])
        self.total_count = len(self.mentions)
