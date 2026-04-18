"""Local filesystem storage for generated segment/final videos."""

from __future__ import annotations

import logging
import time
from pathlib import Path
from urllib.parse import urlparse

from ..exceptions import ShortDramaVideoSaveError
from .public_static_url import build_public_static_url

logger = logging.getLogger(__name__)


def short_drama_videos_root() -> Path:
    """backend/generated/short_drama_videos"""
    backend_dir = Path(__file__).resolve().parents[3]
    return backend_dir / "generated" / "short_drama_videos"


def ensure_video_project_dir(project_id: int) -> Path:
    d = short_drama_videos_root() / str(project_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def public_video_url_path(project_id: int, filename: str) -> str:
    return f"/static/short-drama-videos/{project_id}/{filename}"


def save_segment_video_bytes(*, project_id: int, segment_id: str, data: bytes) -> str:
    ts = int(time.time() * 1000)
    safe_seg = "".join(c if c.isalnum() or c in "-_" else "_" for c in segment_id)[:120]
    fname = f"segment_{safe_seg}_{ts}.mp4"
    proj = ensure_video_project_dir(project_id)
    path = proj / fname
    try:
        path.write_bytes(data)
    except OSError as e:
        logger.exception("SHORT_DRAMA_VIDEO_SAVE_FAIL project_id=%s path=%s", project_id, path)
        raise ShortDramaVideoSaveError(f"Failed to save segment video: {e}") from e
    return public_video_url_path(project_id, fname)


def save_final_video_bytes(*, project_id: int, data: bytes) -> str:
    ts = int(time.time() * 1000)
    fname = f"final_{project_id}_{ts}.mp4"
    proj = ensure_video_project_dir(project_id)
    path = proj / fname
    try:
        path.write_bytes(data)
    except OSError as e:
        logger.exception("SHORT_DRAMA_FINAL_SAVE_FAIL project_id=%s path=%s", project_id, path)
        raise ShortDramaVideoSaveError(f"Failed to save final video: {e}") from e
    return public_video_url_path(project_id, fname)


def local_path_from_public_video_url(public_url: str) -> Path:
    """Map /static/short-drama-videos/{project_id}/file.mp4 to filesystem path."""
    u = public_url.strip()
    if u.startswith("http://") or u.startswith("https://"):
        parsed = urlparse(u)
        u = parsed.path or ""
    prefix = "/static/short-drama-videos/"
    if not u.startswith(prefix):
        raise ShortDramaVideoSaveError(f"Not a short drama video URL: {public_url}")
    rel = u[len(prefix) :].lstrip("/")
    root = short_drama_videos_root().resolve()
    path = (root / rel).resolve()
    try:
        path.relative_to(root)
    except ValueError as e:
        raise ShortDramaVideoSaveError(f"Invalid video path escape: {public_url}") from e
    return path


def absolutize_media_url_for_provider(relative_or_absolute: str) -> str:
    """xAI reference images must be public URLs; relative /static/... paths use configured public base."""
    s = (relative_or_absolute or "").strip()
    if not s:
        return s
    return build_public_static_url(s)
