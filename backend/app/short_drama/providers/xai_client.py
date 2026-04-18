from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from ...config import settings
from ..exceptions import ShortDramaProviderError
from ..utils.flow_logging import (
    ai_log_extra_from_context,
    log_ai_error,
    log_ai_request,
    log_ai_response,
    summarize_xai_responses_json,
)

logger = logging.getLogger(__name__)


def effective_xai_base_url() -> str:
    base = settings.XAI_BASE_URL or settings.XAI_API_URL
    return base.rstrip("/")


_DEFAULT_XAI_TEXT_MODEL = "grok-4.1-fast-non-reasoning"


def effective_xai_text_model() -> str:
    """Single source of truth: XAI_TEXT_MODEL → XAI_MODEL → default (non-reasoning fast)."""
    return settings.XAI_TEXT_MODEL or settings.XAI_MODEL or _DEFAULT_XAI_TEXT_MODEL


def _truncate(s: str, max_len: int = 500) -> str:
    s = s or ""
    if len(s) <= max_len:
        return s
    return s[:max_len] + "…"


def extract_assistant_text(response_json: dict[str, Any]) -> str:
    """Parse xAI Responses API (and a few fallbacks) into assistant text."""
    parts: list[str] = []

    out = response_json.get("output")
    if isinstance(out, list):
        for item in out:
            if not isinstance(item, dict):
                continue
            if item.get("type") == "message" or item.get("role") == "assistant":
                content = item.get("content")
                if isinstance(content, str):
                    parts.append(content)
                elif isinstance(content, list):
                    for block in content:
                        if not isinstance(block, dict):
                            continue
                        btype = block.get("type")
                        if btype in ("output_text", "text", "input_text"):
                            t = block.get("text")
                            if isinstance(t, str):
                                parts.append(t)
                        elif "text" in block and isinstance(block["text"], str):
                            parts.append(block["text"])

    if parts:
        return "\n".join(parts).strip()

    # Some payloads may expose a top-level text field
    if isinstance(response_json.get("output_text"), str):
        return response_json["output_text"].strip()

    # Chat-completions style fallback
    choices = response_json.get("choices")
    if isinstance(choices, list) and choices:
        msg = choices[0].get("message") or {}
        c = msg.get("content")
        if isinstance(c, str):
            return c.strip()

    return ""


class XAIClient:
    """Thin synchronous HTTP client for POST /v1/responses."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
    ):
        self._api_key = api_key if api_key is not None else settings.XAI_API_KEY
        self._base_url = (base_url or effective_xai_base_url()).rstrip("/")
        self._timeout = float(timeout_seconds if timeout_seconds is not None else settings.XAI_TIMEOUT_SECONDS)

    def post_responses(
        self,
        *,
        model: str,
        system_prompt: str,
        user_content: str | list[dict[str, Any]],
        store: bool = False,
        max_output_tokens: int = 8192,
        log_context: dict[str, Any],
    ) -> tuple[dict[str, Any], str, int]:
        """
        Returns (response_json, request_id, latency_ms).
        """
        if not self._api_key:
            raise ShortDramaProviderError("XAI_API_KEY is not configured")

        url = f"{self._base_url}/responses"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        user_message: dict[str, Any]
        if isinstance(user_content, list):
            user_message = {"role": "user", "content": user_content}
        else:
            user_message = {"role": "user", "content": user_content}

        body: dict[str, Any] = {
            "model": model,
            "input": [
                {"role": "system", "content": system_prompt},
                user_message,
            ],
            "store": store,
            "max_output_tokens": max_output_tokens,
        }

        prov = str(log_context.get("provider") or "grok")
        ukind = "parts" if isinstance(user_content, list) else "text"
        ulen = (
            sum(len(str(p)) for p in user_content)
            if isinstance(user_content, list)
            else len(user_content)
        )
        extra_ctx = ai_log_extra_from_context(log_context)
        log_ai_request(
            logger,
            provider=prov,
            model=model,
            **extra_ctx,
            system_prompt_len=len(system_prompt),
            user_content_kind=ukind,
            user_content_len=ulen,
            max_output_tokens=max_output_tokens,
        )

        t0 = time.perf_counter()
        last_err: Exception | None = None
        max_retries = max(0, int(settings.XAI_MAX_RETRIES))

        for attempt in range(max_retries + 1):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    resp = client.post(url, headers=headers, json=body)
                latency_ms = int((time.perf_counter() - t0) * 1000)
                req_id = resp.headers.get("x-request-id") or resp.headers.get("request-id")

                log_payload = {
                    **log_context,
                    "http_status": resp.status_code,
                    "latency_ms": latency_ms,
                    "attempt": attempt,
                    "request_id": req_id,
                    "model": model,
                    "system_prompt_len": len(system_prompt),
                    "user_content_kind": ukind,
                    "user_content_len": ulen,
                }
                if resp.status_code != 200:
                    snippet = _truncate(resp.text, 800)
                    log_ai_error(
                        logger,
                        provider=prov,
                        model=model,
                        error=f"HTTP {resp.status_code}",
                        **extra_ctx,
                        attempt=attempt,
                        body_snippet=snippet[:400],
                    )
                    raise ShortDramaProviderError(
                        f"xAI Responses API HTTP {resp.status_code}: {_truncate(resp.text, 400)}"
                    )

                try:
                    data = resp.json()
                except Exception as e:
                    log_ai_error(
                        logger,
                        provider=prov,
                        model=model,
                        error=f"invalid_json: {e}",
                        **extra_ctx,
                        attempt=attempt,
                    )
                    raise ShortDramaProviderError(f"xAI response body is not valid JSON: {e}") from e
                summary = summarize_xai_responses_json(data)
                log_ai_response(
                    logger,
                    provider=prov,
                    model=model,
                    **extra_ctx,
                    latency_ms=latency_ms,
                    attempt=attempt,
                    http_request_id=req_id,
                    response_id=str(data.get("id") or ""),
                    summary=summary,
                )
                return data, str(data.get("id") or req_id or ""), latency_ms

            except ShortDramaProviderError:
                raise
            except httpx.TimeoutException as e:
                last_err = e
                latency_ms = int((time.perf_counter() - t0) * 1000)
                log_ai_error(
                    logger,
                    provider=prov,
                    model=model,
                    error="timeout",
                    **extra_ctx,
                    latency_ms=latency_ms,
                    attempt=attempt,
                )
            except httpx.RequestError as e:
                last_err = e
                latency_ms = int((time.perf_counter() - t0) * 1000)
                log_ai_error(
                    logger,
                    provider=prov,
                    model=model,
                    error=f"network: {e}",
                    **extra_ctx,
                    latency_ms=latency_ms,
                    attempt=attempt,
                )

            if attempt >= max_retries:
                break
            t0 = time.perf_counter()

        log_ai_error(
            logger,
            provider=prov,
            model=model,
            error=f"exhausted_retries: {last_err}",
            **extra_ctx,
        )
        raise ShortDramaProviderError(f"xAI request failed after retries: {last_err}")
