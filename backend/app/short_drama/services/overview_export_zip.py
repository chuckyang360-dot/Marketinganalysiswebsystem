"""Build zip archives for Overview export (videos-only / full bundle)."""

from __future__ import annotations

import io
import json
import logging
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from ..exceptions import ShortDramaVideoSaveError
from ..models import ShortDramaProject
from ..services.pipeline_video_state import build_pipeline_video_state
from ..services.read_models import latest_final_video_url, list_segment_scripts
from ..services.overview_export_markdown import build_script_markdown, build_storyboard_markdown
from ..utils.segment_slots import normalize_segment_script_dict_for_read
from ..utils.public_static_url import build_public_static_url
from ..utils.video_storage import download_public_video_to_temp_mp4, local_path_from_public_video_url

logger = logging.getLogger(__name__)


def _safe_dir_name(name: str) -> str:
    s = re.sub(r'[/\\?%*:|"<>]', "_", (name or "").strip())
    s = re.sub(r"\s+", " ", s).strip()
    return s or "project"


def _segment_mp4_filename(index: int, script: dict, segment_id: str) -> str:
    title = (script.get("title") or "").strip() or str(segment_id)
    slug = re.sub(r"[^\w\u4e00-\u9fff\-]+", "-", title)
    slug = slug.strip("-")[:48] or "segment"
    return f"seg{index}-{slug}.mp4"


def _public_url_from_script(script: dict) -> str | None:
    vr = script.get("video_render") if isinstance(script.get("video_render"), dict) else {}
    u = (vr.get("video_url") or "").strip()
    return u or None


def _resolve_archive_video_path(public_url: str, temp_cleanup: list[Path]) -> Path:
    s = (public_url or "").strip()
    if not s:
        raise ValueError("empty video url")
    abs_url = build_public_static_url(s) if not (s.startswith("http://") or s.startswith("https://")) else s
    try:
        p = local_path_from_public_video_url(abs_url)
        if p.is_file():
            return p
    except (ShortDramaVideoSaveError, OSError, ValueError) as e:
        logger.info("[OVERVIEW_EXPORT_VIDEO_NOT_LOCAL] url=%s err=%s", abs_url[:200], e)

    tmp = download_public_video_to_temp_mp4(abs_url)
    temp_cleanup.append(tmp)
    return tmp


def _write_zip(
    *,
    root_folder: str,
    final_public_url: str | None,
    segment_rows: list[Any],
    project_row: Any,
    blueprint_json: dict | None,
    include_docs: bool,
) -> bytes:
    temp_cleanup: list[Path] = []
    try:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            # final
            if final_public_url and str(final_public_url).strip():
                fp = _resolve_archive_video_path(str(final_public_url), temp_cleanup)
                arc = f"{root_folder}/final/{_safe_dir_name(project_row.project_name)}-final.mp4"
                zf.write(fp, arcname=arc)

            # segments
            for idx, row in enumerate(segment_rows, start=1):
                raw_script = row.script_json if isinstance(getattr(row, "script_json", None), dict) else {}
                script = normalize_segment_script_dict_for_read(dict(raw_script))
                vu = _public_url_from_script(script)
                if not vu:
                    continue
                sp = _resolve_archive_video_path(vu, temp_cleanup)
                arc = f"{root_folder}/segments/{_segment_mp4_filename(idx, script, str(row.segment_id))}"
                zf.write(sp, arcname=arc)

            if include_docs:
                pname = _safe_dir_name(project_row.project_name)
                script_md = build_script_markdown(
                    project_name=project_row.project_name,
                    project_row=project_row,
                    blueprint_json=blueprint_json,
                    segment_rows=segment_rows,
                )
                sb_md = build_storyboard_markdown(
                    project_name=project_row.project_name,
                    blueprint_json=blueprint_json,
                    segment_rows=segment_rows,
                )
                zf.writestr(f"{root_folder}/docs/{pname}-script.md", script_md.encode("utf-8"))
                zf.writestr(f"{root_folder}/docs/{pname}-storyboard.md", sb_md.encode("utf-8"))

                meta = {
                    "project_id": project_row.id,
                    "project_name": project_row.project_name,
                    "exported_at": datetime.now(timezone.utc).isoformat(),
                    "final_video_url": build_public_static_url(final_public_url) if final_public_url else None,
                    "segment_count": len(segment_rows),
                }
                zf.writestr(
                    f"{root_folder}/meta/metadata.json",
                    json.dumps(meta, ensure_ascii=False, indent=2).encode("utf-8"),
                )

        return buf.getvalue()
    finally:
        for p in temp_cleanup:
            try:
                p.unlink(missing_ok=True)
            except OSError:
                pass


def build_videos_zip_bytes(db: Session, project_id: int) -> tuple[bytes, str]:
    project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if not project:
        raise ValueError("project not found")
    vs = build_pipeline_video_state(db, project_id, project.status or "")
    if not vs.get("has_all_segment_videos") or not vs.get("has_final_video"):
        raise ValueError("incomplete_videos_pack")

    segs = list_segment_scripts(db, project_id)
    final_u = latest_final_video_url(db, project_id)
    root = f"{_safe_dir_name(project.project_name)}-videos"
    data = _write_zip(
        root_folder=root,
        final_public_url=final_u,
        segment_rows=segs,
        project_row=project,
        blueprint_json=None,
        include_docs=False,
    )
    fname = f"{_safe_dir_name(project.project_name)}-videos.zip"
    return data, fname


def build_all_zip_bytes(db: Session, project_id: int, blueprint_json: dict | None) -> tuple[bytes, str]:
    project = db.query(ShortDramaProject).filter(ShortDramaProject.id == project_id).first()
    if not project:
        raise ValueError("project not found")
    vs = build_pipeline_video_state(db, project_id, project.status or "")
    if not vs.get("has_all_segment_videos") or not vs.get("has_final_video"):
        raise ValueError("incomplete_videos_all")

    segs = list_segment_scripts(db, project_id)
    final_u = latest_final_video_url(db, project_id)
    root = f"{_safe_dir_name(project.project_name)}-export"
    data = _write_zip(
        root_folder=root,
        final_public_url=final_u,
        segment_rows=segs,
        project_row=project,
        blueprint_json=blueprint_json,
        include_docs=True,
    )
    fname = f"{_safe_dir_name(project.project_name)}-export.zip"
    return data, fname
