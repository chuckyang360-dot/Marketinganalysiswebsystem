import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import ShortDramaProject
from ..utils.enums import ProjectStatus, WorkflowStep
from ..utils.flow_logging import log_orchestrator

logger = logging.getLogger(__name__)

_STEP_LOG_MODULE: dict[WorkflowStep, str] = {
    WorkflowStep.PARSE_PRODUCT: "product_parsing",
    WorkflowStep.GENERATE_STORY: "story_generation",
    WorkflowStep.GENERATE_ASSET_SPECS: "assets_generation",
    WorkflowStep.GENERATE_SEGMENTS: "segment_generation",
    WorkflowStep.RENDER_ASSETS: "asset_images",
    WorkflowStep.RENDER_VIDEO: "video_generation",
    WorkflowStep.MERGE: "video_generation",
}


def _orch_mod(step: WorkflowStep) -> str:
    return _STEP_LOG_MODULE.get(step, step.value)

# Required project.status before each step (linear text pipeline for v1)
_STEP_PREREQUISITE: dict[WorkflowStep, Optional[ProjectStatus]] = {
    WorkflowStep.PARSE_PRODUCT: ProjectStatus.CREATED,
    WorkflowStep.GENERATE_STORY: ProjectStatus.PRODUCT_PARSED,
    WorkflowStep.GENERATE_ASSET_SPECS: ProjectStatus.STORY_GENERATED,
    WorkflowStep.GENERATE_SEGMENTS: ProjectStatus.ASSET_SPECS_GENERATED,
    WorkflowStep.RENDER_ASSETS: None,  # handled in assert_step_allowed (image batches)
    WorkflowStep.RENDER_VIDEO: None,  # handled in assert_step_allowed (video batch)
    WorkflowStep.MERGE: None,  # handled in assert_step_allowed (merge: video_rendering or video_segments_ready)
}

_SUCCESS_STATUS: dict[WorkflowStep, ProjectStatus] = {
    WorkflowStep.PARSE_PRODUCT: ProjectStatus.PRODUCT_PARSED,
    WorkflowStep.GENERATE_STORY: ProjectStatus.STORY_GENERATED,
    WorkflowStep.GENERATE_ASSET_SPECS: ProjectStatus.ASSET_SPECS_GENERATED,
    WorkflowStep.GENERATE_SEGMENTS: ProjectStatus.SEGMENTS_GENERATED,
    WorkflowStep.RENDER_ASSETS: ProjectStatus.ASSETS_RENDERING,
    WorkflowStep.RENDER_VIDEO: ProjectStatus.VIDEO_RENDERING,
    WorkflowStep.MERGE: ProjectStatus.COMPLETED,
}

_RENDER_ASSETS_ALLOWED = frozenset(
    {
        ProjectStatus.ASSET_SPECS_GENERATED.value,
        ProjectStatus.SEGMENTS_GENERATED.value,
        ProjectStatus.ASSETS_RENDERING.value,
        ProjectStatus.ASSETS_READY.value,
    }
)

# 与 assert_step_allowed(RENDER_ASSETS) 一致，供路由预检与 [API_BLOCKED] 日志
ASSET_IMAGE_RENDER_ALLOWED_STATUSES: frozenset[str] = _RENDER_ASSETS_ALLOWED

_SEGMENT_GENERATE_ALLOWED = frozenset(
    {
        ProjectStatus.ASSET_SPECS_GENERATED.value,
        ProjectStatus.ASSETS_READY.value,
        # Allow idempotent regenerate after a prior successful run (route replaces segment rows on success).
        ProjectStatus.SEGMENTS_GENERATED.value,
    }
)

_VIDEO_RENDER_ALLOWED = frozenset(
    {
        ProjectStatus.ASSETS_READY.value,
        ProjectStatus.SEGMENTS_GENERATED.value,
    }
)

_MERGE_ALLOWED = frozenset(
    {
        ProjectStatus.VIDEO_RENDERING.value,
        ProjectStatus.VIDEO_SEGMENTS_READY.value,
    }
)

_SINGLE_SEGMENT_VIDEO_ALLOWED = frozenset(
    {
        ProjectStatus.ASSETS_READY.value,
        ProjectStatus.SEGMENTS_GENERATED.value,
        ProjectStatus.VIDEO_RENDERING.value,
        ProjectStatus.VIDEO_SEGMENTS_READY.value,
        ProjectStatus.COMPLETED.value,
    }
)


