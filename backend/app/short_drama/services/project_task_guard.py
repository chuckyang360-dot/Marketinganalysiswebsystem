from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import ShortDramaProject
from .read_models import (
    all_segment_scripts_have_video,
    latest_final_video_url,
    latest_product_context,
    latest_story_blueprint,
    list_pipeline_asset_rows,
    list_segment_scripts,
)

logger = logging.getLogger(__name__)

_RUNTIME_KEY = "_runtime"


def _step_status(project: ShortDramaProject) -> dict[str, Any]:
    return dict(project.step_status or {})


def _runtime(project: ShortDramaProject) -> dict[str, Any]:
    st = _step_status(project)
    rt = st.get(_RUNTIME_KEY)
    return dict(rt) if isinstance(rt, dict) else {}


def _save_runtime(project: ShortDramaProject, runtime: dict[str, Any]) -> None:
    st = _step_status(project)
    st[_RUNTIME_KEY] = runtime
    project.step_status = st


def current_stage(project: ShortDramaProject) -> str:
    return str(_runtime(project).get("current_stage") or "")


def failed_stage(project: ShortDramaProject) -> str:
    return str(_runtime(project).get("failed_stage") or "")


def error_message(project: ShortDramaProject) -> str:
    return str(_runtime(project).get("error_message") or "")


def error_type(project: ShortDramaProject) -> str:
    return str(_runtime(project).get("error_type") or "")


def can_retry(project: ShortDramaProject) -> bool:
    return bool(_runtime(project).get("can_retry", False))


def is_processing(project: ShortDramaProject) -> bool:
    rt = _runtime(project)
    return str(project.status or "").strip().lower() == "processing" or bool(rt.get("task_running", False))


def recover_stale_processing_status_if_possible(db: Session, project: ShortDramaProject) -> str:
    status_now = str(project.status or "").strip().lower()
    if status_now != "processing":
        return "noop"

    rt = _runtime(project)
    task_running = bool(rt.get("task_running", False))
    stage_now = str(rt.get("current_stage") or "").strip()
    if task_running:
        logger.info(
            "[PROJECT_STALE_PROCESSING_DETECTED] project_id=%s old_status=%s current_stage=%s task_running=%s reason=%s",
            project.id,
            project.status,
            stage_now,
            task_running,
            "active_runtime_lock",
        )
        return "running"

    logger.warning(
        "[PROJECT_STALE_PROCESSING_DETECTED] project_id=%s old_status=%s current_stage=%s task_running=%s reason=%s",
        project.id,
        project.status,
        stage_now,
        task_running,
        "processing_without_running_lock",
    )

    final_video_url = latest_final_video_url(db, project.id)
    segs = list_segment_scripts(db, project.id)
    all_seg_video_ready = all_segment_scripts_have_video(db, project.id)
    chars, scenes, products = list_pipeline_asset_rows(db, project.id)
    has_assets = bool(chars or scenes or products)
    has_assets_ready = bool(
        any(str(getattr(c, "image_url", "") or "").strip() for c in chars)
        or any(str(getattr(s, "image_url", "") or "").strip() for s in scenes)
        or any(str(getattr(p, "image_url", "") or "").strip() for p in products)
    )
    story = latest_story_blueprint(db, project.id)
    product = latest_product_context(db, project.id)

    detected_artifacts = {
        "has_final_video": bool(final_video_url),
        "segment_scripts_count": len(segs),
        "all_segment_videos_ready": all_seg_video_ready,
        "asset_counts": {
            "characters": len(chars),
            "scenes": len(scenes),
            "products": len(products),
        },
        "has_assets_ready": has_assets_ready,
        "has_story_blueprint": bool(story),
        "has_product_context": bool(product),
    }

    recovered_status = ""
    reason = ""
    if final_video_url:
        recovered_status = "completed"
        reason = "final_video_exists"
    elif all_seg_video_ready:
        recovered_status = "video_segments_ready"
        reason = "all_segment_videos_exist"
    elif segs:
        recovered_status = "segments_generated"
        reason = "segment_scripts_exist"
    elif has_assets_ready:
        recovered_status = "assets_ready"
        reason = "asset_images_exist"
    elif has_assets:
        recovered_status = "asset_specs_generated"
        reason = "asset_specs_exist"
    elif story:
        recovered_status = "story_generated"
        reason = "story_blueprint_exists"
    elif product:
        recovered_status = "product_parsed"
        reason = "product_context_exists"
    else:
        recovered_status = "created"
        reason = "no_artifacts_found"

    rt.pop("task_running", None)
    rt.pop("current_stage", None)
    rt.pop("failed_stage", None)
    rt.pop("error_message", None)
    rt.pop("error_type", None)
    rt["can_retry"] = False
    project.status = recovered_status
    _save_runtime(project, rt)
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info(
        "[PROJECT_STALE_PROCESSING_RECOVERED] project_id=%s old_status=%s recovered_status=%s reason=%s current_stage=%s task_running=%s detected_artifacts=%s",
        project.id,
        "processing",
        recovered_status,
        reason,
        stage_now,
        task_running,
        detected_artifacts,
    )
    has_any_artifact = bool(
        detected_artifacts["has_final_video"]
        or detected_artifacts["segment_scripts_count"] > 0
        or detected_artifacts["all_segment_videos_ready"]
        or detected_artifacts["has_assets_ready"]
        or any((detected_artifacts["asset_counts"] or {}).values())
        or detected_artifacts["has_story_blueprint"]
        or detected_artifacts["has_product_context"]
    )
    if recovered_status == "created" and not has_any_artifact:
        logger.warning(
            "[PROJECT_STALE_PROCESSING_UNRECOVERABLE] project_id=%s old_status=%s recovered_status=%s reason=%s",
            project.id,
            "processing",
            recovered_status,
            reason,
        )
    return "recovered"


