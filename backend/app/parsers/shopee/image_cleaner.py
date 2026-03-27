import logging
import re
from typing import List, Tuple

logger = logging.getLogger(__name__)


class ShopeeImageCleaner:
    """Shopee image cleaner with order-preserving canonical dedupe."""

    _SIZE_SUFFIX = re.compile(r"_[A-Z]{1,3}\d{2,5}(?=\.)", re.IGNORECASE)

    def clean(self, raw_images: List[str]) -> Tuple[List[str], str, str]:
        groups: dict[str, Tuple[str, int]] = {}
        order: dict[str, int] = {}
        idx_order = 0

        for idx, item in enumerate(raw_images or []):
            if not isinstance(item, str):
                continue
            u = item.strip()
            if not u:
                continue
            normalized = u.split("?")[0]
            key = self._identity_key(normalized)
            score = self._quality_score(normalized)
            curr = groups.get(key)
            if curr is None or score > curr[1]:
                groups[key] = (normalized, score)
            if key not in order:
                order[key] = idx_order
                idx_order += 1

        clean_images = [groups[k][0] for k, _ in sorted(order.items(), key=lambda x: x[1]) if k in groups]
        main_image = sorted(clean_images, key=self._quality_score, reverse=True)[0] if clean_images else ""
        reason = "selected_highest_quality_canonical_image" if main_image else "no_image_available"

        logger.info("[EcomStruct][ShopeeImageCleaner] raw_images_count=%d", len(raw_images or []))
        logger.info("[EcomStruct][ShopeeImageCleaner] clean_images_count=%d", len(clean_images))
        logger.info("[EcomStruct][ShopeeImageCleaner] main_image=%s", main_image)
        return clean_images, main_image, reason

    def _identity_key(self, url: str) -> str:
        base = url.split("/")[-1]
        base = self._SIZE_SUFFIX.sub("", base)
        return base.lower()

    @staticmethod
    def _quality_score(url: str) -> int:
        nums = [int(x) for x in re.findall(r"\d+", url)]
        score = max(nums) if nums else 0
        if "original" in url.lower():
            score += 5000
        return score

