"""Minimal ffmpeg concat for segment MP4s."""

from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

from ..exceptions import ShortDramaFFmpegError

logger = logging.getLogger(__name__)

FFMPEG_BIN = "/opt/homebrew/bin/ffmpeg"


def merge_mp4_files(segment_paths: list[Path], output_path: Path) -> None:
    if not segment_paths:
        raise ShortDramaFFmpegError("No segment files to merge")
    for p in segment_paths:
        if not p.is_file():
            raise ShortDramaFFmpegError(f"Missing segment file: {p}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        list_file = Path(f.name)
        for p in segment_paths:
            # concat demuxer requires safe escaped paths
            escaped = str(p.resolve()).replace("'", r"'\''")
            f.write(f"file '{escaped}'\n")

    try:
        proc = subprocess.run(
            [
                FFMPEG_BIN,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-c",
                "copy",
                str(output_path),
            ],
            capture_output=True,
            text=True,
            timeout=600,
        )
        if proc.returncode != 0:
            logger.warning("ffmpeg -c copy failed, retry re-encode. stderr=%s", proc.stderr[:2000])
            proc2 = subprocess.run(
                [
                    FFMPEG_BIN,
                    "-y",
                    "-f",
                    "concat",
                    "-safe",
                    "0",
                    "-i",
                    str(list_file),
                    "-c:v",
                    "libx264",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-movflags",
                    "+faststart",
                    str(output_path),
                ],
                capture_output=True,
                text=True,
                timeout=600,
            )
            if proc2.returncode != 0:
                raise ShortDramaFFmpegError(
                    f"ffmpeg merge failed: {proc2.stderr[:2000] or proc.stderr[:2000]}"
                )
    except FileNotFoundError as e:
        raise ShortDramaFFmpegError(
            "ffmpeg not found. Expected at /opt/homebrew/bin/ffmpeg"
        ) from e
    except subprocess.TimeoutExpired as e:
        raise ShortDramaFFmpegError("ffmpeg merge timed out") from e
    finally:
        try:
            list_file.unlink(missing_ok=True)
        except OSError:
            pass
