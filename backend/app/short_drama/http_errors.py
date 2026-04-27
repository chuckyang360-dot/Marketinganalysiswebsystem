from fastapi import HTTPException, status

from .exceptions import (
    ShortDramaFFmpegError,
    ShortDramaImageProviderError,
    ShortDramaImageSaveError,
    ShortDramaInvalidModelOutputError,
    ShortDramaMergeError,
    ShortDramaProviderError,
    ShortDramaVideoInputError,
    ShortDramaVideoProviderError,
    ShortDramaVideoSaveError,
)


def raise_short_drama_http(exc: Exception) -> None:
    """Map domain errors to HTTP responses (re-raises FastAPI HTTPException)."""
    raise _to_http_exception(exc)


def _to_http_exception(exc: Exception) -> HTTPException:
    if isinstance(exc, ShortDramaInvalidModelOutputError):
        detail = exc.http_detail()
        user_message = "当前步骤的 AI 输出不完整或格式异常，请检查输入后重试；详细原因已记录在后端日志。"
        if isinstance(detail, dict):
            return HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={**detail, "user_message": user_message},
            )
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": str(detail), "user_message": user_message, "error": "short_drama_invalid_model_output"},
        )
    if isinstance(exc, (ShortDramaImageProviderError, ShortDramaImageSaveError)):
        msg = str(exc)
        if isinstance(exc, ShortDramaImageSaveError):
            return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)
        cat = getattr(exc, "category", None) or "provider"
        if cat == "auth" or "GEMINI_API_KEY" in msg or "XAI_API_KEY" in msg or "not configured" in msg.lower():
            return HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED if cat == "auth" else status.HTTP_400_BAD_REQUEST,
                detail=msg,
            )
        if cat in ("rate_limit", "quota"):
            return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)
        if cat in ("download_failed", "xai_response_invalid"):
            return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)
        if cat == "unsupported":
            return HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=msg)
        if cat == "configuration":
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        if "timeout" in msg.lower():
            return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=msg)
        if "429" in msg or "quota" in msg.lower() or "resource" in msg.lower():
            return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)
    if isinstance(exc, ShortDramaProviderError):
        msg = str(exc)
        low = msg.lower()
        if (
            "http 503" in low
            or "did not respond" in low
            or "service temporarily unavailable" in low
            or "upstream_unavailable" in low
        ):
            return HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "error": "short_drama_provider_unavailable",
                    "user_message": "当前服务繁忙，请稍后重试。",
                },
            )
        if "XAI_API_KEY" in msg or "not configured" in msg.lower():
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        if "timeout" in msg.lower() or "timed out" in msg.lower():
            return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=msg)
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)
    if isinstance(exc, ShortDramaVideoInputError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if isinstance(exc, (ShortDramaVideoProviderError, ShortDramaVideoSaveError)):
        msg = str(exc)
        if "XAI_API_KEY" in msg or "not configured" in msg.lower():
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        if "timeout" in msg.lower() or "timed out" in msg.lower() or "poll" in msg.lower():
            return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=msg)
        if "429" in msg or "quota" in msg.lower():
            return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)
    if isinstance(exc, (ShortDramaMergeError, ShortDramaFFmpegError)):
        msg = str(exc)
        if "ffmpeg" in msg.lower() and ("not found" in msg.lower() or "no such file" in msg.lower()):
            return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=msg)
        if "missing" in msg.lower() or "incomplete" in msg.lower():
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=msg)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=str(exc),
    )
