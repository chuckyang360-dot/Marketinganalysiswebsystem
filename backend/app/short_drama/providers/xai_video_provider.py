"""High-level video provider: reference-to-video via xAI (or mock)."""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from ...config import settings
from ..exceptions import ShortDramaVideoProviderError
from ..utils.flow_logging import log_ai_error, log_ai_request, log_ai_response
from .xai_video_client import XAIVideoClient, effective_xai_video_model

logger = logging.getLogger(__name__)
_XAI_PROVIDER_DURATION_CAP_SECONDS = 10

# Mock dev video must be produced by ffmpeg on disk paths we control.
# Embedded base64 "minimal MP4" was removed: demux failed (e.g. H.264 "No start code is found") and
# validate_segment_mp4_path rejected it. Re-introduce embedded fallback only if a blob is verified
# with the same demux checks as production, and only when Path(MOCK_FFMPEG_BIN).is_file() is False.
MOCK_FFMPEG_BIN = "/opt/homebrew/bin/ffmpeg"


@dataclass
class SegmentVideoResult:
    video_bytes: bytes
    provider_video_url: str | None
    provider_metadata: dict[str, Any]


class SegmentVideoProvider(Protocol):
    def submit_reference_segment_video(
        self,
        *,
        prompt: str,
        reference_image_urls: list[str],
        duration_seconds: int,
        aspect_ratio: str,
        resolution: str | None,
        project_id: int,
        segment_id: str,
    ) -> str: ...

    def complete_segment_video(
        self,
        *,
        request_id: str,
        project_id: int,
        segment_id: str,
        duration_seconds: int = 6,
    ) -> SegmentVideoResult: ...

    def generate_segment_video(
        self,
        *,
        prompt: str,
        reference_image_urls: list[str],
        duration_seconds: int,
        aspect_ratio: str,
        resolution: str | None,
        project_id: int,
        segment_id: str,
    ) -> SegmentVideoResult:
        """Convenience: submit + complete (used when RenderJob logging is not interleaved)."""
        rid = self.submit_reference_segment_video(
            prompt=prompt,
            reference_image_urls=reference_image_urls,
            duration_seconds=duration_seconds,
            aspect_ratio=aspect_ratio,
            resolution=resolution,
            project_id=project_id,
            segment_id=segment_id,
        )
        return self.complete_segment_video(
            request_id=rid,
            project_id=project_id,
            segment_id=segment_id,
            duration_seconds=duration_seconds,
        )


