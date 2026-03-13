"""
SEO Analysis API Routes

FastAPI endpoints for SEO platform analysis.
Provides unified interface for frontend to interact with SEO data.
Uses SEOAgent for comprehensive analysis including sentiment, topics, and alerts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from ...database import get_db
from ...services.seo_agent import seo_agent


class SEOAnalysisRequest(BaseModel):
    """Request model for SEO analysis."""
    keywords: str = Field(..., min_length=1, max_length=500, description="Keywords to analyze")
    site_url: str = Field("", description="Own site URL (optional)")
    limit: int = Field(20, ge=1, le=100, description="Maximum results")


router = APIRouter()


@router.post("/search")
async def search_seo(
    request: SEOAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Search web content and perform comprehensive analysis.

    Returns unified structure with:
    - summary: Generated summary
    - sentiment: Sentiment breakdown
    - topics: Trending topics
    - alerts: Detected alerts
    - mentions: List of Mention objects
    """
    try:
        # Parse inputs
        keywords_list = [k.strip() for k in request.keywords.split(",") if k.strip()]
        site_url = request.site_url.strip() if request.site_url else None

        if not keywords_list:
            raise HTTPException(
                status_code=400,
                detail="Please provide at least one keyword"
            )

        # Use SEOAgent for unified analysis
        result = await seo_agent.run_analysis(
            keywords=keywords_list,
            site_url=site_url,
            limit=request.limit
        )

        # result["mentions"] is already converted to dict format in seo_agent.py
        # No need to call .to_dict() again
        mentions_data = result["mentions"]

        return {
            "summary": result["summary"],
            "sentiment": result["sentiment"],
            "topics": result["topics"],
            "alerts": result["alerts"],
            "mentions": mentions_data,
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/keywords-suggestions")
async def get_keyword_suggestions():
    """
    Get keyword suggestions for SEO.
    """
    # MVP: Return a curated list of high-value keywords
    suggested_keywords = [
        "AI分析",
        "社交媒体营销",
        "品牌推广",
        "内容营销",
        "SEO优化",
        "用户体验",
        "竞品对比",
        "品牌声誉",
        "用户行为分析",
        "危机监控"
    ]

    return {
        "keywords": suggested_keywords,
        "status": "success"
    }
