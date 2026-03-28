import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def normalize(raw: Dict[str, Any], url: str) -> Dict[str, Any]:
    """对齐 Amazon/Shopee ParsedProduct；字段优先来自 page_data 业务结构。"""
    ppi = raw.get("product_price_info") if isinstance(raw.get("product_price_info"), dict) else {}
    ri = raw.get("rate_info") if isinstance(raw.get("rate_info"), dict) else {}
    sold = raw.get("sold_info") if isinstance(raw.get("sold_info"), dict) else {}

    price_str = str(ppi.get("sale_price_format") or "").strip() or "N/A"
    original_price = str(ppi.get("origin_price_format") or "").strip() or "N/A"
    currency = str(ppi.get("currency_name") or "").strip()
    currency_symbol = str(ppi.get("currency_symbol") or "").strip()

    try:
        rating = float(ri.get("score")) if ri.get("score") is not None else 0.0
    except (TypeError, ValueError):
        rating = 0.0

    try:
        review_count = int(ri.get("review_count") or 0)
    except (TypeError, ValueError):
        review_count = 0

    try:
        sold_count = int(sold.get("sold_count") or 0)
    except (TypeError, ValueError):
        sold_count = 0

    imgs_src = raw.get("images")
    if not isinstance(imgs_src, list):
        img = raw.get("image") if isinstance(raw.get("image"), dict) else {}
        imgs_src = img.get("url_list") if isinstance(img.get("url_list"), list) else []
    images: List[str] = [str(u) for u in (imgs_src or []) if u is not None and str(u).strip()]
    main_image = images[0] if images else str(raw.get("main_image") or "").strip()

    title_val = raw.get("title")
    title = str(title_val).strip() if title_val is not None else ""
    if not title:
        title = "未提取到标题"

    brand_val = raw.get("brand")
    brand = str(brand_val).strip() if brand_val not in (None, "") else "N/A"
    if brand == "":
        brand = "N/A"

    description = str(raw.get("description") or "").strip()

    out: Dict[str, Any] = {
        "title": title,
        "price": price_str,
        "currency": currency,
        "currency_symbol": currency_symbol,
        "original_price": original_price,
        "rating": rating,
        "review_count": review_count,
        "sold_count": sold_count,
        "main_image": main_image,
        "images": images,
        "brand": brand,
        "bullet_points": [],
        "description": description,
        "url": url,
        "platform": "tiktok",
        "clean_images": images,
        "clean_reviews": [],
    }
    logger.info(
        "[EcomStruct][TikTokNormalizer] title=%s price=%s currency=%r original_price=%s "
        "rating=%s review_count=%s sold_count=%s images_count=%d",
        out.get("title"),
        out.get("price"),
        out.get("currency"),
        out.get("original_price"),
        out.get("rating"),
        out.get("review_count"),
        sold_count,
        len(images),
    )
    return out
