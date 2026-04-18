import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import (
    ShortDramaFFmpegError,
    ShortDramaMergeError,
    ShortDramaVideoInputError,
    ShortDramaVideoProviderError,
    ShortDramaVideoSaveError,
)
from ..http_errors import raise_short_drama_http
from ..schemas.video import (
    MergeVideoResponse,
    SingleSegmentVideoResponse,
    VideoBatchSummaryResponse,
    VideoProjectRequest,
)
from ..services.merge_service import merge_service
from ..services.render_executor_service import render_executor_service
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=VideoBatchSummaryResponse)
async def generate_all_segment_videos(body: VideoProjectRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /videos/generate", project_id=body.project_id)
    try:
        r = render_executor_service.generate_segment_videos(db, body.project_id)
        log_api_success(
            logger,
            "POST /videos/generate",
            project_id=r.project_id,
            segments_attempted=r.segments_attempted,
            segments_succeeded=r.segments_succeeded,
            errors_count=len(r.errors),
        )
        return VideoBatchSummaryResponse(
            project_id=r.project_id,
            segments_attempted=r.segments_attempted,
            segments_succeeded=r.segments_succeeded,
            errors=r.errors,
        )
    except ShortDramaVideoInputError as e:
        log_api_error(logger, "POST /videos/generate", str(e), project_id=body.project_id)
        raise_short_drama_http(e)
    except (ShortDramaVideoProviderError, ShortDramaVideoSaveError) as e:
        log_api_error(logger, "POST /videos/generate", str(e), project_id=body.project_id)
        raise_short_drama_http(e)
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /videos/generate",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise


@router.post("/generate/{segment_id}", response_model=SingleSegmentVideoResponse)
async def generate_one_segment_video(
    segment_id: str,
    body: VideoProjectRequest,
    db: Session = Depends(get_db),
):
    log_api_request(
        logger,
        "POST /videos/generate/{segment_id}",
        project_id=body.project_id,
        segment_id=segment_id,
    )
    try:
        r = render_executor_service.generate_single_segment_video(db, body.project_id, segment_id)
        log_api_success(
            logger,
            "POST /videos/generate/{segment_id}",
            project_id=body.project_id,
            segment_id=r.segment_id,
            ok=r.ok,
            video_url=r.video_url or "",
            render_job_id=r.render_job_id,
        )
        return SingleSegmentVideoResponse(
            project_id=body.project_id,
            segment_id=r.segment_id,
            ok=r.ok,
            video_url=r.video_url,
            render_job_id=r.render_job_id,
            error=r.error_message,
        )
    except ShortDramaVideoInputError as e:
        log_api_error(
            logger,
            "POST /videos/generate/{segment_id}",
            str(e),
            project_id=body.project_id,
            segment_id=segment_id,
        )
        raise_short_drama_http(e)
    except (ShortDramaVideoProviderError, ShortDramaVideoSaveError) as e:
        log_api_error(
            logger,
            "POST /videos/generate/{segment_id}",
            str(e),
            project_id=body.project_id,
            segment_id=segment_id,
        )
        raise_short_drama_http(e)
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /videos/generate/{segment_id}",
            str(e.detail),
            project_id=body.project_id,
            segment_id=segment_id,
            status_code=e.status_code,
        )
        raise


@router.post("/merge", response_model=MergeVideoResponse)
async def merge_final_video(body: VideoProjectRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /videos/merge", project_id=body.project_id)
    try:
        url = merge_service.merge_project_video(db, body.project_id)
        log_api_success(
            logger,
            "POST /videos/merge",
            project_id=body.project_id,
            final_video_url=url or "",
        )
        return MergeVideoResponse(project_id=body.project_id, final_video_url=url)
    except ShortDramaMergeError as e:
        log_api_error(logger, "POST /videos/merge", str(e), project_id=body.project_id)
        raise_short_drama_http(e)
    except ShortDramaFFmpegError as e:
        log_api_error(logger, "POST /videos/merge", str(e), project_id=body.project_id)
        raise_short_drama_http(e)
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /videos/merge",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise
