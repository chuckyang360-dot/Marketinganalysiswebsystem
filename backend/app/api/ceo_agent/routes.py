"""
CEO Agent API Routes

FastAPI endpoints for unified marketing analysis.
Orchestrates Reddit, SEO, Gap Analysis, and Content Ideas agents
into a single unified workflow.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from ...services.ceo_agent import ceo_agent


class FullAnalysisRequest(BaseModel):
    """Request model for full analysis."""
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    limit: int = Field(20, ge=1, le=100, description="Maximum results per agent")


router = APIRouter()


@router.post("")
async def full_analysis(request: FullAnalysisRequest):
    """
    Run full analysis pipeline with all agents.

    Orchestrates the complete workflow:
    1. Reddit Agent (demand side)
    2. SEO Agent (supply side)
    3. Gap Analysis Agent
    4. Content Ideas Agent

    Returns unified result with all analysis components.
    """
    try:
        # Validate input
        if not request.query:
            raise HTTPException(
                status_code=400,
                detail="Please provide a search query"
            )

        # Use CEO Agent for unified analysis
        result = await ceo_agent.run_full_analysis(
            query=request.query,
            limit=request.limit
        )

        return {
            "status": "success",
            **result
        }

    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"[CEO_AGENT] Error in full_analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