class XAIVideoProvider:
    """reference-to-video only for Phase 4."""

    def __init__(self, client: XAIVideoClient | None = None):
        self._client = client or XAIVideoClient()

    def submit_reference_segment_video(
        self,
        *,
        prompt: str,
        reference_image_urls: list[str],
        duration_seconds: int,
        aspect_ratio: str,
        resolution: str | None,
        project_id: int,
        segment_id: str,
    ) -> str:
        try:
            model = effective_xai_video_model()
            dur = int(duration_seconds)
            dur_pass = dur <= _XAI_PROVIDER_DURATION_CAP_SECONDS
            logger.info(
                "[XAI_SEGMENT_DURATION_CHECK] project_id=%s segment_id=%s requested_duration_seconds=%s provider_cap_seconds=%s pass=%s",
                project_id,
                segment_id,
                dur,
                _XAI_PROVIDER_DURATION_CAP_SECONDS,
                dur_pass,
            )
            if not dur_pass:
                err = (
                    f"segment duration {dur}s exceeds provider cap {_XAI_PROVIDER_DURATION_CAP_SECONDS}s"
                )
                logger.error(
                    "[XAI_SEGMENT_DURATION_REJECT] project_id=%s segment_id=%s requested_duration_seconds=%s provider_cap_seconds=%s err=%s",
                    project_id,
                    segment_id,
                    dur,
                    _XAI_PROVIDER_DURATION_CAP_SECONDS,
                    err,
                )
                raise ShortDramaVideoProviderError(err)
            logger.info(
                "[XAI_REFERENCE_IMAGE_URLS] project_id=%s segment_id=%s urls=%s",
                project_id,
                segment_id,
                [u for u in (reference_image_urls or []) if (u or "").strip()],
            )
            return self._client.start_video_generation(
                model=model,
                prompt=prompt,
                reference_image_urls=reference_image_urls,
                duration=duration_seconds,
                aspect_ratio=aspect_ratio,
                resolution=resolution,
                project_id=project_id,
                segment_id=segment_id,
            )
        except ShortDramaVideoProviderError as e:
            logger.error(
                "[XAI_GENERATION_START_FAIL] project_id=%s segment_id=%s exception_class=%s err=%s",
                project_id,
                segment_id,
                type(e).__name__,
                str(e),
            )
            raise
        except Exception as e:
            logger.error(
                "[XAI_GENERATION_START_FAIL] project_id=%s segment_id=%s exception_class=%s err=%s",
                project_id,
                segment_id,
                type(e).__name__,
                str(e),
            )
            raise ShortDramaVideoProviderError(f"XAI video generation failed: {e}") from e

    def complete_segment_video(
        self,
        *,
        request_id: str,
        project_id: int,
        segment_id: str,
        duration_seconds: int = 6,
    ) -> SegmentVideoResult:
        try:
            _ = duration_seconds
            model = effective_xai_video_model()
            final = self._client.poll_video_generation(
                request_id=request_id,
                model=model,
                project_id=project_id,
                segment_id=segment_id,
            )
            logger.info(
                "[XAI_PROVIDER_RAW_RESPONSE] project_id=%s segment_id=%s request_id=%s phase=%s status_code=%s payload_keys=%s payload_preview=%s",
                project_id,
                segment_id,
                request_id,
                "pre_download_metadata",
                "",
                list(final.keys())[:20] if isinstance(final, dict) else [],
                (str(final)[:1000] + "…") if len(str(final)) > 1000 else str(final),
            )
            video = final.get("video") or {}
            vurl = video.get("url") if isinstance(video, dict) else None
            if not vurl:
                raise ShortDramaVideoProviderError(f"xAI video result missing video.url: {final!r}")
            data = self._client.download_video_bytes(
                video_url=vurl, project_id=project_id, segment_id=segment_id, request_id=request_id
            )
            meta = {
                "provider": "xai",
                "model": model,
                "request_id": request_id,
                "raw_status_payload_keys": list(final.keys()),
            }
            return SegmentVideoResult(
                video_bytes=data,
                provider_video_url=vurl,
                provider_metadata=meta,
            )
        except ShortDramaVideoProviderError:
            raise
        except Exception as e:
            raise ShortDramaVideoProviderError(f"XAI video generation failed: {e}") from e


