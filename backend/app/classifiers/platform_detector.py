from typing import Literal
import logging


PlatformType = Literal["amazon", "shopee", "unsupported"]
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

    logger.info("[EcomStruct][PlatformDetector] platform=unsupported")
    return "unsupported"

