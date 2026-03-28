import asyncio
import json
import random
import re
from typing import Any, Dict, Optional, Tuple

import httpx

from ...config import settings


def _html_has_pdp_signals(s: str) -> bool:
    low = s.lower()
    needles = (
        "<html",
        "<script",
        "__moduledata__",
        "pdptrackingdata",
        "schema.org",
        "application/ld+json",
        '"@type"',
        "product",
        "lazada",
    )
    return any(n in low for n in needles)


def _extract_balanced_json_object(s: str, start: int) -> Optional[str]:
    """从 start（须为 '{'）起截取平衡 JSON 对象字符串。"""
    if start < 0 or start >= len(s) or s[start] != "{":
        return None
    depth = 0
    in_str = False
    esc = False
    q: Optional[str] = None
    for i in range(start, len(s)):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == q:
                in_str = False
                q = None
            continue
        if c in '"\'':
            in_str = True
            q = c
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[start : i + 1]
    return None


def _is_lazada_detail_api_envelope(obj: Any) -> bool:
    if not isinstance(obj, dict):
        return False
    data = obj.get("data")
    if not isinstance(data, dict) or "module" not in data:
        return False
    mod = data.get("module")
    if isinstance(mod, str):
        return "skuInfos" in mod or "product" in mod
    if isinstance(mod, dict):
        return "skuInfos" in mod or "product" in mod
    return False


def extract_detail_api_json_from_html(html: str) -> Optional[Dict[str, Any]]:
    """
    从 PDP HTML 内嵌脚本中解析 mtop.global.detail.web.getdetailinfo 类响应 JSON。
    不发起额外 HTTP 请求。
    """
    if not isinstance(html, str) or len(html) < 400:
        return None
    if "module" not in html or "skuInfos" not in html:
        return None
    for m in re.finditer(
        r"<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)</script>",
        html,
        re.IGNORECASE,
    ):
        chunk = m.group(1) or ""
        if len(chunk) < 300:
            continue
        pos = 0
        while True:
            j = chunk.find("{", pos)
            if j == -1:
                break
            blob = _extract_balanced_json_object(chunk, j)
            if blob and len(blob) > 80:
                try:
                    obj = json.loads(blob)
                except json.JSONDecodeError:
                    pos = j + 1
                    continue
                if _is_lazada_detail_api_envelope(obj):
                    return obj
            pos = j + 1
    return None


def _validate_fetched_body(body: Any) -> Tuple[bool, str]:
    """返回 (是否可用, 失败原因码)。"""
    if body is None:
        return False, "none"
    if not isinstance(body, str):
        return False, "not_str"
    s = body.strip()
    if len(s) == 0:
        return False, "empty_html"
    if len(s) < 200:
        return False, "too_short"
    if not _html_has_pdp_signals(s):
        return False, "no_html_signals"
    return True, "ok"


class BrightDataLazadaAdapter:
    """Bright Data Unblocker：仅拉取 Lazada PDP HTML，不调 Lazada 内部 API。"""

    def __init__(self) -> None:
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.customer_id = settings.BRIGHTDATA_CUSTOMER_ID
        self.zone = settings.BRIGHTDATA_LAZADA_ZONE or settings.BRIGHTDATA_ZONE
        self.timeout_seconds = float(settings.BRIGHTDATA_TIMEOUT_SECONDS or 120)
        self.max_retries = int(settings.BRIGHTDATA_MAX_RETRIES or 2)
        self.max_polls = int(settings.BRIGHTDATA_MAX_POLLS or 25)
        self.poll_interval = float(settings.BRIGHTDATA_POLL_INTERVAL_SECONDS or 3.0)
        self.req_endpoint = "https://api.brightdata.com/unblocker/req"
        self.result_endpoint = "https://api.brightdata.com/unblocker/get_result"

    async def _brightdata_fetch_body(self, url: str, *, country: str = "SG") -> str:
        if not self.api_key:
            raise ValueError("BRIGHTDATA_API_KEY 未配置")
        if not self.zone:
            raise ValueError("BRIGHTDATA_LAZADA_ZONE 与 BRIGHTDATA_ZONE 均未配置")

        payload: Dict[str, Any] = {
            "zone": self.zone,
            "url": url,
            "country": country,
            "render": True,
            "headless": False,
            "premium": True,
            "stealth": True,
            "headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-SG,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        }

        bd_headers: Dict[str, str] = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.customer_id:
            bd_headers["x-customer-id"] = self.customer_id

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

    async def fetch_raw_product(self, url: str) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        返回 (html, detail_api_json)。
        detail_api_json 从 HTML 内嵌的 getdetailinfo 响应解析，不重复请求。
        """
        last_reason = "unknown"
        last_len = 0
        for i in range(3):
            raw = await self._brightdata_fetch_body(url, country="SG")
            last_len = len(raw) if isinstance(raw, str) else 0
            ok, reason = _validate_fetched_body(raw)
            if ok:
                detail_api_json: Optional[Dict[str, Any]] = None
                try:
                    detail_api_json = extract_detail_api_json_from_html(raw)
                except Exception:
                    detail_api_json = None
                return raw, detail_api_json
            last_reason = reason
            if i < 2:
                await asyncio.sleep(1.0 + random.random())
        raise RuntimeError(
            f"Lazada HTML 抓取无效: {last_reason} (final_length={last_len})"
        )
