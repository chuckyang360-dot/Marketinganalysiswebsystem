from typing import Any, Dict
import logging

from .amazon.adapter import AmazonScrapeDoAdapter
from .amazon.image_cleaner import AmazonImageCleaner
from .amazon.review_cleaner import AmazonReviewCleaner
from .amazon.normalizer import AmazonNormalizer

logger = logging.getLogger(__name__)


class AmazonParser:
    """Amazon parser pipeline: adapter -> cleaners -> normalizer."""

    def __init__(self) -> None:
        self.adapter = AmazonScrapeDoAdapter()
        self.image_cleaner = AmazonImageCleaner()
        self.review_cleaner = AmazonReviewCleaner()
        self.normalizer = AmazonNormalizer()

    async def parse(self, url: str) -> Dict[str, Any]:
        raw_product = await self.adapter.fetch_raw_product(url)
        raw_images = raw_product.get("raw_images", []) or []
        raw_reviews = raw_product.get("raw_reviews", []) or []
        for idx, raw_url in enumerate(raw_images[:10]):
            logger.info(
                "[EcomStruct][AmazonParserRawImages] index=%d url=%s",
                idx,
                raw_url,
            )
        logger.info(
            "[EcomStruct][AmazonParser] raw_images_count=%d raw_reviews_count=%d",
            len(raw_images),
            len(raw_reviews),
        )

        clean_images, main_image, image_selection_reason = self.image_cleaner.clean(raw_images)
        clean_reviews = self.review_cleaner.clean(raw_reviews)

        return self.normalizer.normalize(
            url=url,
            raw_product=raw_product,
            clean_images=clean_images,
            main_image=main_image,
            image_selection_reason=image_selection_reason,
            clean_reviews=clean_reviews,
        )

