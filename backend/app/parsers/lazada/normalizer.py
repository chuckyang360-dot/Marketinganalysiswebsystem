from typing import Any, Dict, List


def _normalize_image_url(u: str) -> str:
    """// 协议相对 URL → https://，便于后续判重与展示。"""
    u = str(u).strip()
    if u.startswith("//"):
        return "https:" + u
    return u


def _is_http_url(u: str) -> bool:
    nu = _normalize_image_url(u)
    return nu.startswith(("http://", "https://"))


def _dedupe_urls(urls: List[str]) -> List[str]:
    seen: set = set()
    out: List[str] = []
    for u in urls:
        nu = _normalize_image_url(u)
        if not nu or nu in seen:
            continue
        if not nu.startswith(("http://", "https://")):
            continue
        seen.add(nu)
        out.append(nu)
    return out


def _append_urls_from_value(val: Any, acc: List[str]) -> None:
    if isinstance(val, str) and val.strip() and _is_http_url(val):
        acc.append(_normalize_image_url(val.strip()))
        return
    if isinstance(val, list):
        for x in val:
            if isinstance(x, str) and x.strip() and _is_http_url(x):
                acc.append(_normalize_image_url(x.strip()))
            elif isinstance(x, dict):
                for k in ("url", "src", "contentUrl", "imageUrl"):
                    u = x.get(k)
                    if isinstance(u, str) and u.strip() and _is_http_url(u):
                        acc.append(_normalize_image_url(u.strip()))


def _collect_raw_images(raw: Dict[str, Any]) -> List[str]:
    """合并 extractor 可能落在不同键上的图片列表。"""
    acc: List[str] = []
    for key in ("images", "image_list", "main_images", "pictures"):
        v = raw.get(key)
        _append_urls_from_value(v, acc)
    img = raw.get("image")
    if isinstance(img, dict):
        ul = img.get("url_list")
        if isinstance(ul, list):
            _append_urls_from_value(ul, acc)
        _append_urls_from_value(img.get("url") or img.get("src"), acc)
    elif isinstance(img, str):
        _append_urls_from_value(img, acc)
    return _dedupe_urls(acc)


def normalize(raw: Dict[str, Any], url: str) -> Dict[str, Any]:
    title = str(raw.get("title") or "").strip()
    if not title:
        title = "未提取到标题"

    price = raw.get("price")
    price_str = str(price).strip() if price is not None and str(price).strip() else "N/A"

    op = raw.get("original_price")
    original_price = str(op).strip() if op is not None and str(op).strip() else "N/A"

    currency = str(raw.get("currency") or "").strip()

    try:
        rating = float(raw.get("rating")) if raw.get("rating") is not None else 0.0
    except (TypeError, ValueError):
        rating = 0.0

    try:
        review_count = int(float(str(raw.get("review_count") or 0).replace(",", "")))
    except (TypeError, ValueError):
        review_count = 0

    images = _collect_raw_images(raw if isinstance(raw, dict) else {})

    main_image = str(raw.get("main_image") or "").strip()
    main_image = _normalize_image_url(main_image) if main_image else ""
    if not main_image.startswith(("http://", "https://")):
        main_image = ""
    if not main_image and images:
        main_image = images[0]

    brand_val = raw.get("brand")
    brand = str(brand_val).strip() if brand_val not in (None, "") else "N/A"
    if brand == "":
        brand = "N/A"

    description = str(raw.get("description") or "").strip()
    bullets = raw.get("bullet_points") if isinstance(raw.get("bullet_points"), list) else []
    bullet_points: List[str] = [str(b).strip() for b in bullets if b is not None and str(b).strip()][:24]

    product_id = str(raw.get("product_id") or raw.get("item_id") or "").strip()

    out: Dict[str, Any] = {
        "platform": "lazada",
        "url": url,
        "product_id": product_id,
        "title": title,
        "price": price_str,
        "original_price": original_price,
        "currency": currency,
        "rating": rating,
        "review_count": review_count,
        "main_image": main_image,
        "images": images,
        "clean_images": images,
        "brand": brand,
        "description": description,
        "bullet_points": bullet_points,
        "clean_reviews": [],
        "raw_reviews": [],
        "seller": "",
        "raw_data": raw,
    }
    return out
