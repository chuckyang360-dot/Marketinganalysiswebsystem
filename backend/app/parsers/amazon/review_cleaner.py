from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)


class AmazonReviewCleaner:
    """Text-only review cleaner for Amazon product parsing."""

    def clean(self, raw_reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        clean_reviews: List[Dict[str, Any]] = []
        seen_text = set()

        for review in raw_reviews or []:
            if not isinstance(review, dict):
                continue

            content = str(review.get("content", "")).strip()
            if not content:
                continue
            if len(content) < 8:
                continue

            normalized = " ".join(content.split()).lower()
            if not normalized or normalized in seen_text:
                continue
            seen_text.add(normalized)

            # Keep text review payload compatible with existing frontend rendering.
            clean_reviews.append(
                {
                    "rating": review.get("rating", 0.0),
                    "title": str(review.get("title", "")).strip(),
                    "content": content,
                    "author": str(review.get("author", "")).strip(),
                    "date": str(review.get("date", "")).strip(),
                    "verified_purchase": bool(review.get("verified_purchase", False)),
                    "helpful_votes": review.get("helpful_votes", 0),
                }
            )

            if len(clean_reviews) >= 10:
                break

        logger.info(
            "[EcomStruct][AmazonReviewCleaner] raw_reviews_count=%d clean_reviews_count=%d",
            len(raw_reviews or []),
            len(clean_reviews),
        )
        return clean_reviews

