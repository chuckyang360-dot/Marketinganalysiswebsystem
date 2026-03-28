import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional, Tuple

import httpx

from ...config import settings

logger = logging.getLogger(__name__)

# TikTok Shop 旧版 GET page_data（已确认多返回 url doesn't match）；仅作可选探测与调试日志
_DEFAULT_PAGE_DATA_TEMPLATES = (
    "https://www.tiktok.com/api/shop/pdp/page_data?product_id={product_id}&locale=en-US",
    "https://www.tiktok.com/api/shop/v1/pdp/page_data?product_id={product_id}&locale=en-US",
)

_PREVIEW_LEN = 500

_TIKTOK_ORIGIN = "https://www.tiktok.com"


def _extract_product_id_from_pdp_url(url: str) -> Optional[str]:
    """从 /shop/.../pdp/... 路径提取商品数字 id（常见为长数字）。"""
    if not url:
        return None
    m = re.search(r"/pdp/(?:[^/?#]+/)?(\d{8,})", url, re.I)
    if m:
        return m.group(1)
    m = re.search(r"/pdp/(\d+)(?:[/?#]|$)", url, re.I)
    if m:
        return m.group(1)
    return None


def _balanced_json_from(html: str, start_brace: int) -> Optional[str]:
    if start_brace < 0 or start_brace >= len(html):
        return None
    depth = 0
    in_str = False
    esc = False
    quote = ""
    for i in range(start_brace, len(html)):
        c = html[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                in_str = False
                quote = ""
            continue
        if c in ('"', "'"):
            in_str = True
            quote = c
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return html[start_brace : i + 1]
    return None


def _looks_like_page_data(obj: Any) -> bool:
    if not isinstance(obj, dict):
        return False
    data = obj.get("data")
    if isinstance(data, dict):
        if any(k in data for k in ("components", "component_list", "page_data")):
            return True
        if "component" in str(data.keys()).lower():
            return True
    if "components" in obj:
        return True
    return False


def _body_indicates_url_doesnt_match(body: str) -> bool:
    """服务端模板接口返回的无效提示（与真实 pdp_desktop POST 无关）。"""
    if not body:
        return False
    low = body.lower()
    if "url doesn't match" in low or "url does not match" in low:
        return True
    try:
        obj = json.loads(body)
        if isinstance(obj, dict):
            msg = str(obj.get("status_msg") or obj.get("message") or "").lower()
            if "doesn't match" in msg or "does not match" in msg:
                return True
    except json.JSONDecodeError:
        pass
    return False


def _body_preview_for_log(body: str) -> str:
    """JSON 则 dumps 后截断；否则原文截断。"""
    if body is None:
        return ""
    text = body if isinstance(body, str) else str(body)
    if not text.strip():
        return ""
    try:
        obj = json.loads(text)
        dumped = json.dumps(obj, ensure_ascii=False)
        if len(dumped) <= _PREVIEW_LEN:
            return dumped
        return dumped[:_PREVIEW_LEN] + "…"
    except json.JSONDecodeError:
        if len(text) <= _PREVIEW_LEN:
            return text
        return text[:_PREVIEW_LEN] + "…"


def _byte_length(s: str) -> int:
    return len((s or "").encode("utf-8"))


def _headers_for_page_data_request(pdp_url: str) -> Dict[str, str]:
    """page_data XHR 常见依赖 PDP 上下文；不引入过多无根据 header。"""
    return {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": (pdp_url or "").strip() or _TIKTOK_ORIGIN + "/",
        "Origin": _TIKTOK_ORIGIN,
        "X-Requested-With": "XMLHttpRequest",
    }


def _log_tiktok_page_data_request(api_url: str, merged_headers: Dict[str, str]) -> None:
    """仅记录发往 Bright Data 的目标 URL 与安全请求头（不含密钥）。"""
    keys = (
        "User-Agent",
        "Referer",
        "Origin",
        "Accept",
        "Accept-Language",
        "X-Requested-With",
    )
    safe = {k: merged_headers.get(k, "") for k in keys}
    logger.info("[TikTokPageDataRequest] url=%s headers=%s", api_url, safe)


def _log_tiktok_page_data_raw(api_url: str, body: str) -> None:
    logger.info(
        "[TikTokPageDataRaw] url=%s status_bytes=%d body_preview=%s",
        api_url,
        _byte_length(body),
        _body_preview_for_log(body or ""),
    )


def _extract_page_data_from_html(html: str) -> Optional[Dict[str, Any]]:
    """HTML：从 script / 内嵌 JSON 中尝试抠出与 page_data 同构的 JSON（不做全页 BFS）。"""
    if not html:
        return None
    for m in re.finditer(
        r'<script[^>]*type=["\']application/json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        chunk = (m.group(1) or "").strip()
        if not chunk or "page_data" not in chunk and "components" not in chunk:
            continue
        try:
            obj = json.loads(chunk)
            if _looks_like_page_data(obj):
                return obj
        except json.JSONDecodeError:
            continue
    for m in re.finditer(r'["\']page_data["\']\s*:\s*(\{)', html, re.IGNORECASE):
        blob = _balanced_json_from(html, m.start(1))
        if not blob:
            continue
        try:
            inner = json.loads(blob)
            if isinstance(inner, dict) and "data" in inner and _looks_like_page_data(inner):
                return inner
            wrapped = {"data": inner}
            if _looks_like_page_data(wrapped):
                return wrapped
        except json.JSONDecodeError:
            continue
    return None


class BrightDataTikTokAdapter:
    """TikTok：主链路为 PDP HTML；page_data GET 仅可选探测（日志），真实业务以 HTML/extractor 为准。"""

    def __init__(self) -> None:
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.customer_id = settings.BRIGHTDATA_CUSTOMER_ID
        self.zone = settings.BRIGHTDATA_TIKTOK_ZONE or settings.BRIGHTDATA_ZONE
        self.timeout_seconds = float(settings.BRIGHTDATA_TIMEOUT_SECONDS or 120)
        self.max_retries = int(settings.BRIGHTDATA_MAX_RETRIES or 2)
        self.max_polls = int(settings.BRIGHTDATA_MAX_POLLS or 25)
        self.poll_interval = float(settings.BRIGHTDATA_POLL_INTERVAL_SECONDS or 3.0)
        self.req_endpoint = "https://api.brightdata.com/unblocker/req"
        self.result_endpoint = "https://api.brightdata.com/unblocker/get_result"
        tpl = (settings.TIKTOK_PAGE_DATA_API_TEMPLATE or "").strip()
        self._page_data_templates: Tuple[str, ...] = (
            (tpl,) if tpl else _DEFAULT_PAGE_DATA_TEMPLATES
        )

    async def _brightdata_fetch_body(
        self,
        url: str,
        *,
        country: str = "US",
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("BRIGHTDATA_API_KEY 未配置")
        if not self.zone:
            raise ValueError("BRIGHTDATA_TIKTOK_ZONE 或 BRIGHTDATA_ZONE 未配置")

        request_headers: Dict[str, str] = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "application/json, text/html, */*;q=0.8",
        }
        if extra_headers:
            request_headers.update(extra_headers)

        payload: Dict[str, Any] = {
            "zone": self.zone,
            "url": url,
            "country": country,
            "render": True,
            "headless": False,
            "premium": True,
            "stealth": True,
            "headers": request_headers,
        }

        bd_headers = {
            "Content-Type": "application/json",
        }
        if self.customer_id:
            bd_headers["x-customer-id"] = self.customer_id
        bd_headers["Authorization"] = f"Bearer {self.api_key}"

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    req_resp = await client.post(self.req_endpoint, headers=bd_headers, json=payload)
                    req_resp.raise_for_status()
                    response_id = (
                        req_resp.headers.get("x-response-id")
                        or req_resp.headers.get("X-Response-Id")
                        or req_resp.headers.get("response-id")
                        or ""
                    ).strip()
                    if not response_id:
                        try:
                            body_json = req_resp.json()
                            response_id = str(
                                body_json.get("response_id")
                                or body_json.get("request_id")
                                or body_json.get("id")
                                or ""
                            ).strip()
                        except Exception:
                            response_id = ""
                    if not response_id:
                        raise ValueError("Bright Data response_id 为空")

                    poll_headers = {"Authorization": f"Bearer {self.api_key}"}
                    for _poll in range(self.max_polls):
                        result_resp = await client.get(
                            self.result_endpoint,
                            headers=poll_headers,
                            params={"response_id": response_id},
                        )
                        status_code = result_resp.status_code
                        if status_code == 202:
                            await asyncio.sleep(self.poll_interval)
                            continue
                        if status_code >= 400:
                            result_resp.raise_for_status()
                        return (result_resp.text or "") or ""

                    return ""
            except Exception as e:
                last_error = e
                if attempt >= self.max_retries:
                    break
                await asyncio.sleep(1.0)

        raise RuntimeError(f"Bright Data 请求失败: {last_error}")

    async def fetch_raw_product(self, url: str) -> Dict[str, Any]:
        """
        主链路：拉取 PDP HTML；page_data 字段仅在有内嵌 JSON 或极少数有效 GET 时填充。
        真实 TikTok page_data 多为内部 POST，GET 模板通常返回 url doesn't match。
        """
        out: Dict[str, Any] = {"page_data": None, "html": None, "pdp_url": url}
        pdp_url = (url or "").strip()

        logger.info("[EcomStruct][TikTokAdapter] html_fetch_started url=%s", pdp_url)
        html = await self._brightdata_fetch_body(pdp_url, country="US", extra_headers=None)
        out["html"] = html or ""

        embedded = _extract_page_data_from_html(html or "")
        if embedded:
            out["page_data"] = embedded
            logger.info(
                "[EcomStruct][TikTokAdapter] page_data_from_embedded_html bytes=%d",
                len(json.dumps(embedded, ensure_ascii=False).encode("utf-8")),
            )

        pid = _extract_product_id_from_pdp_url(pdp_url)
        if pid:
            page_data_headers = _headers_for_page_data_request(pdp_url)
            for tpl in self._page_data_templates:
                api_url = tpl.format(product_id=pid)
                logger.info(
                    "[EcomStruct][TikTokAdapter] page_data_optional_try url=%s",
                    api_url,
                )
                _log_tiktok_page_data_request(api_url, page_data_headers)
                try:
                    body = await self._brightdata_fetch_body(
                        api_url,
                        country="US",
                        extra_headers=page_data_headers,
                    )
                    _log_tiktok_page_data_raw(api_url, body or "")
                    b = body.encode("utf-8") if body else b""
                    logger.info(
                        "[EcomStruct][TikTokAdapter] page_data_optional_response bytes=%d",
                        len(b),
                    )
                    if _body_indicates_url_doesnt_match(body or ""):
                        logger.info(
                            "[EcomStruct][TikTokAdapter] page_data_invalid "
                            "reason=url_doesnt_match (ignored, html_is_primary)",
                        )
                        continue
                    try:
                        obj = json.loads(body)
                    except json.JSONDecodeError as e:
                        logger.info(
                            "[EcomStruct][TikTokAdapter] page_data_optional_failed reason=json_decode: %s",
                            e,
                        )
                        continue
                    if isinstance(obj, dict) and _looks_like_page_data(obj):
                        if out["page_data"] is None:
                            out["page_data"] = obj
                            logger.info(
                                "[EcomStruct][TikTokAdapter] page_data_from_optional_get accepted",
                            )
                        else:
                            logger.info(
                                "[EcomStruct][TikTokAdapter] page_data_optional_valid_but_embedded_preferred",
                            )
                    else:
                        logger.info(
                            "[EcomStruct][TikTokAdapter] page_data_optional_failed "
                            "reason=not_page_data_shape",
                        )
                except Exception as e:
                    logger.info(
                        "[EcomStruct][TikTokAdapter] page_data_optional_failed reason=%s",
                        e,
                    )

        if not out["page_data"]:
            logger.info(
                "[EcomStruct][TikTokAdapter] no_structured_page_data html_bytes=%d "
                "(extractor will use html multi-entry)",
                len((out["html"] or "").encode("utf-8")),
            )
        return out
