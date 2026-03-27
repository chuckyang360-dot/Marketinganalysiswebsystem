from typing import Any, Dict
import logging

from .amazon_parser import AmazonParser

logger = logging.getLogger(__name__)


class UnsupportedPlatformError(ValueError):
    """Raised when no parser is available for the given platform."""


class ParserRouter:
    """Route by platform and delegate to dedicated parser."""

    def __init__(self) -> None:
        self.amazon_parser = AmazonParser()

    async def parse(self, platform: str, url: str) -> Dict[str, Any]:
        if platform == "amazon":
            logger.info("[EcomStruct][ParserRouter] platform=amazon parser=AmazonParser")
            return await self.amazon_parser.parse(url)

        logger.info("[EcomStruct][ParserRouter] platform=%s parser=unsupported", platform)
        raise UnsupportedPlatformError(f"Unsupported platform: {platform}")

