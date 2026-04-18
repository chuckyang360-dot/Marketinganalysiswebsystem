"""HTTP client for xAI video REST: POST /v1/videos/generations + GET /v1/videos/{request_id}."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from ...config import settings
from ..exceptions import ShortDramaVideoProviderError
from ..utils.flow_logging import log_ai_error, log_ai_request, log_ai_response

logger = logging.getLogger(__name__)

_DEFAULT_XAI_VIDEO_MODEL = "grok-imagine-video"


def validate_reference_image_urls_for_xai(
    *,
    urls: list[str],
    project_id: int,
    segment_id: str,
) -> None:
    """GET each URL before xAI submit; fail fast if not HTTP 200 image/* (avoids HTML interstitials)."""
    timeout = httpx.Timeout(30.0)
    for raw in urls:
        u = (raw or "").strip()
        if not u:
            continue
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                with client.stream("GET", u) as resp:
                    status = resp.status_code
                    ct = (resp.headers.get("content-type") or "").split(";")[0].strip().lower()
                    cl = resp.headers.get("content-length")
                    final_url = str(resp.url)
                    for _ in resp.iter_bytes(chunk_size=65536):
                        break
        except Exception as e:
            logger.error(
                "[XAI_REFERENCE_IMAGE_INVALID] project_id=%s segment_id=%s url=%s reason=request_error_%s",
                project_id,
                segment_id,
                u,
                e,
            )
            raise ShortDramaVideoProviderError(
                f"Reference image URL could not be fetched (project_id={project_id}, segment_id={segment_id}): {u} ({e})"
            ) from e

        logger.info(
            "[XAI_REFERENCE_IMAGE_CHECK] url=%s status_code=%s content_type=%s content_length=%s final_url=%s",
            u,
            status,
            ct,
            cl,
            final_url,
        )
        if status != 200:
            logger.error(
                "[XAI_REFERENCE_IMAGE_INVALID] project_id=%s segment_id=%s url=%s reason=status_%s",
                project_id,
                segment_id,
                u,
                status,
            )
            raise ShortDramaVideoProviderError(
                f"Reference image URL returned HTTP {status} (project_id={project_id}, segment_id={segment_id}): {u}"
            )
        if not ct.startswith("image/"):
            logger.error(
                "[XAI_REFERENCE_IMAGE_INVALID] project_id=%s segment_id=%s url=%s reason=bad_content_type_%s",
                project_id,
                segment_id,
                u,
                ct or "(empty)",
            )
            raise ShortDramaVideoProviderError(
                f"Reference image URL is not an image (content-type={ct!r}, project_id={project_id}, segment_id={segment_id}): {u}"
            )


def effective_xai_video_model() -> str:
    """Single source of truth for video model name."""
    return settings.XAI_VIDEO_MODEL or _DEFAULT_XAI_VIDEO_MODEL


def effective_xai_video_base_url() -> str:
    return settings.XAI_VIDEO_BASE_URL.rstrip("/")


class XAIVideoClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
    ):
        self._base = (base_url or effective_xai_video_base_url()).rstrip("/")
        self._api_key = api_key if api_key is not None else settings.XAI_API_KEY
        self._timeout = httpx.Timeout(settings.XAI_VIDEO_TIMEOUT_SECONDS)
        self._max_retries = max(0, int(settings.XAI_VIDEO_MAX_RETRIES))

    def _headers(self) -> dict[str, str]:
        if not self._api_key:
            raise ShortDramaVideoProviderError("XAI_API_KEY is not configured")
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def _classify_http_error(self, resp: httpx.Response) -> ShortDramaVideoProviderError:
        body = ""
        try:
            body = resp.text[:2000]
        except Exception:
            pass
        if resp.status_code == 429:
            return ShortDramaVideoProviderError(f"xAI video rate limit / quota (429): {body}")
        if resp.status_code >= 500:
            return ShortDramaVideoProviderError(f"xAI video server error ({resp.status_code}): {body}")
        return ShortDramaVideoProviderError(f"xAI video HTTP {resp.status_code}: {body}")

    def start_video_generation(
        self,
        *,
        model: str,
        prompt: str,
        reference_image_urls: list[str],
        duration: int,
        aspect_ratio: str,
        resolution: str | None,
        project_id: int,
        segment_id: str,
    ) -> str:
        """Submit reference-to-video job; returns request_id."""
        url = f"{self._base}/v1/videos/generations"
        refs = [{"url": u} for u in reference_image_urls if u]
        validate_reference_image_urls_for_xai(
            urls=[u for u in reference_image_urls if (u or "").strip()],
            project_id=project_id,
            segment_id=segment_id,
        )
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "reference_images": refs,
            "duration": int(duration),
            "aspect_ratio": aspect_ratio,
        }
        if resolution:
            payload["resolution"] = resolution

        log_ai_request(
            logger,
            "xai_video",
            model,
            project_id=project_id,
            segment_id=segment_id,
            phase="start_video_generation",
            prompt_len=len(prompt or ""),
            reference_image_count=len(refs),
            duration_seconds=duration,
            aspect_ratio=aspect_ratio,
            resolution=resolution or "",
        )

        logger.info("[XAI_REQUEST] POST /v1/videos/generations model=%s", model)

        last_exc: Exception | None = None
        for attempt in range(self._max_retries + 1):
            t0 = time.perf_counter()
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    resp = client.post(url, headers=self._headers(), json=payload)
                elapsed_ms = int((time.perf_counter() - t0) * 1000)
                if resp.status_code >= 400:
                    err = self._classify_http_error(resp)
                    if resp.status_code >= 500 and attempt < self._max_retries:
                        last_exc = err
                        time.sleep(1.0 + attempt)
                        continue
                    log_ai_error(
                        logger,
                        "xai_video",
                        model,
                        str(err),
                        project_id=project_id,
                        segment_id=segment_id,
                        phase="start_video_generation",
                        duration_ms=elapsed_ms,
                        http_status=resp.status_code,
                    )
                    raise err
                data = resp.json()
                rid = data.get("request_id")
                if not rid:
                    log_ai_error(
                        logger,
                        "xai_video",
                        model,
                        "missing_request_id",
                        project_id=project_id,
                        segment_id=segment_id,
                        response_keys=list(data.keys())[:12] if isinstance(data, dict) else [],
                    )
                    raise ShortDramaVideoProviderError(f"xAI video start missing request_id: {data!r}")
                logger.info("[XAI_RESPONSE] request_id=%s", rid)
                log_ai_response(
                    logger,
                    "xai_video",
                    model,
                    project_id=project_id,
                    segment_id=segment_id,
                    phase="start_video_generation",
                    request_id=str(rid),
                    duration_ms=elapsed_ms,
                )
                return str(rid)
            except httpx.TimeoutException as e:
                last_exc = ShortDramaVideoProviderError(f"xAI video start timeout: {e}")
                if attempt < self._max_retries:
                    time.sleep(1.0 + attempt)
                    continue
                log_ai_error(
                    logger,
                    "xai_video",
                    model,
                    "start_timeout",
                    project_id=project_id,
                    segment_id=segment_id,
                )
                raise last_exc from e
            except httpx.RequestError as e:
                last_exc = ShortDramaVideoProviderError(f"xAI video start network error: {e}")
                if attempt < self._max_retries:
                    time.sleep(1.0 + attempt)
                    continue
                log_ai_error(
                    logger,
                    "xai_video",
                    model,
                    f"start_network: {e}",
                    project_id=project_id,
                    segment_id=segment_id,
                )
                raise last_exc from e
        log_ai_error(logger, "xai_video", model, "start_exhausted_retries", project_id=project_id, segment_id=segment_id)
        raise last_exc or ShortDramaVideoProviderError("xAI video start failed")

    def poll_video_generation(
        self,
        *,
        request_id: str,
        model: str,
        project_id: int,
        segment_id: str,
    ) -> dict[str, Any]:
        """Poll until done / failed / expired / timeout. Returns final JSON body."""
        url = f"{self._base}/v1/videos/{request_id}"
        deadline = time.monotonic() + float(settings.XAI_VIDEO_POLL_TIMEOUT_SECONDS)
        interval_s = max(0.05, float(settings.XAI_VIDEO_POLL_INTERVAL_MS) / 1000.0)
        poll_count = 0
        t0 = time.perf_counter()
        while time.monotonic() < deadline:
            poll_count += 1
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    resp = client.get(url, headers=self._headers())
                if resp.status_code >= 400:
                    raise self._classify_http_error(resp)
                data = resp.json()
            except httpx.TimeoutException as e:
                raise ShortDramaVideoProviderError(f"xAI video poll timeout: {e}") from e
            except httpx.RequestError as e:
                raise ShortDramaVideoProviderError(f"xAI video poll network error: {e}") from e

            status = (data.get("status") or "").lower()
            if status == "done":
                elapsed_ms = int((time.perf_counter() - t0) * 1000)
                video = data.get("video") if isinstance(data.get("video"), dict) else {}
                vurl = video.get("url") if isinstance(video, dict) else None
                log_ai_response(
                    logger,
                    "xai_video",
                    model,
                    project_id=project_id,
                    segment_id=segment_id,
                    phase="poll_video_done",
                    request_id=request_id,
                    duration_ms=elapsed_ms,
                    poll_count=poll_count,
                    video_url=str(vurl) if vurl else "",
                    payload_keys=list(data.keys())[:16],
                )
                return data
            if status in ("failed", "error"):
                log_ai_error(
                    logger,
                    "xai_video",
                    model,
                    "poll_status_failed",
                    project_id=project_id,
                    segment_id=segment_id,
                    request_id=request_id,
                    payload_keys=list(data.keys())[:16] if isinstance(data, dict) else [],
                )
                raise ShortDramaVideoProviderError(f"xAI video generation failed: {data!r}")
            if status == "expired":
                log_ai_error(
                    logger,
                    "xai_video",
                    model,
                    "poll_expired",
                    project_id=project_id,
                    segment_id=segment_id,
                    request_id=request_id,
                )
                raise ShortDramaVideoProviderError(f"xAI video request expired: {request_id}")
            time.sleep(interval_s)

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        log_ai_error(
            logger,
            "xai_video",
            model,
            "poll_timeout",
            project_id=project_id,
            segment_id=segment_id,
            request_id=request_id,
            duration_ms=elapsed_ms,
            poll_count=poll_count,
        )
        raise ShortDramaVideoProviderError(
            f"xAI video poll exceeded {settings.XAI_VIDEO_POLL_TIMEOUT_SECONDS}s (request_id={request_id})"
        )

    def download_video_bytes(self, *, video_url: str, project_id: int, segment_id: str) -> bytes:
        try:
            with httpx.Client(timeout=self._timeout, follow_redirects=True) as client:
                resp = client.get(video_url)
            if resp.status_code >= 400:
                raise ShortDramaVideoProviderError(
                    f"Video download HTTP {resp.status_code} for project_id={project_id} segment_id={segment_id}"
                )
            video_bytes = resp.content
            logger.info("[XAI_DOWNLOAD] video_bytes=%s", len(video_bytes))
            return video_bytes
        except httpx.TimeoutException as e:
            raise ShortDramaVideoProviderError(f"Video download timeout: {e}") from e
        except httpx.RequestError as e:
            raise ShortDramaVideoProviderError(f"Video download network error: {e}") from e
