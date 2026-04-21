"""Read helpers for latest pipeline artifacts (keeps route handlers thin)."""

import re
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import (
    CharacterAsset,
    ProductAsset,
    ProductContextRecord,
    RenderJob,
    SceneAsset,
    SegmentScriptRecord,
    StoryBlueprintRecord,
)
from ..utils.enums import RenderJobStatus, RenderTargetType


def latest_product_context(db: Session, project_id: int) -> Optional[ProductContextRecord]:
    return (
        db.query(ProductContextRecord)
        .filter(ProductContextRecord.project_id == project_id)
        .order_by(ProductContextRecord.version.desc(), ProductContextRecord.id.desc())
        .first()
    )


def latest_story_blueprint(db: Session, project_id: int) -> Optional[StoryBlueprintRecord]:
    return (
        db.query(StoryBlueprintRecord)
        .filter(StoryBlueprintRecord.project_id == project_id)
        .order_by(StoryBlueprintRecord.version.desc(), StoryBlueprintRecord.id.desc())
        .first()
    )


def next_product_context_version(db: Session, project_id: int) -> int:
    v = db.query(func.max(ProductContextRecord.version)).filter(
        ProductContextRecord.project_id == project_id
    ).scalar()
    return (v or 0) + 1


def next_story_version(db: Session, project_id: int) -> int:
    v = db.query(func.max(StoryBlueprintRecord.version)).filter(
        StoryBlueprintRecord.project_id == project_id
    ).scalar()
    return (v or 0) + 1


def next_segment_batch_version(db: Session, project_id: int) -> int:
    v = db.query(func.max(SegmentScriptRecord.version)).filter(
        SegmentScriptRecord.project_id == project_id
    ).scalar()
    return (v or 0) + 1


def list_segment_scripts(db: Session, project_id: int) -> list[SegmentScriptRecord]:
    """One row per segment_id: highest version (then id) wins — avoids duplicate segments in pipeline/merge."""
    rows: list[SegmentScriptRecord] = (
        db.query(SegmentScriptRecord)
        .filter(SegmentScriptRecord.project_id == project_id)
        .order_by(
            SegmentScriptRecord.segment_id,
            SegmentScriptRecord.version.desc(),
            SegmentScriptRecord.id.desc(),
        )
        .all()
    )
    picked: dict[str, SegmentScriptRecord] = {}
    for r in rows:
        if r.segment_id not in picked:
            picked[r.segment_id] = r

    def _natural_key(segment_id: str) -> list:
        return [int(p) if p.isdigit() else p.lower() for p in re.split(r"(\d+)", segment_id)]

    return sorted(picked.values(), key=lambda x: _natural_key(x.segment_id))


def list_asset_rows(db: Session, project_id: int) -> tuple[list[CharacterAsset], list[SceneAsset], list[ProductAsset]]:
    chars = (
        db.query(CharacterAsset)
        .filter(CharacterAsset.project_id == project_id)
        .order_by(CharacterAsset.id)
        .all()
    )
    scenes = (
        db.query(SceneAsset).filter(SceneAsset.project_id == project_id).order_by(SceneAsset.id).all()
    )
    products = (
        db.query(ProductAsset)
        .filter(ProductAsset.project_id == project_id)
        .order_by(ProductAsset.id)
        .all()
    )
    return chars, scenes, products


def latest_final_video_url(db: Session, project_id: int) -> str | None:
    # Use the latest final job attempt only, so old completed rows
    # cannot pollute current pipeline state after retries.
    row = (
        db.query(RenderJob)
        .filter(
            RenderJob.project_id == project_id,
            RenderJob.target_type == RenderTargetType.FINAL.value,
        )
        .order_by(RenderJob.id.desc())
        .first()
    )
    if not row:
        return None
    if (row.status or "").lower() != RenderJobStatus.COMPLETED.value:
        return None
    output_url = (row.output_url or "").strip()
    return output_url or None


def latest_final_render_job(db: Session, project_id: int) -> RenderJob | None:
    """Most recent final merge attempt (any status)."""
    return (
        db.query(RenderJob)
        .filter(
            RenderJob.project_id == project_id,
            RenderJob.target_type == RenderTargetType.FINAL.value,
        )
        .order_by(RenderJob.id.desc())
        .first()
    )


def all_segment_scripts_have_video(db: Session, project_id: int) -> bool:
    segs = list_segment_scripts(db, project_id)
    if not segs:
        return False
    for s in segs:
        script = s.script_json if isinstance(s.script_json, dict) else {}
        vr = script.get("video_render") or {}
        if not (str(vr.get("video_url") or "").strip()):
            return False
    return True


def segment_render_job_by_segment_id(
    db: Session, project_id: int, segment_id: str
) -> RenderJob | None:
    return (
        db.query(RenderJob)
        .filter(
            RenderJob.project_id == project_id,
            RenderJob.target_type == RenderTargetType.SEGMENT.value,
            RenderJob.target_id == segment_id,
        )
        .order_by(RenderJob.id.desc())
        .first()
    )
