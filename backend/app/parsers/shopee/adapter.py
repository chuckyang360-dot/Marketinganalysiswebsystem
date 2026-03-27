import asyncio
import logging
from typing import Any, Dict

import httpx

from ...config import settings

logger = logging.getLogger(__name__)


class BrightDataShopeeAdapter:
    """Shopee adapter using Bright Data unblocker async flow."""

    def __init__(self) -> None:
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.customer_id = settings.BRIGHTDATA_CUSTOMER_ID
        self.zone = settings.BRIGHTDATA_SHOPEE_ZONE or settings.BRIGHTDATA_ZONE
        self.timeout_seconds = float(settings.BRIGHTDATA_TIMEOUT_SECONDS or 120)
        self.max_retries = int(settings.BRIGHTDATA_MAX_RETRIES or 2)
        self.max_polls = int(settings.BRIGHTDATA_MAX_POLLS or 25)
        self.poll_interval = float(settings.BRIGHTDATA_POLL_INTERVAL_SECONDS or 3.0)
        self.req_endpoint = "https://api.brightdata.com/unblocker/req"
        self.result_endpoint = "https://api.brightdata.com/unblocker/get_result"

    async def _brightdata_fetch_body(self, url: str, *, country: str = "SG") -> str:
        """通过 Bright Data Unblocker 拉取商品页 HTML（仅非 API URL；见 Shopee 1.0 能力说明）。"""
        if not self.api_key:
            raise ValueError("BRIGHTDATA_API_KEY 未配置")
        if not self.zone:
            raise ValueError("BRIGHTDATA_SHOPEE_ZONE 未配置")

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
                "Accept": "application/json, text/plain, */*",
            },
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.customer_id:
            headers["x-customer-id"] = self.customer_id

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    req_resp = await client.post(self.req_endpoint, headers=headers, json=payload)
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

                    for poll in range(self.max_polls):
                        result_resp = await client.get(
                            self.result_endpoint,
                            headers={"Authorization": f"Bearer {self.api_key}"},
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
        logger.info("[EcomStruct][ShopeeAdapter] request_started url=%s", url)
        html = await self._brightdata_fetch_body(url, country="SG")
        logger.info("[EcomStruct][ShopeeAdapter] html_length=%d", len(html))
        return {
            "html": html or "<html><body></body></html>",
            "status_code": 200,
            "provider": "brightdata",
            "final_url": url,
            "raw_response": {},
        }
