from __future__ import annotations

import json
import logging
import time
from typing import Any

from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..utils.flow_logging import log_ai_error, log_ai_response
from ..utils.json_parser import try_parse_json_object
from ..utils.prompts import JSON_REPAIR_SYSTEM_PROMPT
from .xai_client import XAIClient, effective_xai_text_model, extract_assistant_text

logger = logging.getLogger(__name__)


def _build_user_content_parts(user_text: str, image_urls: list[str] | None) -> str | list[dict[str, Any]]:
    if not image_urls:
        return user_text
    parts: list[dict[str, Any]] = [{"type": "input_text", "text": user_text}]
    for u in image_urls:
        if not u or not str(u).strip():
            continue
        parts.append({"type": "input_image", "image_url": {"url": str(u).strip()}})
    return parts


class XAITextProvider:
    """Calls xAI Responses API and returns a parsed JSON object (no DB)."""

    def __init__(self, client: XAIClient | None = None):
        self._client = client or XAIClient()

    def generate_structured_json(
        self,
        *,
        project_id: int,
        service_name: str,
        system_prompt: str,
        user_payload: dict[str, Any],
        image_urls: list[str] | None = None,
        expected_schema_name: str,
        stage: str,
    ) -> dict[str, Any]:
        model = effective_xai_text_model()
        user_text = json.dumps(user_payload, ensure_ascii=False)
        user_content = _build_user_content_parts(user_text, image_urls)

        t0 = time.perf_counter()
        try:
            raw, request_id, _latency = self._client.post_responses(
                model=model,
                system_prompt=system_prompt,
                user_content=user_content,
                store=False,
                log_context={
                    "project_id": project_id,
                    "service_name": service_name,
                    "stage": stage,
                    "provider": "grok",
                    "model": model,
                },
            )
            text = extract_assistant_text(raw)
            duration_ms = int((time.perf_counter() - t0) * 1000)
            if not text.strip():
                raise ShortDramaInvalidModelOutputError("Empty assistant text from xAI")
            data = self._parse_with_optional_repair(
                text=text,
                project_id=project_id,
                service_name=service_name,
                stage=stage,
                model=model,
                request_id=request_id,
                duration_ms=duration_ms,
                expected_schema_name=expected_schema_name,
            )
            log_ai_response(
                logger,
                "grok",
                model,
                project_id=project_id,
                stage=stage,
                service_name=service_name,
                phase="structured_json_ready",
                top_keys=list(data.keys())[:24],
                duration_ms=int((time.perf_counter() - t0) * 1000),
                request_id=request_id,
            )
            return data
        except ShortDramaProviderError:
            raise
        except ShortDramaInvalidModelOutputError as e:
            duration_ms = int((time.perf_counter() - t0) * 1000)
            log_ai_error(
                logger,
                "grok",
                model,
                str(e),
                project_id=project_id,
                stage=stage,
                service_name=service_name,
                duration_ms=duration_ms,
                error_type=type(e).__name__,
            )
            raise

    def _parse_with_optional_repair(
        self,
        *,
        text: str,
        project_id: int,
        service_name: str,
        stage: str,
        model: str,
        request_id: str,
        duration_ms: int,
        expected_schema_name: str,
    ) -> dict[str, Any]:
        """Original output + up to 2 repair passes (3 model outputs total for JSON text)."""
        parsed = try_parse_json_object(text)
        if parsed is not None and parsed.get("error") != "unrecoverable":
            return parsed

        current = text
        for repair_attempt in (1, 2):
            repair_user = _truncate_for_repair(current)
            raw2, req2, _ = self._client.post_responses(
                model=model,
                system_prompt=JSON_REPAIR_SYSTEM_PROMPT,
                user_content=repair_user,
                store=False,
                max_output_tokens=4096,
                log_context={
                    "project_id": project_id,
                    "service_name": service_name,
                    "stage": f"{stage}_json_repair_{repair_attempt}",
                    "provider": "grok",
                    "model": model,
                    "repair_attempt": repair_attempt,
                    "schema_name": expected_schema_name,
                },
            )
            text2 = extract_assistant_text(raw2)
            current = text2
            parsed = try_parse_json_object(text2)
            if parsed is not None:
                if parsed.get("error") == "unrecoverable":
                    continue
                return parsed

        raise ShortDramaInvalidModelOutputError(
            f"JSON repair exhausted after 2 attempts for {service_name} (schema={expected_schema_name})"
        )


def _truncate_for_repair(text: str, max_chars: int = 24000) -> str:
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n…(truncated)…"


_xai_text_provider_singleton: XAITextProvider | None = None


def get_xai_text_provider() -> XAITextProvider:
    global _xai_text_provider_singleton
    if _xai_text_provider_singleton is None:
        _xai_text_provider_singleton = XAITextProvider()
    return _xai_text_provider_singleton
