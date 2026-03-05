from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    google_id: str
    picture: Optional[str] = None


class UserResponse(UserBase):
    id: int
    google_id: str
    picture: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


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
