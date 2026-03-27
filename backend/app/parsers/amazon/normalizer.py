from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)


class AmazonNormalizer:
    """Normalize cleaned amazon payload into ParsedProduct."""

    def normalize(
        self,
        *,
        url: str,
        raw_product: Dict[str, Any],
        clean_images: List[str],
        main_image: str,
        image_selection_reason: str,
        clean_reviews: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        parsed_product = {
            "platform": "amazon",
            "url": url,
            "product_id": raw_product.get("product_id", ""),
            "title": raw_product.get("title", "未提取到标题"),
            "brand": raw_product.get("brand", "N/A"),
            "price": raw_product.get("price", "N/A"),
            "currency": self._infer_currency(raw_product.get("price", "")),
            "rating": raw_product.get("rating", 0.0),
            "review_count": raw_product.get("review_count", 0),
            "main_image": main_image,
            "clean_images": clean_images,
            "raw_images": raw_product.get("raw_images", []) or [],
            "image_selection_reason": image_selection_reason,
            "description": raw_product.get("description", ""),
            "bullet_points": raw_product.get("bullet_points", []) or [],
            "clean_reviews": clean_reviews,
            "raw_reviews": raw_product.get("raw_reviews", []) or [],
            "seller": raw_product.get("seller", ""),
            "raw_data": raw_product.get("raw_data", {}),
            # Compatibility field kept for current response mapping.
            "original_price": raw_product.get("original_price", "N/A"),
        }
        logger.info(
            "[EcomStruct][AmazonNormalizer] title=%s price=%s main_image=%s clean_images_count=%d clean_reviews_count=%d",
            parsed_product.get("title", ""),
            parsed_product.get("price", ""),
            parsed_product.get("main_image", ""),
            len(parsed_product.get("clean_images", []) or []),
            len(parsed_product.get("clean_reviews", []) or []),
        )
        return parsed_product

    @staticmethod
    def _infer_currency(price: Any) -> str:
        text = str(price or "")
        if "$" in text:
            return "USD"
        if "€" in text:
            return "EUR"
        if "£" in text:
            return "GBP"
        if "¥" in text or "￥" in text:
            return "CNY"
        return ""

