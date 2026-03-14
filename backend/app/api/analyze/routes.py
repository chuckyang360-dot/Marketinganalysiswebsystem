from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ...database import get_db
from ...config import settings
from ...services.analysis_agent import analyze_evidence
from ...schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvidenceItem,
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze")
async def analyze_endpoint(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze evidence and return structured insights.

    This endpoint:
    1. Accepts evidence items from frontend
    2. Sorts by engagement and limits to top N
    3. Calls Analysis Agent (Grok API or fallback)
    4. Returns structured insights
    """
    try:
        logger.info(f"Starting evidence analysis with {len(request.evidence)} items, max_items={request.max_items}")

        # Call the analysis agent
        result = await analyze_evidence(
            evidence=request.evidence,
            max_items=request.max_items or 10,
            query=request.query,
        )

        logger.info(f"Analysis complete: {len(result.topics)} topics, {len(result.key_insights)} insights")

        return result

    except ValueError as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "evidence-analysis",
        "version": "1.0.0"
    }
