"""
Gap Analysis API Routes

FastAPI endpoints for keyword gap analysis.
Compares Reddit Agent (demand side) and SEO Agent (supply side) topics
to identify keyword opportunities.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from ...analysis.gap_analysis import analyze_keyword_gap


class GapAnalysisRequest(BaseModel):
    """Request model for gap analysis."""
    reddit_topics: List[str] = Field(..., description="Topics from Reddit Agent (demand side)")
    seo_topics: List[str] = Field(..., description="Topics from SEO Agent (supply side)")


router = APIRouter()


@router.post("")
async def analyze_gap(request: GapAnalysisRequest):
    """
    Analyze keyword gap between Reddit and SEO topics.

    Identifies content opportunities where demand (Reddit discussions)
    exceeds supply (SEO content).

    Returns:
        Opportunities sorted by gap_score (highest first)
    """
    try:
        # Validate input
        if not request.reddit_topics and not request.seo_topics:
            raise HTTPException(
                status_code=400,
                detail="At least one of reddit_topics or seo_topics must be provided"
            )

        # Perform gap analysis
        result = analyze_keyword_gap(
            reddit_topics=request.reddit_topics,
            seo_topics=request.seo_topics
        )

        return {
            "status": "success",
            **result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
