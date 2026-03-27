import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

_MEDIA_FIELD_NAMES = (
    "images",
    "image",
    "media",
    "videos",
    "video",
    "review_images",
    "review_video",
    "picture",
    "image_list",
    "product_video",
)

_MEANINGFUL_CHAR = re.compile(r"[\u4e00-\u9fffA-Za-z0-9]")


def _is_nonempty_media_value(val: Any) -> bool:
    if val is None or val is False:
        return False
    if isinstance(val, str) and not val.strip():
        return False
    if isinstance(val, (list, tuple, dict, set)) and len(val) == 0:
        return False
    return True


def _review_row_has_media(item: Dict[str, Any]) -> bool:
    for k in _MEDIA_FIELD_NAMES:
        if _is_nonempty_media_value(item.get(k)):
            return True
    return False


def _is_meaningless_text(content: str) -> bool:
    t = content.strip()
    if len(t) < 6:
        return True
    if not _MEANINGFUL_CHAR.search(t):
        return True
    return False


class ShopeeReviewCleaner:
    """Shopee 评论：仅保留纯文字（剔除图评/视频评），最多 10 条。"""

    def clean(self, raw_reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raw_in = len(raw_reviews or [])
        text_only_passed = 0
        out: List[Dict[str, Any]] = []
        seen = set()

        for item in raw_reviews or []:
            if not isinstance(item, dict):
                continue
            if _review_row_has_media(item):
                continue
            content = str(item.get("content", "")).strip()
            if not content or _is_meaningless_text(content):
                continue
            text_only_passed += 1
            key = " ".join(content.split()).lower()
            if key in seen:
                continue
            seen.add(key)

            try:
                rating = float(item.get("rating", 0) or 0)
            except (TypeError, ValueError):
                rating = 0.0
            author = str(item.get("author", "")).strip()
            created_at = str(
                item.get("created_at") or item.get("date") or ""
            ).strip()

            out.append(
                {
                    "author": author,
                    "content": content,
                    "rating": rating,
                    "created_at": created_at,
                    "date": created_at,
                }
            )
            if len(out) >= 10:
                break

        logger.info(
            "[SHOPEE_REVIEW_FILTER] raw_reviews=%d text_only_reviews=%d returned_reviews=%d",
            raw_in,
            text_only_passed,
            len(out),
        )
        return out
