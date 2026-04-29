from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import ShortDramaProject

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


def acquire_project_task_lock(db: Session, project: ShortDramaProject, *, stage: str) -> None:
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
    logger.info("[PROJECT_TASK_LOCK_ACQUIRED] project_id=%s user_id=%s stage=%s", project.id, project.user_id, stage)
    logger.info("[PROJECT_STAGE_STARTED] project_id=%s stage=%s", project.id, stage)


def mark_project_stage_succeeded(db: Session, project_id: int, *, stage: str, status_after: str) -> None:
    project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if project is None:
        return
    rt = _runtime(project)
    rt.update(
        {
            "task_running": False,
            "current_stage": "",
            "last_succeeded_stage": stage,
            "failed_stage": "",
            "error_message": "",
            "error_type": "",
            "can_retry": False,
        }
    )
    project.status = status_after
    _save_runtime(project, rt)
    db.add(project)
    db.commit()
    logger.info("[PROJECT_STAGE_SUCCEEDED] project_id=%s stage=%s status=%s", project_id, stage, status_after)


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
        "[PROJECT_STAGE_FAILED] project_id=%s stage=%s error_type=%s error_message=%s",
        project_id,
        stage,
        error_type_value,
        (message or "")[:240],
    )
