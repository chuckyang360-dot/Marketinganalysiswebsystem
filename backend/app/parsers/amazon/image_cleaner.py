from typing import List, Tuple
import logging
import re
from urllib.parse import urlsplit, unquote

logger = logging.getLogger(__name__)


class AmazonImageCleaner:
    """
    Amazon image cleaner:
    - de-duplicate
    - remove noisy/non-product images
    - keep source order (no reorder)
    - select a representative main image with reason
    """

    _NOISE_KEYWORDS = (
        "logo",
        "icon",
        "sprite",
        "swatch",
        "pagination",
        "dot",
        "spinner",
        "loading",
        "nav",
        "arrow",
        "badge",
    )

    _SMALL_HINTS = (
        "._sx38_",
        "._sx50_",
        "._sx55_",
        "._sx60_",
        "._sy35_",
        "._sl75_",
        "._sl110_",
        "._sl150_",
    )

    _LOW_QUALITY_HINTS = (
        "_us40_",
        "_ul116_",
        "_ul232_",
        "_ss40_",
        "_ss100_",
        "_sx38_",
        "_sx50_",
        "_sx55_",
        "_sx60_",
        "_sy35_",
        "_sl75_",
        "_sl110_",
        "_sl150_",
    )

    _SIZE_PATTERN = re.compile(r"\._([A-Z0-9_]+)_\.", re.IGNORECASE)
    _SIZE_SUFFIX_PATTERN = re.compile(r"\._([A-Z0-9_,]+)_\.(jpg|jpeg|png|webp)$", re.IGNORECASE)

    def clean(self, raw_images: List[str]) -> Tuple[List[str], str, str]:
        grouped_best: dict[str, tuple[str, int, int]] = {}
        grouped_urls: dict[str, list[str]] = {}
        base_first_seen_order: dict[str, int] = {}
        group_index = 0

        for order, item in enumerate(raw_images or []):
            if not isinstance(item, str):
                continue
            url = item.strip()
            if not url:
                continue
            group_key_for_log = self._base_image_key(url)
            is_noise = self._is_noise_image(url)
            logger.info(
                "[EcomStruct][AmazonImageCleanerKey] index=%d url=%s group_key=%s is_noise=%s",
                order,
                url,
                group_key_for_log,
                is_noise,
            )
            if is_noise:
                continue

            base_key = group_key_for_log
            quality = self._quality_score(url)
            current = grouped_best.get(base_key)
            grouped_urls.setdefault(base_key, []).append(url)

            if current is None or quality > current[1]:
                grouped_best[base_key] = (url, quality, order)
                if base_key not in base_first_seen_order:
                    base_first_seen_order[base_key] = group_index
                    group_index += 1

        # Keep group order by first appearance, but each group keeps highest-quality canonical image.
        clean_images = [
            grouped_best[key][0]
            for key, _ in sorted(base_first_seen_order.items(), key=lambda x: x[1])
            if key in grouped_best
        ]

        main_image = self._select_main_image(clean_images)
        if main_image:
            reason = "selected_highest_quality_canonical_image"
        elif clean_images:
            main_image = clean_images[0]
            reason = "fallback_first_clean_image"
        elif raw_images:
            first_raw = next((x for x in raw_images if isinstance(x, str) and x.strip()), "")
            main_image = first_raw.strip()
            reason = "fallback_first_raw_image_no_clean_match"
        else:
            main_image = ""
            reason = "no_image_available"

        logger.info(
            "[EcomStruct][AmazonImageCleaner] raw_images_count=%d clean_images_count=%d final_clean_images_count=%d main_image=%s image_selection_reason=%s",
            len(raw_images or []),
            len(clean_images),
            len(clean_images),
            main_image,
            reason,
        )
        logger.info(
            "[EcomStruct][AmazonImageCleaner] deduped_image_groups_count=%d canonical_images_count=%d main_image_selected=%s",
            len(grouped_best),
            len(clean_images),
            main_image,
        )
        for group_key, urls in grouped_urls.items():
            canonical_url = grouped_best.get(group_key, ("", 0, 0))[0]
            logger.info(
                "[EcomStruct][AmazonImageCleanerGroups] group_key=%s urls=%s canonical=%s",
                group_key,
                urls,
                canonical_url,
            )
        return clean_images, main_image, reason

    def _is_noise_image(self, url: str) -> bool:
        u = url.lower()
        if not u.startswith("http"):
            return True
        if any(k in u for k in self._NOISE_KEYWORDS):
            return True
        if any(k in u for k in self._SMALL_HINTS):
            return True
        if any(k in u for k in self._LOW_QUALITY_HINTS):
            return True
        return False

    def _select_main_image(self, clean_images: List[str]) -> str:
        if not clean_images:
            return ""
        return sorted(clean_images, key=self._quality_score, reverse=True)[0]

    def _base_image_key(self, url: str) -> str:
        no_query = url.split("?")[0].strip()

        # Group identity must be derived from file basename only.
        # This prevents over-merging across different image IDs.
        path = urlsplit(no_query).path
        filename = unquote(path.rsplit("/", 1)[-1]) if path else no_query.rsplit("/", 1)[-1]
        if not filename:
            return no_query

        m = self._SIZE_SUFFIX_PATTERN.search(filename)
        if not m:
            # Fallback to basename without extension.
            base = re.sub(r"\.(jpg|jpeg|png|webp)$", "", filename, flags=re.IGNORECASE)
            return base or filename

        token = m.group(1).upper()
        # Only strip real Amazon size/quality suffixes; keep identity/hash portion intact.
        if any(
            marker in token
            for marker in (
                "AC_",
                "SX",
                "SY",
                "SL",
                "UL",
                "US",
                "SS",
                "SR",
                "QL",
            )
        ):
            # Return basename identity without Amazon size suffix and extension.
            return filename[: m.start()]

        return re.sub(r"\.(jpg|jpeg|png|webp)$", "", filename, flags=re.IGNORECASE) or filename

    def _quality_score(self, url: str) -> int:
        u = url.lower()
        score = 0

        if "_sl1500_" in u or "_ac_sl1500_" in u:
            score += 1000
        elif "_sl1200_" in u or "_ac_sl1200_" in u:
            score += 900
        elif "_sl1000_" in u or "_ac_sl1000_" in u:
            score += 850
        elif "_ac_sl" in u:
            score += 800
        elif "_ul" in u or "_us" in u or "_sx" in u or "_sy" in u:
            score += 100
        else:
            score += 500

        match = self._SIZE_PATTERN.search(url)
        if match:
            token = match.group(1).upper()
            nums = [int(n) for n in re.findall(r"\d+", token)]
            if nums:
                score += max(nums)

        if "thumb" in u or "thumbnail" in u:
            score -= 200
        return score

