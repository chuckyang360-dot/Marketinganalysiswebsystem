"""
CEO Agent API Routes

FastAPI endpoints for unified marketing analysis.
Orchestrates Reddit, SEO, Gap Analysis, and Content Ideas agents
into a single unified workflow.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import logging

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
    3. X Agent (sentiment analysis, optional)
    4. Gap Analysis Agent
    5. Content Ideas Agent
    6. AI Report Service (placeholder implementation)

    Returns unified result with all analysis components including AI report.
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


@router.get("/analyze")
@router.post("/analyze")
async def analyze(
    query: str = Query(..., description="用户输入的关键词或电商商品URL"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results per agent"),
):
    """Vibe Marketing + Global PulseAI 统一分析入口"""
    try:
        result = await ceo_agent.run_full_analysis(query=query, limit=limit)
        return {"status": "success", **result}
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"[CEO_AGENT] Error in analyze: {str(e)}")
        return {"status": "error", "error": str(e)}
