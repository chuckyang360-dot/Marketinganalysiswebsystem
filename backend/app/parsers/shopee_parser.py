import logging
from typing import Any, Dict, List

from .shopee.adapter import BrightDataShopeeAdapter
from .shopee.extractor import ShopeeExtractor
from .shopee.image_cleaner import ShopeeImageCleaner
from .shopee.review_cleaner import ShopeeReviewCleaner
from .shopee.normalizer import ShopeeNormalizer

logger = logging.getLogger(__name__)


class ShopeeParser:
    """Shopee parser pipeline: adapter -> extractor -> cleaners -> normalizer."""

    def __init__(self) -> None:
        self.adapter = BrightDataShopeeAdapter()
        self.extractor = ShopeeExtractor()
        self.image_cleaner = ShopeeImageCleaner()
        self.review_cleaner = ShopeeReviewCleaner()
        self.normalizer = ShopeeNormalizer()

    async def parse(self, url: str) -> Dict[str, Any]:
        raw_response = await self.adapter.fetch_raw_product(url)
        extracted = self.extractor.extract(raw_response)

        raw_images = extracted.get("raw_images", []) or []
        clean_images, main_image, image_selection_reason = self.image_cleaner.clean(raw_images)

        raw_reviews: List[Dict[str, Any]] = []
        item_id = str(extracted.get("product_id") or "").strip()
        shop_id = str(extracted.get("shop_id") or "").strip()
        if item_id and shop_id:
            # 当前 Bright Data zone 拒绝 /api/v2/...（non-API URLs only）；不发起无效请求
            logger.info(
                "[SHOPEE_REVIEWS_API] skipped_or_failed reason=brightdata_non_api_only"
            )

        clean_reviews = self.review_cleaner.clean(raw_reviews)

        return self.normalizer.normalize(
            url=url,
            raw_product=extracted,
            clean_images=clean_images,
            main_image=main_image,
            image_selection_reason=image_selection_reason,
            clean_reviews=clean_reviews,
        )
