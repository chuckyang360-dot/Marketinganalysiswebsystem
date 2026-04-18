"""Lightweight JPEG copies of asset images for xAI video reference fetch (smaller / faster than full PNG)."""

from __future__ import annotations

import hashlib
import io
import logging
from pathlib import Path
from urllib.parse import urlparse

from ..exceptions import ShortDramaVideoProviderError
from .image_storage import short_drama_generated_root

logger = logging.getLogger(__name__)

PREFIX_ASSETS = "/static/short-drama-assets/"
PREFIX_XAI = "/static/short-drama-xai-assets/"

MAX_LONGEST_SIDE = 1024
JPEG_QUALITY_PRIMARY = 80
JPEG_QUALITY_FALLBACK = 70
MAX_BYTES_BEFORE_FALLBACK = 200 * 1024


def xai_ready_assets_root() -> Path:
    """backend/generated/short_drama_xai_assets"""
    backend_dir = Path(__file__).resolve().parents[3]
    return backend_dir / "generated" / "short_drama_xai_assets"


def ensure_xai_project_dir(project_id: int) -> Path:
    d = xai_ready_assets_root() / str(project_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def public_xai_ready_url_path(project_id: int, filename: str) -> str:
    return f"/static/short-drama-xai-assets/{project_id}/{filename}"


def local_path_from_asset_public_url(public_url: str) -> Path:
    """Map /static/short-drama-assets/... (or absolute URL with that path) to disk under generated/short_drama_assets."""
    u = (public_url or "").strip()
    if u.startswith("http://") or u.startswith("https://"):
        u = urlparse(u).path or ""
    if not u.startswith(PREFIX_ASSETS):
        raise ShortDramaVideoProviderError(
            f"xAI reference prep: source URL must be under {PREFIX_ASSETS}, got: {public_url!r}"
        )
    rel = u[len(PREFIX_ASSETS) :].lstrip("/")
    root = short_drama_generated_root().resolve()
    path = (root / rel).resolve()
    try:
        path.relative_to(root)
    except ValueError as e:
        raise ShortDramaVideoProviderError(f"xAI reference prep: invalid asset path escape: {public_url!r}") from e
    return path


def local_path_from_xai_ready_public_url(public_url: str) -> Path:
    """Map /static/short-drama-xai-assets/... to disk."""
    u = (public_url or "").strip()
    if u.startswith("http://") or u.startswith("https://"):
        u = urlparse(u).path or ""
    if not u.startswith(PREFIX_XAI):
        raise ShortDramaVideoProviderError(f"xAI reference prep: not an xai-ready path: {public_url!r}")
    rel = u[len(PREFIX_XAI) :].lstrip("/")
    root = xai_ready_assets_root().resolve()
    path = (root / rel).resolve()
    try:
        path.relative_to(root)
    except ValueError as e:
        raise ShortDramaVideoProviderError(f"xAI reference prep: invalid xai-ready path: {public_url!r}") from e
    return path


def _resize_longest_side(im, max_side: int):
    from PIL import Image

    w, h = im.size
    if max(w, h) <= max_side:
        return im
    if w >= h:
        nw = max_side
        nh = max(1, int(round(h * max_side / w)))
    else:
        nh = max_side
        nw = max(1, int(round(w * max_side / h)))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def _write_jpeg_with_size_cap(im, out_path: Path) -> None:
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=JPEG_QUALITY_PRIMARY, optimize=True)
    data = buf.getvalue()
    if len(data) > MAX_BYTES_BEFORE_FALLBACK:
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=JPEG_QUALITY_FALLBACK, optimize=True)
        data = buf.getvalue()
    out_path.write_bytes(data)


def build_xai_ready_reference_image(project_id: int, source_public_url: str) -> str:
    """
    Build a small RGB JPEG under /static/short-drama-xai-assets/<project_id>/xai_ref_<hash>.jpg
    Returns the **relative** public path (for absolutize_media_url_for_provider).
    """
    try:
        from PIL import Image
    except ImportError as e:
        raise ShortDramaVideoProviderError(
            "xAI reference prep: Pillow (PIL) is required. Install with: pip install Pillow"
        ) from e

    normalized = (source_public_url or "").strip()
    key = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:24]
    fname = f"xai_ref_{key}.jpg"
    out_dir = ensure_xai_project_dir(project_id)
    out_path = out_dir / fname
    public_rel = public_xai_ready_url_path(project_id, fname)

    if out_path.is_file():
        return public_rel

    src_path = local_path_from_asset_public_url(normalized)
    if not src_path.is_file():
        raise ShortDramaVideoProviderError(
            f"xAI reference prep: source asset file not found: {src_path} (from {normalized!r})"
        )

    try:
        with Image.open(src_path) as im:
            im = im.convert("RGB")
            im = _resize_longest_side(im, MAX_LONGEST_SIDE)
            _write_jpeg_with_size_cap(im, out_path)
    except ShortDramaVideoProviderError:
        raise
    except Exception as e:
        logger.exception("xAI reference prep: Pillow error source=%s", src_path)
        raise ShortDramaVideoProviderError(f"xAI reference prep: failed to process image {src_path}: {e}") from e

    return public_rel
