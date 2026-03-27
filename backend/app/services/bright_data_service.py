import asyncio
import logging
import random
from typing import Any, Dict

import httpx

from ..config import settings

logger = logging.getLogger(__name__)


class BrightDataService:
    """Bright Data Web Unlocker client."""

    def __init__(self) -> None:
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.req_endpoint = "https://api.brightdata.com/unblocker/req"
        self.result_endpoint = "https://api.brightdata.com/unblocker/get_result"
        self.zone = settings.BRIGHTDATA_ZONE
        self.timeout = float(settings.BRIGHTDATA_TIMEOUT_SECONDS or 120)
        self.max_retries = int(settings.BRIGHTDATA_MAX_RETRIES or 2)  # 请求 req 的重试次数
        self.max_polls = 25
        self.last_req_status_code: int | None = None
        self.last_response_id: str | None = None

    async def fetch_html(self, url: str, platform: str) -> str:
        if not self.api_key:
            raise ValueError("BRIGHTDATA_API_KEY 未配置")

        self.last_req_status_code = None
        self.last_response_id = None
        empty_html = "<html><body></body></html>"

        country = "SG" if ".sg" in (url or "").lower() else ""
        payload: Dict[str, Any] = {
            "zone": self.zone,
            "url": url,
            "country": country,
            "headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-SG,en;q=0.9",
            },
            "render": True,
            "headless": False,
            "premium": True,
            "stealth": True,
            "block_resources": ["image", "font", "media", "stylesheet"],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    # Step 1: submit request and get response id
                    req_resp = await client.post(self.req_endpoint, headers=headers, json=payload)
                    self.last_req_status_code = req_resp.status_code
                    if req_resp.status_code >= 400:
                        body_preview = (req_resp.text or "")[:500]
                        logger.warning(
                            "[BrightDataService] req failed platform=%s status=%s url=%s body=%s",
                            platform,
                            req_resp.status_code,
                            url,
                            body_preview,
                        )
                        if req_resp.status_code == 400:
                            return empty_html
                        req_resp.raise_for_status()

                    response_id = (
                        req_resp.headers.get("x-response-id")
                        or req_resp.headers.get("X-Response-Id")
                        or req_resp.headers.get("response-id")
                    )
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
                        logger.warning("[BrightDataService] Empty or failed response from Bright Data for %s", url)
                        return empty_html
                    self.last_response_id = response_id

                    # Step 2: polling get_result
                    last_body = ""
                    for poll_idx in range(self.max_polls):
                        try:
                            result_resp = await client.get(
                                self.result_endpoint,
                                headers={"Authorization": f"Bearer {self.api_key}"},
                                params={"response_id": response_id},
                            )
                            if result_resp.status_code == 202:
                                logger.info(
                                    "[BrightDataService] get_result pending poll=%s response_id=%s",
                                    poll_idx + 1,
                                    response_id,
                                )
                            elif result_resp.status_code >= 400:
                                logger.warning(
                                    "[BrightDataService] get_result failed poll=%s status=%s response_id=%s",
                                    poll_idx + 1,
                                    result_resp.status_code,
                                    response_id,
                                )
                            else:
                                body = result_resp.text or ""
                                last_body = body or last_body
                                logger.info(
                                    "[BrightDataService] Received html_length=%d from Bright Data for %s",
                                    len(body),
                                    url,
                                )
                                if body.strip():
                                    return body
                        except Exception as poll_err:
                            logger.warning(
                                "[BrightDataService] poll error poll=%s response_id=%s err=%s",
                                poll_idx + 1,
                                response_id,
                                poll_err,
                            )

                        await asyncio.sleep(random.uniform(3.0, 5.0))

                    final_body = last_body or empty_html
                    if len(final_body or "") < 1000:
                        logger.warning(
                            "[BrightDataService] Final html too short (length=%d) for %s, Shopee parser may fail",
                            len(final_body or ""),
                            url,
                        )
                    return final_body
            except Exception as e:
                last_error = e
                logger.warning(
                    "[BrightDataService] fetch failed platform=%s attempt=%s err=%s",
                    platform,
                    attempt + 1,
                    e,
                )
                if attempt >= self.max_retries:
                    break
                await asyncio.sleep(1.5)

        logger.warning("[BrightDataService] Empty or failed response from Bright Data for %s", url)
        if len(empty_html) < 1000:
            logger.warning(
                "[BrightDataService] Final html too short (length=%d) for %s, Shopee parser may fail",
                len(empty_html),
                url,
            )
        return empty_html