class WorkflowOrchestrator:
    """Owns legal status transitions; routes must not mutate status directly."""

    def get_project(self, db: Session, project_id: int) -> ShortDramaProject:
        project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    def assert_step_allowed(self, project: ShortDramaProject, step: WorkflowStep) -> None:
        if project.status == ProjectStatus.FAILED.value:
            log_orchestrator(
                logger,
                _orch_mod(step),
                "step_assert_denied",
                project_id=project.id,
                step=step.value,
                reason="project_failed",
                status=project.status,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project is in failed state",
            )
        if step == WorkflowStep.RENDER_ASSETS:
            if project.status not in _RENDER_ASSETS_ALLOWED:
                log_orchestrator(
                    logger,
                    "asset_images",
                    "step_assert_denied",
                    project_id=project.id,
                    step=step.value,
                    reason="invalid_status_for_asset_render",
                    status=project.status,
                    allowed=sorted(_RENDER_ASSETS_ALLOWED),
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Invalid status for asset image render: have {project.status}, "
                        f"need one of {sorted(_RENDER_ASSETS_ALLOWED)}"
                    ),
                )
            return
        if step == WorkflowStep.GENERATE_SEGMENTS:
            if project.status not in _SEGMENT_GENERATE_ALLOWED:
                log_orchestrator(
                    logger,
                    _orch_mod(step),
                    "step_assert_denied",
                    project_id=project.id,
                    step=step.value,
                    reason="invalid_status_for_segment_generate",
                    status=project.status,
                    allowed=sorted(_SEGMENT_GENERATE_ALLOWED),
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Invalid status for step {step.value}: have {project.status}, "
                        f"need one of {sorted(_SEGMENT_GENERATE_ALLOWED)}"
                    ),
                )
            return
        if step == WorkflowStep.RENDER_VIDEO:
            if project.status not in _VIDEO_RENDER_ALLOWED:
                log_orchestrator(
                    logger,
                    _orch_mod(step),
                    "step_assert_denied",
                    project_id=project.id,
                    step=step.value,
                    reason="invalid_status_for_video_render",
                    status=project.status,
                    allowed=sorted(_VIDEO_RENDER_ALLOWED),
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Invalid status for step {step.value}: have {project.status}, "
                        f"need one of {sorted(_VIDEO_RENDER_ALLOWED)}"
                    ),
                )
            return
        if step == WorkflowStep.MERGE:
            if project.status not in _MERGE_ALLOWED:
                log_orchestrator(
                    logger,
                    _orch_mod(step),
                    "step_assert_denied",
                    project_id=project.id,
                    step=step.value,
                    reason="invalid_status_for_merge",
                    status=project.status,
                    allowed=sorted(_MERGE_ALLOWED),
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Invalid status for merge: have {project.status}, "
                        f"need one of {sorted(_MERGE_ALLOWED)}"
                    ),
                )
            return
        required = _STEP_PREREQUISITE.get(step)
        if required is None:
            return
        if project.status != required.value:
            log_orchestrator(
                logger,
                _orch_mod(step),
                "step_assert_denied",
                project_id=project.id,
                step=step.value,
                reason="prerequisite_mismatch",
                status=project.status,
                required_status=required.value,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Invalid status for step {step.value}: have {project.status}, need {required.value}",
            )

    def advance_on_success(self, db: Session, project: ShortDramaProject, step: WorkflowStep) -> None:
        new_status = _SUCCESS_STATUS.get(step)
        if not new_status:
            return
        old_status = project.status
        project.status = new_status.value
        db.add(project)
        log_orchestrator(
            logger,
            _orch_mod(step),
            "advance_on_success",
            project_id=project.id,
            step=step.value,
            old_status=old_status,
            new_status=new_status.value,
        )

    def begin_asset_image_render(self, db: Session, project: ShortDramaProject) -> None:
        """Enter assets_rendering from specs ready or from segments_done (re-render)."""
        self.assert_step_allowed(project, WorkflowStep.RENDER_ASSETS)
        if project.status in (
            ProjectStatus.ASSET_SPECS_GENERATED.value,
            ProjectStatus.SEGMENTS_GENERATED.value,
        ):
            log_orchestrator(
                logger,
                "asset_images",
                "begin_asset_image_render",
                project_id=project.id,
                from_status=project.status,
                to_status=ProjectStatus.ASSETS_RENDERING.value,
            )
            project.status = ProjectStatus.ASSETS_RENDERING.value
            db.add(project)

    def complete_asset_image_render(
        self,
        db: Session,
        project: ShortDramaProject,
        *,
        had_attempts: bool,
        any_success: bool,
    ) -> None:
        """After an image batch: ready if any image succeeded or nothing to do.

        If every attempt failed, revert to asset_specs_generated so POST /assets/images/generate
        can retry (do not mark project failed — that permanently blocks the pipeline).
        """
        if not had_attempts:
            project.status = ProjectStatus.ASSETS_READY.value
            db.add(project)
            log_orchestrator(
                logger,
                "asset_images",
                "complete_asset_image_render",
                project_id=project.id,
                had_attempts=False,
                new_status=project.status,
            )
            return
        if any_success:
            project.status = ProjectStatus.ASSETS_READY.value
        else:
            self.revert_to_asset_specs_after_image_batch_failure(
                db,
                project,
                reason="all_image_attempts_failed_recoverable",
            )
            return
        db.add(project)
        log_orchestrator(
            logger,
            "asset_images",
            "complete_asset_image_render",
            project_id=project.id,
            had_attempts=True,
            any_success=any_success,
            new_status=project.status,
        )

    def revert_to_asset_specs_after_image_batch_failure(
        self,
        db: Session,
        project: ShortDramaProject,
        *,
        reason: str,
    ) -> None:
        """Move project back to asset_specs_generated so image batches can be retried."""
        old_status = project.status
        project.status = ProjectStatus.ASSET_SPECS_GENERATED.value
        db.add(project)
        log_orchestrator(
            logger,
            "asset_images",
            "revert_to_asset_specs_for_retry",
            project_id=project.id,
            old_status=old_status,
            new_status=project.status,
            reason=reason[:200],
        )

    def normalize_failed_for_asset_image_retry(
        self,
        db: Session,
        project: ShortDramaProject,
        *,
        asset_row_count: int,
    ) -> None:
        """If a previous run left project failed but asset rows exist, unblock image retry."""
        if project.status != ProjectStatus.FAILED.value:
            return
        if asset_row_count <= 0:
            log_orchestrator(
                logger,
                "asset_images",
                "normalize_failed_skip_no_asset_rows",
                project_id=project.id,
            )
            return
        self.revert_to_asset_specs_after_image_batch_failure(
            db,
            project,
            reason="normalize_failed_state_for_image_retry",
        )

    def mark_failed(self, db: Session, project: ShortDramaProject, message: Optional[str] = None) -> None:
        project.status = ProjectStatus.FAILED.value
        db.add(project)
        log_orchestrator(
            logger,
            "workflow",
            "mark_failed",
            project_id=project.id,
            message=(message or "")[:500],
        )

    def begin_video_render(self, db: Session, project: ShortDramaProject) -> None:
        """assets_ready or segments_generated → video_rendering (segment scripts may follow asset images)."""
        self.assert_step_allowed(project, WorkflowStep.RENDER_VIDEO)
        if project.status in (
            ProjectStatus.ASSETS_READY.value,
            ProjectStatus.SEGMENTS_GENERATED.value,
        ):
            log_orchestrator(
                logger,
                "video_generation",
                "begin_video_render",
                project_id=project.id,
                from_status=project.status,
                to_status=ProjectStatus.VIDEO_RENDERING.value,
            )
            project.status = ProjectStatus.VIDEO_RENDERING.value
            db.add(project)

    def complete_segment_video_batch(
        self,
        db: Session,
        project: ShortDramaProject,
        *,
        had_attempts: bool,
        any_success: bool,
        all_failed: bool,
        all_segments_succeeded: bool,
    ) -> None:
        """After batch: all failed → failed; all segment jobs OK → video_segments_ready; else video_rendering."""
        if not had_attempts:
            return
        if all_failed:
            project.status = ProjectStatus.FAILED.value
            db.add(project)
            log_orchestrator(
                logger,
                "video_generation",
                "complete_segment_video_batch",
                project_id=project.id,
                outcome="all_failed",
                new_status=project.status,
            )
            return
        if any_success:
            if all_segments_succeeded:
                project.status = ProjectStatus.VIDEO_SEGMENTS_READY.value
                outcome = "all_segments_ready_for_final"
            else:
                project.status = ProjectStatus.VIDEO_RENDERING.value
                outcome = "partial_or_full_success"
            db.add(project)
            log_orchestrator(
                logger,
                "video_generation",
                "complete_segment_video_batch",
                project_id=project.id,
                outcome=outcome,
                new_status=project.status,
            )

    def mark_video_segments_ready_if_complete(
        self,
        db: Session,
        project: ShortDramaProject,
        *,
        all_segment_videos_present: bool,
    ) -> None:
        """When every segment script has a video_url, move video_rendering → video_segments_ready."""
        if not all_segment_videos_present:
            return
        if project.status != ProjectStatus.VIDEO_RENDERING.value:
            return
        project.status = ProjectStatus.VIDEO_SEGMENTS_READY.value
        db.add(project)
        log_orchestrator(
            logger,
            "video_generation",
            "mark_video_segments_ready",
            project_id=project.id,
            new_status=project.status,
        )

    def complete_final_merge(self, db: Session, project: ShortDramaProject) -> None:
        """merge succeeded → completed (merge failures should not call this; keep prior status for retry)."""
        project.status = ProjectStatus.COMPLETED.value
        db.add(project)
        log_orchestrator(
            logger,
            "video_generation",
            "complete_final_merge",
            project_id=project.id,
            new_status=project.status,
        )


orchestrator = WorkflowOrchestrator()
