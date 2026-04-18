from __future__ import annotations

import logging
import time
from pathlib import Path

from ..exceptions import ShortDramaImageSaveError

logger = logging.getLogger(__name__)


def short_drama_generated_root() -> Path:
    """backend/generated/short_drama_assets (relative to backend package root)."""
    # app/short_drama/utils/image_storage.py -> parents[3] = backend/
    backend_dir = Path(__file__).resolve().parents[3]
    return backend_dir / "generated" / "short_drama_assets"


def ensure_project_dir(project_id: int) -> Path:
    d = short_drama_generated_root() / str(project_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def public_url_path(project_id: int, filename: str) -> str:
    """Path served via StaticFiles mount /static/short-drama-assets."""
    return f"/static/short-drama-assets/{project_id}/{filename}"


def save_image_bytes(
    *,
    project_id: int,
    asset_type: str,
    asset_id: int,
    data: bytes,
    ext: str,
) -> str:
    """Write file and return public URL path."""
    ext = ext.lstrip(".") or "png"
    ts = int(time.time() * 1000)
    fname = f"{asset_type}_{asset_id}_{ts}.{ext}"
    proj = ensure_project_dir(project_id)
    path = proj / fname
    try:
        path.write_bytes(data)
    except OSError as e:
        logger.exception("SHORT_DRAMA_IMAGE_SAVE_FAIL project_id=%s path=%s", project_id, path)
        raise ShortDramaImageSaveError(f"Failed to save image: {e}") from e
    return public_url_path(project_id, fname)


def mime_to_ext(mime: str) -> str:
    m = (mime or "").lower()
    if "png" in m:
        return "png"
    if "jpeg" in m or "jpg" in m:
        return "jpg"
    if "webp" in m:
        return "webp"
    return "png"