class MockXAIVideoProvider:
    """Dev mock: MP4 bytes only from ffmpeg (testsrc + libx264). No pseudo-MP4 if ffmpeg missing or fails."""

    def submit_reference_segment_video(
        self,
        *,
        prompt: str,
        reference_image_urls: list[str],
        duration_seconds: int,
        aspect_ratio: str,
        resolution: str | None,
        project_id: int,
        segment_id: str,
    ) -> str:
        _ = (prompt, reference_image_urls, aspect_ratio, resolution, duration_seconds)
        log_ai_request(
            logger,
            "mock_video",
            "mock",
            project_id=project_id,
            segment_id=segment_id,
            phase="submit_reference_segment_video",
            prompt_len=len(prompt or ""),
            reference_image_count=len(reference_image_urls or []),
        )
        log_ai_response(
            logger,
            "mock_video",
            "mock",
            project_id=project_id,
            segment_id=segment_id,
            phase="submit_reference_segment_video",
            request_id="mock",
        )
        return "mock"

    def complete_segment_video(
        self,
        *,
        request_id: str,
        project_id: int,
        segment_id: str,
        duration_seconds: int = 6,
    ) -> SegmentVideoResult:
        _ = request_id
        dur = max(1, min(10, int(duration_seconds)))
        return self._produce_bytes(project_id=project_id, segment_id=segment_id, duration_seconds=dur)

    def generate_segment_video(
        self,
        *,
        prompt: str,
        reference_image_urls: list[str],
        duration_seconds: int,
        aspect_ratio: str,
        resolution: str | None,
        project_id: int,
        segment_id: str,
    ) -> SegmentVideoResult:
        self.submit_reference_segment_video(
            prompt=prompt,
            reference_image_urls=reference_image_urls,
            duration_seconds=duration_seconds,
            aspect_ratio=aspect_ratio,
            resolution=resolution,
            project_id=project_id,
            segment_id=segment_id,
        )
        return self.complete_segment_video(
            request_id="mock",
            project_id=project_id,
            segment_id=segment_id,
            duration_seconds=duration_seconds,
        )

    def _produce_bytes(self, *, project_id: int, segment_id: str, duration_seconds: int) -> SegmentVideoResult:
        dur = max(1, min(10, int(duration_seconds)))
        t0 = time.perf_counter()
        ffmpeg_exe = Path(MOCK_FFMPEG_BIN)

        if not ffmpeg_exe.is_file():
            log_ai_error(
                logger,
                "mock_video",
                "mock-ffmpeg",
                f"ffmpeg missing at {MOCK_FFMPEG_BIN} (embedded fallback disabled)",
                project_id=project_id,
            )
            raise ShortDramaVideoProviderError(
                f"Mock video requires ffmpeg at {MOCK_FFMPEG_BIN}; binary not found. "
                "Install ffmpeg or disable SHORT_DRAMA_USE_MOCK_VIDEO_PROVIDER."
            )

        fd, tmp_name = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        out_path = Path(tmp_name)
        try:
            try:
                proc = subprocess.run(
                    [
                        str(ffmpeg_exe),
                        "-y",
                        "-f",
                        "lavfi",
                        "-i",
                        f"testsrc=duration={dur}:size=320x240:rate=24",
                        "-c:v",
                        "libx264",
                        "-pix_fmt",
                        "yuv420p",
                        "-movflags",
                        "+faststart",
                        str(out_path),
                    ],
                    capture_output=True,
                    timeout=60,
                )
            except FileNotFoundError as e:
                log_ai_error(logger, "mock_video", "mock-ffmpeg", f"ffmpeg_skip: {e}", project_id=project_id)
                raise ShortDramaVideoProviderError(
                    f"Mock video could not execute ffmpeg at {MOCK_FFMPEG_BIN}: {e}"
                ) from e
            except subprocess.TimeoutExpired as e:
                log_ai_error(logger, "mock_video", "mock-ffmpeg", f"ffmpeg_timeout: {e}", project_id=project_id)
                raise ShortDramaVideoProviderError("Mock ffmpeg timed out generating segment video") from e
            except OSError as e:
                log_ai_error(logger, "mock_video", "mock-ffmpeg", f"ffmpeg_oserror: {e}", project_id=project_id)
                raise ShortDramaVideoProviderError(f"Mock ffmpeg failed: {e}") from e

            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            if proc.returncode != 0:
                stderr = (proc.stderr or b"").decode("utf-8", errors="replace").strip()
                if len(stderr) > 2000:
                    stderr = stderr[:2000] + "…"
                log_ai_error(
                    logger,
                    "mock_video",
                    "mock-ffmpeg",
                    f"ffmpeg_exit={proc.returncode} stderr={stderr or '(empty)'}",
                    project_id=project_id,
                )
                raise ShortDramaVideoProviderError(
                    f"Mock ffmpeg failed (exit {proc.returncode}): {stderr or 'unknown error'}"
                )

            try:
                video_bytes = out_path.read_bytes()
            except OSError as e:
                raise ShortDramaVideoProviderError(f"Mock ffmpeg output not readable: {e}") from e
            if not video_bytes:
                raise ShortDramaVideoProviderError("Mock ffmpeg produced empty MP4 file")
        finally:
            try:
                out_path.unlink(missing_ok=True)
            except OSError:
                pass

        log_ai_response(
            logger,
            "mock_video",
            "mock-ffmpeg",
            project_id=project_id,
            segment_id=segment_id,
            phase="complete_segment_video",
            video_bytes=len(video_bytes),
            duration_ms=elapsed_ms,
            video_url="",
        )
        return SegmentVideoResult(
            video_bytes=video_bytes,
            provider_video_url=None,
            provider_metadata={
                "provider": "mock",
                "model": "mock-ffmpeg",
                "request_id": "mock",
                "duration_seconds": dur,
            },
        )


def build_xai_video_provider() -> SegmentVideoProvider:
    if settings.SHORT_DRAMA_USE_MOCK_VIDEO_PROVIDER:
        logger.warning("[VIDEO_PROVIDER] MOCK provider ENABLED")
        return MockXAIVideoProvider()
    logger.info("[VIDEO_PROVIDER] REAL XAI provider ENABLED")
    return XAIVideoProvider()
