"""
CEO Agent API Routes

FastAPI endpoints for unified marketing analysis.
Orchestrates Reddit, SEO, Gap Analysis, and Content Ideas agents
into a single unified workflow.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging

from ...services.ceo_agent import ceo_agent


class FullAnalysisRequest(BaseModel):
    """Request model for full analysis."""
    query: str = Field(..., min_length=1, max_length=2000, description="Search query 或电商商品 URL")
    limit: int = Field(20, ge=1, le=100, description="Maximum results per agent")
    # CEO 统一编排：图片优化等扩展动作（非 URL 分析走 action）
    action: Optional[str] = Field(
        default=None,
        description='例如 ecom_optimize_images：在 CEO 内走 Banana→Grok 主图优化',
    )
    user_prompt: Optional[str] = Field(
        default=None,
        description="图片优化时用户编辑的 Prompt",
    )
    selected_reference_images: Optional[List[str]] = Field(
        default=None,
        description="图片优化参考图 URL，最多 6 张",
    )
    analysis_id: Optional[str] = Field(
        default=None,
        description="前端分析会话 id（用于链路追踪）",
    )
    optimize_direction: Optional[str] = Field(
        default=None,
        description="主图优化方向（如 场景化卖点图）",
    )
    product_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="当前商品上下文（标题/平台/品牌等）",
    )


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

        # Use CEO Agent for unified analysis（含图片优化等 action）
        result = await ceo_agent.run_full_analysis(
            query=request.query,
            limit=request.limit,
            action=request.action,
            user_prompt=request.user_prompt,
            selected_reference_images=request.selected_reference_images,
            analysis_id=request.analysis_id,
            optimize_direction=request.optimize_direction,
            product_context=request.product_context,
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
