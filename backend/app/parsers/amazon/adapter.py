from typing import Any, Dict, List

from ...services.scrape_do_service import ScrapeDoService


class AmazonScrapeDoAdapter:
    """
    Adapter for Amazon raw fetch.
    Wraps existing ScrapeDoService and exposes parser-friendly raw payload.
    """

    async def fetch_raw_product(self, url: str) -> Dict[str, Any]:
        service = ScrapeDoService()
        parse_result = await service.scrape_and_parse(url)
        structured = parse_result.get("structured_data", {}) or {}

        return {
            "platform": "amazon",
            "url": url,
            "product_id": self._extract_product_id(url),
            "title": structured.get("title", "未提取到标题"),
            "brand": structured.get("brand", "N/A"),
            "price": structured.get("price", "N/A"),
            "original_price": structured.get("original_price", "N/A"),
            "rating": structured.get("rating", 0.0),
            "review_count": structured.get("review_count", 0),
            "description": structured.get("description", ""),
            "bullet_points": structured.get("bullet_points", []) or [],
            "raw_images": structured.get("images", []) or [],
            "raw_reviews": structured.get("reviews", []) or [],
            "seller": structured.get("seller", ""),
            "raw_data": parse_result,
        }

    @staticmethod
    def _extract_product_id(url: str) -> str:
        import re

        if not isinstance(url, str):
            return ""
        match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", url, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        return ""

