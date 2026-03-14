from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    google_id: Optional[str] = None
    picture: Optional[str] = None


class UserResponse(UserBase):
    id: int
    google_id: Optional[str] = None
    picture: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Login/Register Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleAuthRequest(BaseModel):
    id_token: str


# X Analysis Schemas
class XAnalysisRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100)
    analysis_type: str = Field("trending", pattern="^(trending|sentiment|both)$")


class XAnalysisResponse(BaseModel):
    id: int
    user_id: int
    keyword: str
    analysis_type: str
    status: str
    result_data: Optional[dict]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class XAnalysisResult(BaseModel):
    keyword: str
    analysis_type: str
    trending_topics: Optional[list]
    sentiment_analysis: Optional[dict]
    insights: list
    timestamp: datetime


class GoogleAuthUrlResponse(BaseModel):
    url: str


# Evidence Analysis Schemas

# Evidence Source Schema
class EvidenceSource(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    author_id: Optional[str] = None
    follower_count: Optional[int] = None
    subscriber_count: Optional[int] = None
    author_karma: Optional[int] = None
    verified: Optional[bool] = None
    domain_authority: Optional[int] = None
    source_type: Optional[str] = None


# Evidence Metrics Schema
class EvidenceMetrics(BaseModel):
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    reposts: Optional[int] = None
    views: Optional[int] = None
    engagement_rate: Optional[float] = None
    reach: Optional[int] = None
    impressions: Optional[int] = None
    upvotes: Optional[int] = None
    downvotes: Optional[int] = None
    score: Optional[int] = None


# Evidence Analysis Schema
class EvidenceAnalysis(BaseModel):
    sentiment: Optional[str] = None
    relevance_score: Optional[float] = None
    quality_score: Optional[float] = None
    authority_score: Optional[float] = None
    overall_weight: Optional[float] = None
    engagement_rate: Optional[float] = None


# Evidence Metadata Schema
class EvidenceMetadata(BaseModel):
    subreddit: Optional[str] = None
    domain: Optional[str] = None
    published_at: Optional[str] = None
    media_type: Optional[str] = None
    content_type: Optional[str] = None


# Evidence Item Schema
class EvidenceItem(BaseModel):
    platform: str
    author: str
    content: str
    url: str
    title: Optional[str] = None
    source: Optional[EvidenceSource] = None
    metrics: Optional[EvidenceMetrics] = None
    analysis: Optional[EvidenceAnalysis] = None
    metadata: Optional[EvidenceMetadata] = None


# Analysis Agent Request Schema
class AnalyzeRequest(BaseModel):
    query: Optional[str] = None
    evidence: List[EvidenceItem]
    max_items: Optional[int] = 10


# Topic Schema
class Topic(BaseModel):
    name: str
    frequency: int
    platforms: List[str]
    sentiment: Optional[str] = None


# Key Insight Schema
class KeyInsight(BaseModel):
    category: str
    title: str
    description: str
    supporting_evidence: int
    platforms: List[str]


# Sentiment Summary Schema
class SentimentSummary(BaseModel):
    positive: int
    negative: int
    neutral: int
    mixed: Optional[int] = None
    dominant: Optional[str] = None


# Emerging Pattern Schema
class EmergingPattern(BaseModel):
    pattern: str
    evidence_count: int
    confidence: str
    platforms: List[str]
    timeframe: Optional[str] = None


# Recommended Angle Schema
class RecommendedAngle(BaseModel):
    angle: str
    rationale: str
    target_audience: Optional[str] = None
    content_type: Optional[str] = None
    platforms: List[str]


# Analysis Meta Schema
class AnalysisMeta(BaseModel):
    total_evidence_analyzed: int
    platforms_covered: List[str]
    analysis_timestamp: str


# Analysis Agent Response Schema
class AnalyzeResponse(BaseModel):
    topics: List[Topic]
    key_insights: List[KeyInsight]
    sentiment_summary: SentimentSummary
    emerging_patterns: List[EmergingPattern]
    recommended_angles: List[RecommendedAngle]
    meta: AnalysisMeta
