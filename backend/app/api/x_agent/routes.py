from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ....database import get_db
from ....schemas import XAnalysisRequest, XAnalysisResponse, XAnalysisResult
from ....services.xai_service import xai_service
from ....auth.jwt_handler import get_current_active_user
from ....models import User, XAnalysis

router = APIRouter()


@router.post("/analyze", response_model=XAnalysisResponse)
async def analyze_keyword(
    request: XAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit keyword for X platform analysis"""
    try:
        # Create analysis record
        analysis_record = XAnalysis(
            user_id=current_user.id,
            keyword=request.keyword,
            analysis_type=request.analysis_type,
            status="pending"
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

        # Async analysis (in production, use Celery or background tasks)
        try:
            result = await xai_service.analyze_keyword(
                keyword=request.keyword,
                analysis_type=request.analysis_type
            )

            # Update analysis record with results
            analysis_record.status = "completed"
            analysis_record.result_data = str(result)
            analysis_record.completed_at = datetime.utcnow()
            db.commit()

            return XAnalysisResponse(
                id=analysis_record.id,
                user_id=analysis_record.user_id,
                keyword=analysis_record.keyword,
                analysis_type=analysis_record.analysis_type,
                status=analysis_record.status,
                result_data=result,
                created_at=analysis_record.created_at,
                completed_at=analysis_record.completed_at
            )

        except Exception as analysis_error:
            # Update analysis record with failure
            analysis_record.status = "failed"
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {str(analysis_error)}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/history", response_model=List[XAnalysisResponse])
async def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = 10
):
    """Get analysis history for current user"""
    analyses = db.query(XAnalysis)\
        .filter(XAnalysis.user_id == current_user.id)\
        .order_by(XAnalysis.created_at.desc())\
        .limit(limit)\
        .all()

    return analyses


@router.get("/trending")
async def get_trending_topics(
    keyword: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get trending topics from X platform"""
    try:
        result = await xai_service.get_trending_topics(keyword)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )