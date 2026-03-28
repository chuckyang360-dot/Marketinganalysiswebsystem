from typing import Any, Dict
import logging

from .amazon_parser import AmazonParser
from .shopee_parser import ShopeeParser
from .tiktok_parser import TikTokParser
from .lazada_parser import LazadaParser

logger = logging.getLogger(__name__)


class UnsupportedPlatformError(ValueError):
    """Raised when no parser is available for the given platform."""


class ParserRouter:
    """Route by platform and delegate to dedicated parser."""

    def __init__(self) -> None:
        self.amazon_parser = AmazonParser()
        self.shopee_parser = ShopeeParser()
        self.tiktok_parser = TikTokParser()
        self.lazada_parser = LazadaParser()

    async def parse(self, platform: str, url: str) -> Dict[str, Any]:
        if platform == "amazon":
            logger.info("[EcomStruct][ParserRouter] platform=amazon parser=AmazonParser")
            return await self.amazon_parser.parse(url)
        if platform == "shopee":
            logger.info("[EcomStruct][ParserRouter] platform=shopee parser=ShopeeParser")
            return await self.shopee_parser.parse(url)
        if platform == "tiktok":
            logger.info("[EcomStruct][ParserRouter] platform=tiktok parser=TikTokParser")
            return await self.tiktok_parser.parse(url)
        if platform == "lazada":
            logger.info("[EcomStruct][ParserRouter] platform=lazada parser=LazadaParser")
            return await self.lazada_parser.parse(url)

        logger.info("[EcomStruct][ParserRouter] platform=%s parser=unsupported", platform)
        raise UnsupportedPlatformError(f"Unsupported platform: {platform}")

