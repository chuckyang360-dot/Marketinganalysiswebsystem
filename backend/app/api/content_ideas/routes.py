"""
Content Ideas API Routes

FastAPI endpoints for generating content ideas.
Based on Reddit Agent (demand), SEO Agent (supply), and Gap Agent (opportunities)
to generate actionable content suggestions.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from ...analysis.content_ideas import generate_content_ideas


class ContentIdeasRequest(BaseModel):
    """Request model for content ideas generation."""
    reddit_topics: List[str] = Field(..., description="Topics from Reddit Agent (demand side)")
    seo_topics: List[str] = Field(..., description="Topics from SEO Agent (supply side)")
    opportunities: List[Dict[str, Any]] = Field(..., description="Opportunities from gap analysis")


router = APIRouter()


@router.post("")
async def generate_ideas(request: ContentIdeasRequest):
    """
    Generate actionable content ideas based on gap analysis.

    Converts "demand + supply + gap" into specific content recommendations.

    Returns:
        Content ideas with title, format, reason, and target keyword
    """
    try:
        # Validate input
        if not request.opportunities:
            raise HTTPException(
                status_code=400,
                detail="At least one opportunity must be provided"
            )

        # Generate content ideas
        result = generate_content_ideas(
            reddit_topics=request.reddit_topics,
            seo_topics=request.seo_topics,
            opportunities=request.opportunities
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
