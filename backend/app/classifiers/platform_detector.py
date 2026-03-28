from typing import Literal
import logging
from urllib.parse import urlparse


PlatformType = Literal["amazon", "shopee", "tiktok", "lazada", "unsupported"]
logger = logging.getLogger(__name__)


def detect_platform(url: str) -> PlatformType:
    """Detect platform from URL for ecommerce parsing pipeline."""
    if not isinstance(url, str):
        logger.info("[EcomStruct][PlatformDetector] platform=unsupported reason=non_string_input")
        return "unsupported"

    value = url.strip().lower()
    if not value.startswith(("http://", "https://")):
        logger.info("[EcomStruct][PlatformDetector] platform=unsupported reason=non_http_url")
        return "unsupported"

    if "amazon." in value:
        logger.info("[EcomStruct][PlatformDetector] platform=amazon")
        return "amazon"

    if "shopee.sg" in value:
        logger.info("[EcomStruct][PlatformDetector] platform=shopee")
        return "shopee"

    try:
        parsed = urlparse(value)
        host = (parsed.netloc or "").lower()
        path = (parsed.path or "").lower()
    except Exception:
        host, path = "", ""
    if "lazada." in host and "/products/" in path:
        logger.info("[EcomStruct][PlatformDetector] platform=lazada")
        return "lazada"

    if "tiktok.com/shop" in value:
        logger.info("[EcomStruct][PlatformDetector] platform=tiktok")
        return "tiktok"

    logger.info("[EcomStruct][PlatformDetector] platform=unsupported")
    return "unsupported"

