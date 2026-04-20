import logging
import os
import socket

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ...database import get_db
from ..models import RenderJob
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
    RenderJobStatusResponse,
    SingleSegmentVideoResponse,
    VideoBatchSummaryResponse,
    VideoProjectRequest,
)
from ..services.merge_service import merge_service
from ..services.project_state_service import OVERVIEW, STEP_4, update_last_active_step
from ..services.workflow_orchestrator import orchestrator
from ..services.render_executor_service import render_executor_service
from ..utils.enums import RenderTargetType
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=VideoBatchSummaryResponse)
async def generate_all_segment_videos(body: VideoProjectRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /videos/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        update_last_active_step(project, STEP_4)
        db.add(project)
        db.commit()
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
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    logger.info(
        "[SEGMENT_GENERATE_REQUEST] project_id=%s segment_id=%s request_url=%s base_url_from_request=%s hostname=%s cwd=%s",
        body.project_id,
        segment_id,
        str(request.url),
        str(request.base_url),
        socket.gethostname(),
        os.getcwd(),
    )
    log_api_request(
        logger,
        "POST /videos/generate/{segment_id}",
        project_id=body.project_id,
        segment_id=segment_id,
    )
    try:
        project = orchestrator.get_project(db, body.project_id)
        update_last_active_step(project, STEP_4)
        db.add(project)
        db.commit()
        job = render_executor_service.enqueue_single_segment_video(db, body.project_id, segment_id)
        background_tasks.add_task(
            render_executor_service.run_single_segment_video_job,
            body.project_id,
            segment_id,
            job.id,
        )
        log_api_success(
            logger,
            "POST /videos/generate/{segment_id}",
            project_id=body.project_id,
            segment_id=segment_id,
            ok=True,
            render_job_id=job.id,
            status=job.status,
        )
        return SingleSegmentVideoResponse(
            project_id=body.project_id,
            segment_id=segment_id,
            ok=True,
            status=job.status,
            progress=0,
            video_url=None,
            render_job_id=job.id,
            error=None,
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


@router.get("/render-jobs/{job_id}", response_model=RenderJobStatusResponse)
async def get_render_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(RenderJob).filter(RenderJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Render job {job_id} not found")
    if job.target_type != RenderTargetType.SEGMENT.value:
        raise HTTPException(status_code=400, detail=f"Render job {job_id} is not a segment video job")
    meta = dict(job.meta_json or {})
    status = str(job.status or meta.get("status") or "pending")
    progress_raw = meta.get("progress", 0)
    try:
        progress = max(0, min(100, int(progress_raw)))
    except (TypeError, ValueError):
        progress = 0
    return RenderJobStatusResponse(
        job_id=job.id,
        project_id=job.project_id,
        segment_id=str(job.target_id),
        status=status,
        progress=progress,
        video_url=job.output_url,
        error=job.error_message,
        request_id=job.provider_request_id,
    )


@router.post("/merge", response_model=MergeVideoResponse)
async def merge_final_video(body: VideoProjectRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /videos/merge", project_id=body.project_id)
    try:
        url = merge_service.merge_project_video(db, body.project_id)
        project = orchestrator.get_project(db, body.project_id)
        update_last_active_step(project, OVERVIEW)
        db.add(project)
        db.commit()
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
