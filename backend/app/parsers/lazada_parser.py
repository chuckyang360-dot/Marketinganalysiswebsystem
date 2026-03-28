import re
from typing import Any, Dict
from urllib.parse import urlparse

from .lazada.adapter import BrightDataLazadaAdapter
from .lazada.extractor import extract as lazada_extract
from .lazada.normalizer import normalize as lazada_normalize

_LAZADA_HOST_RE = re.compile(
    r"^(?:www\.|m\.)?lazada\.(?:sg|com\.my|co\.th|co\.id|vn|com\.ph)(?::\d+)?$",
    re.IGNORECASE,
)


def is_lazada_pdp_url(url: str) -> bool:
    """
    严格校验：Lazada 商品 PDP。
    需为 lazada 区域主站域名，且 path 含典型商品路径 /products/（避免店铺/活动/搜索误入）。
    """
    if not isinstance(url, str) or not url.strip():
        return False
    try:
        parsed = urlparse(url.strip())
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.netloc or "").split("@")[-1].lower()
    if not host:
        return False
    if _LAZADA_HOST_RE.match(host) is None:
        return False
    path = (parsed.path or "").lower()
    if "/products/" not in path:
        return False
    # 排除明显非单品页（保守）
    if any(x in path for x in ("/search", "/catalog", "/campaign", "/shop/", "/tag/")):
        return False
    return True


class LazadaParser:
    """Lazada：adapter → extractor → normalizer。"""

    def __init__(self) -> None:
        self.adapter = BrightDataLazadaAdapter()

    async def parse(self, url: str) -> Dict[str, Any]:
        if not is_lazada_pdp_url(url):
            raise ValueError(
                "不支持的 Lazada 链接：请使用各区域主站商品页，且路径包含 /products/ "
                "（例如 https://www.lazada.sg/products/...）"
            )
        html, detail_api_json = await self.adapter.fetch_raw_product(url)
        raw = lazada_extract(html, detail_api_json=detail_api_json)
        return lazada_normalize(raw, url)
