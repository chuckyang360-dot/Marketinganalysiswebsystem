import logging
from typing import Any, Dict
from urllib.parse import urlparse

from .tiktok.adapter import BrightDataTikTokAdapter
from .tiktok import extractor as tiktok_extractor
from .tiktok import normalizer as tiktok_normalizer

logger = logging.getLogger(__name__)


def is_tiktok_shop_pdp_url(url: str) -> bool:
    """仅支持含 /shop/ 与 /pdp/ 的 TikTok Shop 商品页；排除 view/product、视频页等。"""
    if not isinstance(url, str) or not url.strip():
        return False
    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.netloc or "").lower()
    if not host.endswith("tiktok.com"):
        return False
    path = parsed.path or ""
    pl = path.lower()
    if "/view/product" in pl:
        return False
    if "/video/" in pl:
        return False
    return "/shop/" in pl and "/pdp/" in pl


class TikTokParser:
    """TikTok：adapter → extractor → normalizer（无平台业务逻辑）。"""

    def __init__(self) -> None:
        self.adapter = BrightDataTikTokAdapter()

    async def parse(self, url: str) -> Dict[str, Any]:
        if not is_tiktok_shop_pdp_url(url):
            raise ValueError(
                "不支持的 TikTok 链接：仅支持 https://www.tiktok.com/shop/.../pdp/... 商品页"
            )
        payload = await self.adapter.fetch_raw_product(url)
        raw = tiktok_extractor.extract(payload)
        return tiktok_normalizer.normalize(raw, url)
