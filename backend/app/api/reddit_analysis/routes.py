"""
Reddit Analysis API Routes

FastAPI endpoints for Reddit platform analysis.
Provides unified interface for frontend to interact with Reddit data.
Uses RedditAgent for comprehensive analysis including sentiment, topics, and alerts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from ...database import get_db
from ...services.reddit_agent import reddit_agent


class RedditAnalysisRequest(BaseModel):
    """Request model for Reddit analysis."""
    subreddits: str = Field("", description="Subreddits to analyze (comma-separated)")
    keywords: str = Field(..., min_length=1, max_length=500, description="Keywords to search")
    limit: int = Field(20, ge=1, le=100, description="Maximum results")


router = APIRouter()


@router.post("/search")
async def search_reddit(
    request: RedditAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Search Reddit and perform comprehensive analysis.

    Returns unified structure with:
    - summary: Generated summary
    - sentiment: Sentiment breakdown
    - topics: Trending topics
    - alerts: Detected alerts
    - mentions: List of Mention objects
    """
    try:
        # Parse inputs
        keyword_list = [k.strip() for k in request.keywords.split(",") if k.strip()]
        subreddit_list = [s.strip() for s in request.subreddits.split(",") if s.strip()] if request.subreddits else None

        if not keyword_list:
            raise HTTPException(
                status_code=400,
                detail="Please provide at least one keyword"
            )

        # Use RedditAgent for unified analysis
        result = await reddit_agent.run_analysis(
            keywords=keyword_list,
            subreddits=subreddit_list,
            limit=request.limit
        )

        # result["mentions"] is already converted to dict format in reddit_agent.py
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


@router.get("/subreddits")
async def list_subreddits():
    """
    List popular subreddits for reference.
    """
    # MVP: Return a curated list of popular subreddits
    popular_subreddits = [
        "technology",
        "programming",
        "business",
        "marketing",
        "news",
        "gaming",
        "science",
        "finance",
        "crypto",
        "sports",
        "music",
        "movies",
        "books"
    ]

    return {
        "subreddits": popular_subreddits,
        "status": "success"
    }
