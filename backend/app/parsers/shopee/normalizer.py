import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class ShopeeNormalizer:
    """Normalize Shopee extracted payload to ParsedProduct shape."""

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
        logger.info("[PRICE_FLOW] normalizer_input_price=%s", raw_product.get("price", "N/A"))
        curr_raw = raw_product.get("currency")
        if curr_raw in (None, ""):
            curr_norm = self._infer_currency(raw_product.get("price", "")) or ""
        else:
            curr_norm = str(curr_raw).strip()
        if not curr_norm:
            curr_norm = "SGD"

        rating_raw = raw_product.get("rating")
        if rating_raw is None:
            parsed_rating = 0.0
        else:
            try:
                parsed_rating = float(rating_raw)
            except (TypeError, ValueError):
                parsed_rating = 0.0

        rc_raw = raw_product.get("review_count")
        if rc_raw is None:
            parsed_review_count = 0
        else:
            try:
                parsed_review_count = int(rc_raw)
            except (TypeError, ValueError):
                try:
                    parsed_review_count = int(float(rc_raw))
                except (TypeError, ValueError):
                    parsed_review_count = 0

        parsed = {
            "platform": "shopee",
            "url": url,
            "product_id": raw_product.get("product_id", ""),
            "title": raw_product.get("title", "未提取到标题"),
            "brand": raw_product.get("brand", "N/A"),
            "price": raw_product.get("price", "N/A"),
            "currency": curr_norm,
            "rating": parsed_rating,
            "review_count": parsed_review_count,
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
            "original_price": raw_product.get("original_price", "N/A"),
        }
        logger.info(
            "[EcomStruct][ShopeeNormalizer] title=%s price=%s main_image=%s clean_images_count=%d clean_reviews_count=%d",
            parsed.get("title", ""),
            parsed.get("price", ""),
            parsed.get("main_image", ""),
            len(parsed.get("clean_images", []) or []),
            len(parsed.get("clean_reviews", []) or []),
        )
        return parsed

    @staticmethod
    def _infer_currency(price: Any) -> str:
        p = str(price or "")
        if "S$" in p or "SGD" in p:
            return "SGD"
        if "$" in p:
            return "USD"
        return ""