def acquire_project_task_lock(db: Session, project: ShortDramaProject, *, stage: str) -> None:
    rt_before = _runtime(project)
    old_status = project.status
    logger.info(
        "[PROJECT_TASK_LOCK_STATE] project_id=%s status=%s current_stage=%s task_running=%s",
        project.id,
        project.status,
        str(rt_before.get("current_stage") or ""),
        bool(rt_before.get("task_running", False)),
    )
    logger.info(
        "[PROJECT_TASK_LOCK_CHECK] project_id=%s user_id=%s stage=%s status=%s",
        project.id,
        project.user_id,
        stage,
        project.status,
    )
    running_other = (
        db.query(ShortDramaProject)
        .filter(
            ShortDramaProject.user_id == project.user_id,
            ShortDramaProject.id != project.id,
            ShortDramaProject.status == "processing",
        )
        .first()
    )
    if running_other is not None:
        logger.warning(
            "[PROJECT_TASK_LOCK_REJECTED] project_id=%s user_id=%s stage=%s reason=user_has_running_project running_project_id=%s",
            project.id,
            project.user_id,
            stage,
            running_other.id,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "detail": "You already have a project processing. Please wait for it to finish.",
                "running_project_id": running_other.id,
            },
        )
    if is_processing(project):
        logger.warning(
            "[PROJECT_TASK_LOCK_REJECTED] project_id=%s user_id=%s stage=%s reason=project_already_processing current_stage=%s",
            project.id,
            project.user_id,
            stage,
            current_stage(project),
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "Project is currently processing. Please wait or retry after it finishes.",
                "current_stage": current_stage(project),
                "status": project.status,
            },
        )

    rt = _runtime(project)
    rt.update(
        {
            "task_running": True,
            "current_stage": stage,
            "previous_status": old_status,
            "failed_stage": "",
            "error_message": "",
            "error_type": "",
            "can_retry": False,
        }
    )
    project.status = "processing"
    _save_runtime(project, rt)
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info(
        "[PROJECT_TASK_LOCK_ACQUIRED] project_id=%s user_id=%s stage=%s old_status=%s new_status=%s previous_status=%s",
        project.id,
        project.user_id,
        stage,
        old_status,
        project.status,
        old_status,
    )
    logger.info(
        "[PROJECT_STAGE_STARTED] project_id=%s stage=%s old_status=%s new_status=%s",
        project.id,
        stage,
        old_status,
        project.status,
    )


def mark_project_stage_succeeded(
    db: Session,
    project_id: int,
    *,
    stage: str,
    status_after: str | None = None,
    success_status: str | None = None,
) -> None:
    project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if project is None:
        return
    resolved_success_status = str(success_status or status_after or "").strip()
    if not resolved_success_status:
        raise ValueError("mark_project_stage_succeeded requires status_after or success_status")
    previous_status = project.status
    rt = _runtime(project)
    rt.pop("task_running", None)
    rt.pop("current_stage", None)
    rt.pop("failed_stage", None)
    rt.pop("error_message", None)
    rt.pop("error_type", None)
    rt["can_retry"] = False
    rt["last_succeeded_stage"] = stage
    project.status = resolved_success_status
    _save_runtime(project, rt)
    db.add(project)
    db.commit()
    logger.info(
        "[PROJECT_STAGE_SUCCEEDED] project_id=%s stage=%s previous_status=%s success_status=%s runtime_cleared=true",
        project_id,
        stage,
        previous_status,
        resolved_success_status,
    )


def mark_project_stage_failed(
    db: Session,
    project_id: int,
    *,
    stage: str,
    error_type_value: str,
    message: str,
) -> None:
    project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if project is None:
        return
    rt = _runtime(project)
    rt.update(
        {
            "task_running": False,
            "current_stage": "",
            "failed_stage": stage,
            "error_message": (message or "")[:240],
            "error_type": (error_type_value or "unknown_error")[:80],
            "can_retry": True,
        }
    )
    project.status = "failed"
    _save_runtime(project, rt)
    db.add(project)
    db.commit()
    logger.error(
        "[PROJECT_STAGE_FAILED] project_id=%s stage=%s error_type=%s failed_status=%s error_message=%s",
        project_id,
        stage,
        error_type_value,
        project.status,
        (message or "")[:240],
    )
