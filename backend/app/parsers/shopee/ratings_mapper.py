"""
Shopee 官方站内 get_ratings JSON：URL 拼装与响应 -> raw_reviews（供 review_cleaner）。

文档/社区一致形态：
- GET https://{站点域名}/api/v2/item/get_ratings
- 列表路径：根对象的 data.ratings（数组）
- 典型元素字段：author_username, rating_star, comment, ctime；图评含 images 等非空列表
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List
from urllib.parse import urlencode, urlparse

logger = logging.getLogger(__name__)

SHOPEE_GET_RATINGS_PATH = "/api/v2/item/get_ratings"


def build_get_ratings_url(
    product_url: str,
    item_id: str | int,
    shop_id: str | int,
    *,
    limit: int = 59,
    offset: int = 0,
) -> str:
    parsed = urlparse(product_url or "")
    host = (parsed.netloc or "").strip().lower()
    if not host or not host.startswith("shopee."):
        host = "shopee.sg"
    base = f"https://{host}{SHOPEE_GET_RATINGS_PATH}"
    # 与站内 XHR 一致：query 值为字符串（部分网关对类型敏感）
    q = urlencode(
        {
            "filter": "0",
            "flag": "1",
            "itemid": str(item_id),
            "limit": str(int(limit)),
            "offset": str(int(offset)),
            "shopid": str(shop_id),
            "type": "0",
        }
    )
    return f"{base}?{q}"


def extract_ratings_rows(body: Dict[str, Any]) -> List[Dict[str, Any]]:
    """从 get_ratings 原始 JSON 取出评论行列表。"""
    if not isinstance(body, dict):
        return []
    err = body.get("error")
    if err not in (None, 0, "0", False, ""):
        return []
    data = body.get("data")
    if not isinstance(data, dict):
        return []
    ratings = data.get("ratings")
    if not isinstance(ratings, list):
        return []
    out: List[Dict[str, Any]] = []
    for row in ratings:
        if isinstance(row, dict):
            out.append(row)
    return out


def _format_ctime(val: Any) -> str:
    if val in (None, "", 0, "0"):
        return ""
    try:
        n = float(val)
        if n > 1e12:
            n /= 1000.0
        if n > 1e9:
            return datetime.utcfromtimestamp(int(n)).strftime("%Y-%m-%d")
    except Exception:
        pass
    return str(val).strip()


def rating_api_row_to_raw_review(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Shopee data.ratings[] 单条 -> review_cleaner 输入形状（保留 API 媒体字段供 cleaner 剔除）。
    """
    comment = row.get("comment")
    if comment is None:
        comment = row.get("description") or row.get("text") or ""
    try:
        rating = float(row.get("rating_star") or row.get("rating") or 0)
    except (TypeError, ValueError):
        rating = 0.0
    author = str(
        row.get("author_username")
        or row.get("user_name")
        or row.get("username")
        or row.get("author")
        or ""
    ).strip()
    if not author and row.get("userid") is not None:
        author = f"user_{row.get('userid')}"
    created = _format_ctime(row.get("ctime") or row.get("mtime") or row.get("submit_time"))
    return {
        "content": str(comment or "").strip(),
        "author": author,
        "rating": rating,
        "created_at": created,
        "date": created,
        "title": str(row.get("title") or "").strip(),
        "images": row.get("images"),
        "image": row.get("image"),
        "media": row.get("media"),
        "videos": row.get("videos"),
        "video": row.get("video"),
        "review_images": row.get("review_images"),
        "review_video": row.get("review_video"),
        "picture": row.get("picture"),
        "image_list": row.get("image_list"),
        "product_video": row.get("product_video"),
    }


def map_get_ratings_response_to_raw_reviews(body: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows = extract_ratings_rows(body)
    return [rating_api_row_to_raw_review(r) for r in rows]
