import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

# 打分：title +3, price +3, images +2, rating +1, review_count +1, brand +1


def _empty_raw() -> Dict[str, Any]:
    return {
        "title": None,
        "price": None,
        "original_price": None,
        "currency": None,
        "rating": None,
        "review_count": None,
        "images": [],
        "main_image": None,
        "brand": None,
        "description": None,
        "bullet_points": [],
        "product_id": None,
        "item_id": None,
        "raw_reviews": [],
        "_source": "",
    }


def _is_product_type(t: Any) -> bool:
    if t is None:
        return False
    if isinstance(t, str):
        return "Product" in t
    if isinstance(t, list):
        return any(isinstance(x, str) and "Product" in x for x in t)
    return False


def _coerce_float(x: Any) -> Optional[float]:
    if x is None:
        return None
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def _coerce_int(x: Any) -> Optional[int]:
    if x is None:
        return None
    try:
        return int(float(str(x).replace(",", "")))
    except (TypeError, ValueError):
        return None


def _coerce_star_rating_0_5(val: Any) -> Optional[float]:
    """可展示星级：优先 0~5；不引入默认空值 0。"""
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, dict):
        val = val.get("ratingValue") or val.get("value") or val.get("score") or val.get("rating")
        if val is None:
            return None
    f = _coerce_float(val)
    if f is None:
        return None
    if 0.0 <= f <= 5.0:
        return f
    return None


def _extract_rating_review_from_tracking_dict(d: Dict[str, Any]) -> Tuple[Optional[float], Optional[int]]:
    """从 tracking / pdp 对象及 core 子对象读取评分与评论数。"""
    rating_keys = (
        "rating",
        "score",
        "avgRating",
        "averageRating",
        "starRating",
        "reviewScore",
        "pdt_rating",
        "pdt_avg_rating",
    )
    review_keys = (
        "reviewCount",
        "review_count",
        "comments",
        "commentCount",
        "ratingCount",
        "totalReviews",
        "pdt_review_count",
        "pdt_review_num",
    )

    def _pick_rating(dd: Dict[str, Any]) -> Optional[float]:
        for k in rating_keys:
            if k not in dd:
                continue
            r = _coerce_star_rating_0_5(dd.get(k))
            if r is not None:
                return r
        return None

    def _pick_review(dd: Dict[str, Any]) -> Optional[int]:
        for k in review_keys:
            if k not in dd:
                continue
            rc = _coerce_int(dd.get(k))
            if rc is not None:
                return rc
        return None

    rt = _pick_rating(d)
    rc = _pick_review(d)
    core = d.get("core") if isinstance(d.get("core"), dict) else None
    if core:
        if rt is None:
            rt = _pick_rating(core)
        if rc is None:
            rc = _pick_review(core)
    return rt, rc


def _extract_rating_review_from_script_text(text: str) -> Tuple[Optional[float], Optional[int]]:
    """同段脚本内轻量正则兜底（不拉取外链、不解析整页 HTML）。"""
    if not text:
        return None, None
    sample = text if len(text) <= 2_000_000 else text[:2_000_000]
    rt: Optional[float] = None
    rc: Optional[int] = None
    for m in re.finditer(
        r'"(?:reviewCount|review_count|totalReviews|commentCount|ratingCount|comments|pdt_review_count)"\s*:\s*(\d+)',
        sample,
        re.I,
    ):
        v = _coerce_int(m.group(1))
        if v is not None:
            if rc is None or v > rc:
                rc = v
    for m in re.finditer(
        r'\b(?:reviewCount|review_count|totalReviews|commentCount|ratingCount)\s*:\s*(\d+)\b',
        sample,
        re.I,
    ):
        v = _coerce_int(m.group(1))
        if v is not None:
            if rc is None or v > rc:
                rc = v
    for m in re.finditer(
        r'"(?:avgRating|averageRating|starRating|ratingScore|reviewScore|rating|pdt_rating)"\s*:\s*([0-9]+(?:\.[0-9]+)?)',
        sample,
        re.I,
    ):
        v = _coerce_star_rating_0_5(m.group(1))
        if v is not None:
            rt = v
            break
    if rt is None:
        for m in re.finditer(
            r'\b(?:avgRating|averageRating|starRating|ratingScore|reviewScore|rating)\s*:\s*([0-9]+(?:\.[0-9]+)?)\b',
            sample,
            re.I,
        ):
            v = _coerce_star_rating_0_5(m.group(1))
            if v is not None:
                rt = v
                break
    return rt, rc


# --- 评分/评论定向扫描（仅 inline script，不参与价格排序逻辑）---

_LAZADA_RSCAN_TITLE_KEYS = ("title", "name", "productName", "itemTitle", "pdt_name")
_LAZADA_RSCAN_ID_KEYS = (
    "itemId",
    "item_id",
    "sku",
    "pdt_sku",
    "pdt_simplesku",
    "productId",
    "product_id",
)
_LAZADA_RSCAN_RATING_KEYS_FLAT = (
    "rating",
    "avgRating",
    "averageRating",
    "ratingScore",
    "rateScore",
    "score",
    "starRating",
    "sellerRating",
)
_LAZADA_RSCAN_REVIEW_KEYS_FLAT = (
    "reviewCount",
    "review_count",
    "reviews",
    "totalReview",
    "totalReviews",
    "reviewNum",
    "ratingCount",
    "commentCount",
    "comments",
)

def _script_text_has_product_bind(text: str) -> bool:
    """正则/文本路径：需与商品标题或 id 同段共存，避免店铺/全站分。"""
    if not text or len(text) < 8:
        return False
    pats = (
        r'"title"\s*:',
        r'"name"\s*:',
        r'"productName"\s*:',
        r'"itemTitle"\s*:',
        r'"pdt_name"\s*:',
        r'"itemId"\s*:',
        r'"productId"\s*:',
        r'"pdt_sku"\s*:',
        r'"pdt_simplesku"\s*:',
        r'"sku"\s*:',
        r"\bitemId\s*:",
        r"\bproductId\s*:",
        r"\bpdt_sku\s*:",
    )
    return any(re.search(p, text, re.I) for p in pats)


def _script_has_weak_product_bind(text: str) -> bool:
    """同段脚本已有商品价/名/sku 等信号时，允许该段内 rating 弱绑定入队。"""
    if not text or len(text) < 16:
        return False
    pats = (
        r'"pdt_name"\s*:',
        r'"pdt_sku"\s*:',
        r'"pdt_price"\s*:',
        r'"productName"\s*:',
        r'"itemId"\s*:',
        r'"sku"\s*:',
        r'"productId"\s*:',
        r'"pdt_simplesku"\s*:',
    )
    return any(re.search(p, text, re.I) for p in pats)


def _title_signal_for_rscan(d: Dict[str, Any]) -> Optional[str]:
    for k in _LAZADA_RSCAN_TITLE_KEYS:
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _id_signal_for_rscan(d: Dict[str, Any]) -> bool:
    for k in _LAZADA_RSCAN_ID_KEYS:
        v = d.get(k)
        if v is None:
            continue
        if isinstance(v, bool):
            continue
        if isinstance(v, (int, float)):
            return True
        if isinstance(v, str) and v.strip():
            return True
    return False


def _product_bind_signal_for_rscan(d: Dict[str, Any]) -> bool:
    return _title_signal_for_rscan(d) is not None or _id_signal_for_rscan(d)


def _pick_r_scan_flat(d: Dict[str, Any]) -> Optional[float]:
    keys = _LAZADA_RSCAN_RATING_KEYS_FLAT
    if not _product_bind_signal_for_rscan(d):
        keys = tuple(k for k in keys if k != "sellerRating")
    for k in keys:
        if k not in d:
            continue
        r = _coerce_star_rating_0_5(d.get(k))
        if r is not None:
            return r
    return None


def _pick_rc_scan_flat(d: Dict[str, Any]) -> Optional[int]:
    for k in _LAZADA_RSCAN_REVIEW_KEYS_FLAT:
        if k not in d:
            continue
        v = d.get(k)
        if k == "reviews" and isinstance(v, list):
            continue
        rc = _coerce_int(v)
        if rc is not None:
            return rc
    return None


def _pick_r_scan_nested(d: Dict[str, Any]) -> Optional[float]:
    r = _pick_r_scan_flat(d)
    if r is not None:
        return r
    ar = d.get("aggregateRating")
    if isinstance(ar, dict):
        r = _coerce_star_rating_0_5(
            ar.get("ratingValue")
            or ar.get("rating")
            or ar.get("score")
            or ar.get("avgRating")
        )
        if r is not None:
            return r
    ro = d.get("rating")
    if isinstance(ro, dict):
        r = _coerce_star_rating_0_5(
            ro.get("ratingValue")
            or ro.get("score")
            or ro.get("rating")
            or ro.get("average")
            or ro.get("avgRating")
            or ro.get("averageRating")
        )
        if r is not None:
            return r
    return None


def _pick_rc_scan_nested(d: Dict[str, Any]) -> Optional[int]:
    rc = _pick_rc_scan_flat(d)
    if rc is not None:
        return rc
    ar = d.get("aggregateRating")
    if isinstance(ar, dict):
        rc = _coerce_int(ar.get("reviewCount") or ar.get("ratingCount"))
        if rc is not None:
            return rc
    rv = d.get("review")
    if isinstance(rv, dict):
        rc = _coerce_int(
            rv.get("reviewCount")
            or rv.get("count")
            or rv.get("totalCount")
        )
        if rc is not None:
            return rc
    rvs = d.get("reviews")
    if isinstance(rvs, dict):
        rc = _coerce_int(
            rvs.get("totalCount")
            or rvs.get("count")
            or rvs.get("reviewCount")
            or rvs.get("totalReviews")
        )
        if rc is not None:
            return rc
    return None


def _walk_dicts_for_rating_candidate(
    obj: Any,
    depth: int,
    max_depth: int,
    acc: List[Dict[str, Any]],
    seen_ids: Set[int],
    inherited_title: Optional[str] = None,
    inherited_id: bool = False,
) -> None:
    """向下遍历；标题/id 可在祖先节点，评分可在子节点（商品级绑定）。"""
    if depth > max_depth:
        return
    if isinstance(obj, dict):
        th = _title_signal_for_rscan(obj)
        ih = _id_signal_for_rscan(obj)
        eff_title = (th or inherited_title or "").strip() if (th or inherited_title) else ""
        eff_title = eff_title or None
        eff_id = ih or inherited_id
        bind = eff_title is not None or eff_id

        rt = _pick_r_scan_nested(obj)
        rc = _pick_rc_scan_nested(obj)
        has_rr = rt is not None or rc is not None

        oid = id(obj)
        if bind and has_rr and oid not in seen_ids:
            seen_ids.add(oid)
            view = dict(obj)
            if eff_title and not th:
                view["title"] = eff_title
            acc.append(view)

        next_title = th if th else inherited_title
        next_id = ih or inherited_id
        for v in list(obj.values())[:120]:
            if isinstance(v, (dict, list)):
                _walk_dicts_for_rating_candidate(
                    v,
                    depth + 1,
                    max_depth,
                    acc,
                    seen_ids,
                    next_title,
                    next_id,
                )
    elif isinstance(obj, list):
        for it in obj[:80]:
            if isinstance(it, (dict, list)):
                _walk_dicts_for_rating_candidate(
                    it,
                    depth + 1,
                    max_depth,
                    acc,
                    seen_ids,
                    inherited_title,
                    inherited_id,
                )


def _merge_rscan_dict_hits(
    dicts: List[Dict[str, Any]],
) -> Optional[Tuple[Optional[str], Optional[float], Optional[int]]]:
    if not dicts:
        return None
    title: Optional[str] = None
    rt: Optional[float] = None
    rc: Optional[int] = None
    for d in dicts:
        t = _title_signal_for_rscan(d)
        if t and not title:
            title = t
        r = _pick_r_scan_nested(d)
        if r is not None and rt is None:
            rt = r
        rci = _pick_rc_scan_nested(d)
        if rci is not None:
            if rc is None or rci > rc:
                rc = rci
    if rt is None and rc is None:
        return None
    return (title, rt, rc)


def _regex_rating_review_scan(text: str) -> Tuple[Optional[float], Optional[int]]:
    """键值对/文本级定向正则，与 dict 扫描互补（调用方需再做商品绑定校验）。"""
    if not text:
        return None, None
    sample = text[:2_000_000] if len(text) > 2_000_000 else text
    rc: Optional[int] = None
    rk = (
        r"(?:reviewCount|review_count|totalReviews|totalReview|commentCount|"
        r"ratingCount|comments|reviewNum)"
    )
    for pat in (
        rf'"{rk}"\s*:\s*(\d+)',
        rf"\b{rk}\s*:\s*(\d+)\b",
    ):
        for m in re.finditer(pat, sample, re.I):
            v = _coerce_int(m.group(1))
            if v is not None and (rc is None or v > rc):
                rc = v
    rt: Optional[float] = None
    ratk = (
        r"(?:rating|ratingValue|avgRating|averageRating|starRating|score|rateScore|"
        r"ratingScore|reviewScore)"
    )
    for pat in (
        rf'"{ratk}"\s*:\s*"([0-9]+(?:\.[0-9]+)?)"',
        rf'"{ratk}"\s*:\s*([0-9]+(?:\.[0-9]+)?)\b',
        rf"\b{ratk}\s*:\s*\"([0-9]+(?:\.[0-9]+)?)\"",
        rf"\b{ratk}\s*:\s*([0-9]+(?:\.[0-9]+)?)\b",
    ):
        for m in re.finditer(pat, sample, re.I):
            v = _coerce_star_rating_0_5(m.group(1))
            if v is not None:
                rt = v
                break
        if rt is not None:
            break
    return rt, rc


# --- Lazada PDP 模块定点：module_product_review_star_1 / module_product_review ---

_LAZADA_STORE_TITLE_KEYS = ("title", "name", "productName", "itemTitle", "pdt_name")
_LAZADA_STORE_RECURSE_KEYS = frozenset(
    (
        "aggregateRating",
        "rating",
        "review",
        "reviews",
        "statistics",
        "summary",
        "data",
        "props",
        "result",
    )
)
_LAZADA_STORE_RATING_FLAT = (
    "rating",
    "avgRating",
    "averageRating",
    "rateScore",
    "score",
    "star",
    "starScore",
)
_LAZADA_STORE_REVIEW_FLAT = (
    "reviewCount",
    "totalReview",
    "totalReviews",
    "reviewNum",
    "count",
    "totalCount",
)
_LAZADA_STOREMAP_KEYWORD_SUBSTR = (
    "rating",
    "review",
    "reviews",
    "reviewcount",
    "totalreview",
    "totalreviews",
    "avgrating",
    "averagerating",
    "ratingvalue",
    "score",
    "star",
    "statistics",
    "summary",
)
_LAZADA_REVIEW_NODE_KEY_FRAGMENTS = _LAZADA_STOREMAP_KEYWORD_SUBSTR


def _is_invalid_lazada_store_path(path: str) -> bool:
    """排除 CDN/静态资源 URL 等非对象路径字符串。"""
    if not isinstance(path, str):
        return True
    p = path.strip()
    if not p:
        return True
    pl = p.lower()
    if pl.startswith("http://") or pl.startswith("https://"):
        return True
    if p.startswith("//"):
        return True
    if ".js" in pl:
        return True
    if "lazcdn.com" in pl:
        return True
    if "/g/lzdfe/" in pl:
        return True
    if "/" in p:
        return True
    if re.search(r"https?://|lazcdn|\.js\b|//", pl):
        return True
    if "." in p or "[" in p:
        return False
    return not bool(re.match(r"^[A-Za-z_$][A-Za-z0-9_$-]*$", p))


def _tokenize_lazada_path(path: str) -> List[Tuple[str, Optional[int]]]:
    """点路径与 a[0].b 混合格式。"""
    s = path.strip()
    out: List[Tuple[str, Optional[int]]] = []
    i = 0
    n = len(s)
    while i < n:
        while i < n and s[i] in ". ":
            i += 1
        if i >= n:
            break
        j = i
        while j < n and s[j] not in ".[":
            j += 1
        key = s[i:j]
        i = j
        idx: Optional[int] = None
        if i < n and s[i] == "[":
            k = s.find("]", i)
            if k == -1:
                break
            try:
                idx = int(s[i + 1 : k].strip())
            except ValueError:
                break
            i = k + 1
        if key:
            out.append((key, idx))
    return out


def _get_by_lazada_path(obj: Any, path: str) -> Any:
    if not isinstance(path, str) or not path.strip():
        return None
    cur: Any = obj
    for key, idx in _tokenize_lazada_path(path):
        if not isinstance(cur, dict):
            return None
        if key not in cur:
            return None
        cur = cur[key]
        if idx is not None:
            if not isinstance(cur, list) or idx < 0 or idx >= len(cur):
                return None
            cur = cur[idx]
    return cur


def _extract_paths_from_store_map_to_props(sm: Any) -> List[str]:
    """从 storeMapToProps 收集对象路径字符串；排除静态资源 URL 等。"""
    raw: List[str] = []
    if sm is None:
        return []
    if isinstance(sm, str) and sm.strip():
        raw.append(sm.strip())
    elif isinstance(sm, list):
        for it in sm[:100]:
            if isinstance(it, str) and it.strip():
                raw.append(it.strip())
            elif isinstance(it, dict):
                for kk in (
                    "source",
                    "path",
                    "key",
                    "from",
                    "prop",
                    "name",
                    "storePath",
                    "mapPath",
                    "value",
                ):
                    v = it.get(kk)
                    if isinstance(v, str) and v.strip():
                        raw.append(v.strip())
    elif isinstance(sm, dict):
        for _kk, v in list(sm.items())[:120]:
            if isinstance(v, str) and v.strip():
                raw.append(v.strip())
            elif isinstance(v, (list, dict)):
                raw.extend(_extract_paths_from_store_map_to_props(v))
    seen: Set[str] = set()
    res: List[str] = []
    for p in raw:
        ps = p.strip()
        if _is_invalid_lazada_store_path(ps):
            continue
        if ps not in seen:
            seen.add(ps)
            res.append(ps)
    return res[:64]


def _extract_store_keys_from_store_map_to_props(sm: Any) -> Set[str]:
    """从 storeMapToProps 提取疑似数据字段名（关键词线索），非 URL 路径。"""
    out: Set[str] = set()

    def walk(x: Any, depth: int) -> None:
        if depth > 12:
            return
        if isinstance(x, dict):
            for k, v in list(x.items())[:100]:
                ks = str(k)
                kl = ks.lower()
                if any(s in kl for s in _LAZADA_STOREMAP_KEYWORD_SUBSTR):
                    if "sellerrating" not in kl:
                        out.add(ks)
                if isinstance(v, str) and v.strip():
                    vs = v.strip()
                    if _is_invalid_lazada_store_path(vs):
                        continue
                    if "." in vs or "[" in vs:
                        continue
                    vsl = vs.lower()
                    if any(s in vsl for s in _LAZADA_STOREMAP_KEYWORD_SUBSTR):
                        if re.match(r"^[A-Za-z_$][A-Za-z0-9_$-]*$", vs):
                            out.add(vs)
                elif isinstance(v, (dict, list)):
                    walk(v, depth + 1)
        elif isinstance(x, list):
            for it in x[:80]:
                walk(it, depth + 1)

    walk(sm, 0)
    return out


def _dict_has_lazada_review_keyword_key(
    d: Dict[str, Any],
    key_hints: Set[str],
) -> bool:
    for k in d.keys():
        kl = str(k).lower()
        if "sellerrating" in kl:
            continue
        for h in key_hints:
            hl = h.lower()
            if hl and (hl == kl or hl in kl or kl in hl):
                return True
        for frag in _LAZADA_REVIEW_NODE_KEY_FRAGMENTS:
            if frag in kl:
                return True
    return False


def _lazada_fallback_collect_review_nodes(
    obj: Any,
    depth: int,
    max_depth: int,
    key_hints: Set[str],
    acc: List[Dict[str, Any]],
    seen: Set[int],
) -> None:
    if depth > max_depth or len(acc) >= 32:
        return
    if isinstance(obj, dict):
        if _dict_has_lazada_review_keyword_key(obj, key_hints):
            oid = id(obj)
            if oid not in seen:
                seen.add(oid)
                acc.append(obj)
        for v in list(obj.values())[:200]:
            if isinstance(v, (dict, list)):
                _lazada_fallback_collect_review_nodes(
                    v, depth + 1, max_depth, key_hints, acc, seen
                )
    elif isinstance(obj, list):
        for it in obj[:150]:
            if isinstance(it, (dict, list)):
                _lazada_fallback_collect_review_nodes(
                    it, depth + 1, max_depth, key_hints, acc, seen
                )


_LAZADA_FB_DUMP_SUBKEYS = (
    "aggregateRating",
    "rating",
    "review",
    "reviews",
    "statistics",
    "summary",
    "data",
    "props",
    "result",
)


def _lazada_trunc_preview(s: str, max_len: int = 120) -> str:
    if len(s) <= max_len:
        return s
    return s[: max_len - 3] + "..."


def _lazada_fb_type_tag(v: Any) -> str:
    if v is None:
        return "None"
    if isinstance(v, bool):
        return "bool"
    if isinstance(v, int):
        return "int"
    if isinstance(v, float):
        return "float"
    if isinstance(v, str):
        return f"str(len={len(v)})"
    if isinstance(v, dict):
        return f"dict(n={len(v)})"
    if isinstance(v, list):
        return f"list(n={len(v)})"
    return type(v).__name__


def _lazada_fb_scalar_hint_key(k: str) -> bool:
    kl = str(k).lower()
    return any(
        x in kl for x in ("rating", "review", "score", "star", "count", "total")
    )


def _lazada_fb_layer_summary_line(d: Dict[str, Any], label: str) -> str:
    n_all = len(d)
    keys = list(d.keys())[:40]
    top_keys = str(keys)
    if n_all > 40:
        top_keys = top_keys[:-1] + f", ...(+{n_all - 40})]"
    type_parts: List[str] = []
    hints: List[str] = []
    for k in keys:
        v = d.get(k)
        type_parts.append(f"{k}:{_lazada_fb_type_tag(v)}")
        if _lazada_fb_scalar_hint_key(k) and not isinstance(v, (dict, list)):
            if isinstance(v, str):
                hints.append(f"{k}={_lazada_trunc_preview(v, 120)!r}")
            elif isinstance(v, (int, float, bool)):
                hints.append(f"{k}={v!r}")
    types_s = ",".join(type_parts)
    base = f"{label} top_keys={top_keys} types={{{types_s}}}"
    if hints:
        return f"{base} scalar_hints=[{' '.join(hints[:30])}]"
    return base


def _lazada_dump_fallback_node_summary(node: Dict[str, Any], meta: str) -> None:
    """保留占位：不再输出探针日志（收口为仅 LazadaApi* / Extractor*）。"""
    return


def _resolve_lazada_module_store_targets(
    root_obj: Any,
    module_obj: Dict[str, Any],
) -> Tuple[List[Dict[str, Any]], str]:
    """
    沿 module.fields.path 与 fields.storeMapToProps 在 root 上解析真实数据 dict 节点。
    fields.path 若为模块脚本 URL 等则忽略。
    """
    fields = module_obj.get("fields")
    if not isinstance(fields, dict):
        return [], "?"
    targets: List[Dict[str, Any]] = []
    seen: Set[int] = set()

    def add_node(v: Any) -> None:
        if isinstance(v, dict):
            oid = id(v)
            if oid not in seen:
                seen.add(oid)
                targets.append(v)
        elif isinstance(v, list):
            for it in v[:100]:
                if isinstance(it, dict):
                    add_node(it)

    primary = fields.get("path")
    valid_primary: Optional[str] = None
    if isinstance(primary, str) and primary.strip():
        ps = primary.strip()
        if not _is_invalid_lazada_store_path(ps):
            valid_primary = ps
            add_node(_get_by_lazada_path(root_obj, ps))
    sm_paths = _extract_paths_from_store_map_to_props(fields.get("storeMapToProps"))
    path_log = "?"
    if valid_primary:
        path_log = valid_primary
    elif sm_paths:
        path_log = sm_paths[0]
    for p in sm_paths:
        add_node(_get_by_lazada_path(root_obj, p))
    return targets, path_log


def _coerce_product_rating_strict(val: Any) -> Optional[float]:
    """商品星级：0 < rating <= 5；忽略 sellerRating 路径由调用方跳过键名。"""
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, dict):
        for kk in (
            "rating",
            "value",
            "score",
            "avgRating",
            "averageRating",
            "starScore",
            "rateScore",
        ):
            if kk not in val:
                continue
            if isinstance(kk, str) and "seller" in kk.lower():
                continue
            r = _coerce_product_rating_strict(val.get(kk))
            if r is not None:
                return r
        return None
    f = _coerce_float(val)
    if f is None:
        return None
    if 0.0 < f <= 5.0:
        return f
    return None


def _extract_lazada_review_modules_from_obj(
    obj: Any,
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """在 dict/list 内有限深度递归，定位 module_product_review_star_1 与 module_product_review。"""
    found_star: Optional[Dict[str, Any]] = None
    found_rev: Optional[Dict[str, Any]] = None

    def walk(o: Any, depth: int) -> None:
        nonlocal found_star, found_rev
        if depth > 14 or (found_star is not None and found_rev is not None):
            return
        if isinstance(o, dict):
            v_star = o.get("module_product_review_star_1")
            if isinstance(v_star, dict) and found_star is None:
                found_star = v_star
            v_rev = o.get("module_product_review")
            if isinstance(v_rev, dict) and found_rev is None:
                found_rev = v_rev
            if found_star is not None and found_rev is not None:
                return
            for v in list(o.values())[:200]:
                if isinstance(v, (dict, list)):
                    walk(v, depth + 1)
        elif isinstance(o, list):
            for it in o[:150]:
                if isinstance(it, (dict, list)):
                    walk(it, depth + 1)

    walk(obj, 0)
    return found_star, found_rev


def _lazada_store_pick_title(node: Dict[str, Any], fallback_title: Optional[str]) -> Optional[str]:
    for k in _LAZADA_STORE_TITLE_KEYS:
        v = node.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    if fallback_title and str(fallback_title).strip():
        return str(fallback_title).strip()
    return None


def _lazada_store_recurse_into_key(k: str) -> bool:
    kl = str(k).lower()
    if "sellerrating" in kl or "seller_rating" in kl:
        return False
    if k in _LAZADA_STORE_RECURSE_KEYS:
        return True
    return kl in ("rating", "review", "reviews", "statistics", "summary")


def _lazada_store_extract_rating(obj: Any, depth: int, max_depth: int) -> Optional[float]:
    if depth > max_depth:
        return None
    if isinstance(obj, dict):
        for k in _LAZADA_STORE_RATING_FLAT:
            if k not in obj:
                continue
            if "seller" in str(k).lower():
                continue
            r = _coerce_product_rating_strict(obj.get(k))
            if r is not None:
                return r
        ar = obj.get("aggregateRating")
        if isinstance(ar, dict):
            rv = ar.get("ratingValue") or ar.get("rating")
            r = _coerce_product_rating_strict(rv)
            if r is not None:
                return r
        for kk, v in list(obj.items())[:100]:
            if not _lazada_store_recurse_into_key(kk):
                continue
            if isinstance(v, (dict, list)):
                r = _lazada_store_extract_rating(v, depth + 1, max_depth)
                if r is not None:
                    return r
    elif isinstance(obj, list):
        for it in obj[:50]:
            if isinstance(it, (dict, list)):
                r = _lazada_store_extract_rating(it, depth + 1, max_depth)
                if r is not None:
                    return r
    return None


def _lazada_store_extract_review_count(
    obj: Any,
    depth: int,
    max_depth: int,
    *,
    allow_reviews_list_len: bool,
) -> Optional[int]:
    if depth > max_depth:
        return None
    if isinstance(obj, dict):
        for k in _LAZADA_STORE_REVIEW_FLAT:
            if k not in obj:
                continue
            v = obj[k]
            rc = _coerce_int(v)
            if rc is not None and rc >= 0:
                return rc
        ar = obj.get("aggregateRating")
        if isinstance(ar, dict):
            rc = _coerce_int(ar.get("reviewCount") or ar.get("ratingCount"))
            if rc is not None and rc >= 0:
                return rc
        rv = obj.get("reviews")
        if isinstance(rv, int) and rv >= 0:
            return rv
        if isinstance(rv, dict):
            rc = _lazada_store_extract_review_count(
                rv, depth + 1, max_depth, allow_reviews_list_len=False
            )
            if rc is not None:
                return rc
        for kk, v in list(obj.items())[:120]:
            if kk == "reviews" and isinstance(v, list):
                continue
            if not _lazada_store_recurse_into_key(kk):
                continue
            if isinstance(v, (dict, list)):
                rc = _lazada_store_extract_review_count(
                    v, depth + 1, max_depth, allow_reviews_list_len=False
                )
                if rc is not None:
                    return rc
        if allow_reviews_list_len:
            rv2 = obj.get("reviews")
            if isinstance(rv2, list):
                return len(rv2)
    elif isinstance(obj, list):
        for it in obj[:60]:
            if isinstance(it, (dict, list)):
                rc = _lazada_store_extract_review_count(
                    it, depth + 1, max_depth, allow_reviews_list_len=allow_reviews_list_len
                )
                if rc is not None:
                    return rc
    return None


def _parse_lazada_review_store_node_to_candidate(
    node: Dict[str, Any],
    fallback_title: Optional[str],
    source: str,
) -> Optional[Dict[str, Any]]:
    """仅从 store 解析出的节点提取 rating / review_count；无标题则退回 fallback。"""
    title = _lazada_store_pick_title(node, fallback_title)
    if not title:
        return None
    rt = _lazada_store_extract_rating(node, 0, 8)
    rc = _lazada_store_extract_review_count(node, 0, 8, allow_reviews_list_len=False)
    if rc is None:
        rc = _lazada_store_extract_review_count(node, 0, 8, allow_reviews_list_len=True)
    if rt is None and rc is None:
        return None
    raw = _empty_raw()
    raw["_source"] = source
    raw["title"] = title
    raw["rating"] = rt
    raw["review_count"] = rc
    return _finalize_raw(raw, source)


def _script_product_title_hint(text: str) -> Optional[str]:
    """从同段脚本 JSON 字符串中取 pdt_name / productName / title 作为标题兜底。"""
    if not text or len(text) < 8:
        return None
    sample = text if len(text) <= 500_000 else text[:500_000]
    for pat in (
        r'"pdt_name"\s*:\s*"((?:[^"\\]|\\.)*)"',
        r'"productName"\s*:\s*"((?:[^"\\]|\\.)*)"',
        r'"itemTitle"\s*:\s*"((?:[^"\\]|\\.)*)"',
        r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"',
    ):
        m = re.search(pat, sample)
        if not m:
            continue
        s = (
            m.group(1)
            .replace('\\"', '"')
            .replace("\\\\", "\\")
            .replace("\\n", " ")
            .strip()
        )
        if len(s) > 1:
            return s
    return None


def _extract_rating_scan_candidates(html: str) -> List[Dict[str, Any]]:
    """已废弃：评分/评论改由 detail API 主链路提供，不再从 HTML 泛扫。"""
    return []


def _offers_blocks(offers: Any) -> List[Dict[str, Any]]:
    if isinstance(offers, dict):
        return [offers]
    if isinstance(offers, list):
        return [x for x in offers if isinstance(x, dict)]
    return []


def _float_safe(s: Optional[str]) -> float:
    if not s:
        return 0.0
    try:
        return float(str(s).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def _extract_numeric_price(val: Any) -> Optional[str]:
    """从字符串/数字中提取纯数字价；去掉 $、币种词等。"""
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        if isinstance(val, float) and (val != val or val in (float("inf"), float("-inf"))):
            return None
        s = str(val).strip()
        return s if s else None
    s = str(val).strip()
    if not s:
        return None
    s = re.sub(r"^[\s$€£¥]+", "", s)
    s = re.sub(
        r"^(?:SGD|USD|EUR|MYR|PHP|THB|VND|IDR|CNY|HKD|AUD|GBP|RM|PHP)\s*",
        "",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"\s+(?:SGD|USD|EUR|MYR|PHP|THB|VND|IDR|CNY|HKD|AUD|GBP|RM)\s*$",
        "",
        s,
        flags=re.I,
    ).strip()
    m = re.search(r"([\d,]+(?:\.\d+)?)", s.replace(",", ""))
    if m:
        return m.group(1)
    return None


def _currency_from_dict(d: Dict[str, Any]) -> Optional[str]:
    for k in ("priceCurrency", "currency", "currencyCode"):
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _scan_price_specification(ps: Dict[str, Any]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    curr = _currency_from_dict(ps)
    pp = _extract_numeric_price(ps.get("price"))
    pmin = _extract_numeric_price(ps.get("minPrice"))
    pmax = _extract_numeric_price(ps.get("maxPrice"))
    if pmin and pmax and _float_safe(pmax) > _float_safe(pmin):
        return pmin, pmax, curr
    if pp:
        orig = pmax if pmax and _float_safe(pmax) > _float_safe(pp) else None
        return pp, orig, curr
    if pmin:
        orig = pmax if pmax and _float_safe(pmax) > _float_safe(pmin) else None
        return pmin, orig, curr
    if pmax:
        return pmax, None, curr
    return None, None, curr


def _scan_flat_offer_dict(o: Dict[str, Any]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    currency = _currency_from_dict(o)
    for key in (
        "price",
        "priceValue",
        "salePrice",
        "promotionPrice",
        "discountPrice",
        "lowPrice",
    ):
        v = _extract_numeric_price(o.get(key))
        if v:
            hp = _extract_numeric_price(o.get("highPrice"))
            op = _extract_numeric_price(o.get("originalPrice")) or _extract_numeric_price(
                o.get("listPrice")
            )
            origs = [x for x in (hp, op) if x]
            orig: Optional[str] = None
            if origs:
                orig = max(origs, key=_float_safe)
            if orig and _float_safe(orig) <= _float_safe(v):
                orig = None
            return v, orig, currency
    hp = _extract_numeric_price(o.get("highPrice"))
    if hp:
        return hp, None, currency
    return None, None, currency


def _scan_single_offer_dict(o: Dict[str, Any]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    ps = o.get("priceSpecification")
    if isinstance(ps, dict):
        p, op, c = _scan_price_specification(ps)
        if p:
            return p, op, c or _currency_from_dict(o)
    return _scan_flat_offer_dict(o)


def _extract_price_bundle_from_product_node(node: Dict[str, Any]) -> Dict[str, Any]:
    """
    唯一真源：与 _has_price_signal / _product_like_node_to_raw 共用。
    返回 price、original_price、currency（字符串或 None）、has_price。
    """
    price: Optional[str] = None
    original_price: Optional[str] = None
    currency: Optional[str] = None

    for o in _offers_blocks(node.get("offers")):
        p, op, c = _scan_single_offer_dict(o)
        if p:
            price = p
            original_price = op
            currency = c
            break

    if price is None and isinstance(node.get("offer"), dict):
        p, op, c = _scan_single_offer_dict(node["offer"])
        if p:
            price = p
            original_price = op
            currency = currency or c

    if price is None:
        for key in ("price", "priceValue", "salePrice", "promotionPrice", "discountPrice"):
            v = _extract_numeric_price(node.get(key))
            if v:
                price = v
                break
    if original_price is None:
        for key in ("originalPrice", "listPrice", "highPrice"):
            v = _extract_numeric_price(node.get(key))
            if v:
                original_price = v
                break

    if not currency:
        c = node.get("currency") or node.get("currencyCode") or node.get("priceCurrency")
        if isinstance(c, str) and c.strip():
            currency = c.strip()

    has_price = bool(price and str(price).strip())

    return {
        "price": price,
        "original_price": original_price,
        "currency": currency,
        "has_price": has_price,
    }


def _normalize_images(val: Any) -> List[str]:
    out: List[str] = []
    if isinstance(val, str) and val.strip():
        out.append(val.strip())
    elif isinstance(val, list):
        for u in val:
            if isinstance(u, str) and u.strip():
                out.append(u.strip())
            elif isinstance(u, dict):
                uu = (
                    u.get("url")
                    or u.get("contentUrl")
                    or u.get("imageUrl")
                    or u.get("src")
                )
                if isinstance(uu, str) and uu.strip():
                    out.append(uu.strip())
    return out


# inline script 关键词（小写匹配）
_INLINE_KW = (
    "price",
    "saleprice",
    "originalprice",
    "reviewcount",
    "rating",
    "sku",
    "itemid",
    "product",
    "pdt",
    "gallery",
    "image",
    "seller",
    "offer",
    "voucher",
    "delivery",
)


def _inline_keyword_hits(text: str) -> List[str]:
    tl = text.lower()
    return [k for k in _INLINE_KW if k in tl]


def _balanced_brace_from(s: str, start_brace: int) -> Optional[str]:
    if start_brace < 0 or start_brace >= len(s) or s[start_brace] != "{":
        return None
    depth = 0
    in_str = False
    esc = False
    quote = ""
    for i in range(start_brace, len(s)):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == quote:
                in_str = False
                quote = ""
            continue
        if c in ('"', "'"):
            in_str = True
            quote = c
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[start_brace : i + 1]
    return None


def _try_json_loads_loose(blob: str) -> Optional[Any]:
    blob = blob.strip()
    if not blob:
        return None
    for attempt in (blob, re.sub(r",\s*([}\]])", r"\1", blob)):
        try:
            return json.loads(attempt)
        except json.JSONDecodeError:
            continue
    return None


def _collect_js_object_blobs(text: str) -> List[Tuple[str, str]]:
    """从 JS 文本中切出 {...} 片段（assignment / colon / JSON.parse({ / init）。"""
    out: List[Tuple[str, str]] = []
    seen_starts: Set[int] = set()

    def add(label: str, brace_start: int) -> None:
        if brace_start in seen_starts:
            return
        blob = _balanced_brace_from(text, brace_start)
        if not blob or len(blob) < 4:
            return
        seen_starts.add(brace_start)
        out.append((label, blob))

    for m in re.finditer(r"window\.[a-zA-Z_$][\w$]*\s*=\s*(\{)", text):
        add("window_assign", m.start(1))
    for m in re.finditer(r"(?:var|let|const)\s+[a-zA-Z_$][\w$]*\s*=\s*(\{)", text):
        add("var_assign", m.start(1))
    for m in re.finditer(r"JSON\.parse\s*\(\s*(\{)", text):
        add("json_parse_literal", m.start(1))
    for m in re.finditer(
        r"init\s*\(\s*[^,()]{0,160}?\s*,\s*(\{)",
        text,
        re.DOTALL,
    ):
        add("init_second_arg", m.start(1))
    n_colon = 0
    for m in re.finditer(r"[a-zA-Z_$][\w$]{0,48}\s*:\s*(\{)", text):
        add("colon_object", m.start(1))
        n_colon += 1
        if n_colon >= 150:
            break

    return out


def _extract_json_parse_quoted_payloads(text: str) -> List[str]:
    """取出 JSON.parse("...") / JSON.parse('...') 引号内原文（不含引号）。"""
    payloads: List[str] = []
    i = 0
    while True:
        j = text.find("JSON.parse", i)
        if j < 0:
            break
        lp = text.find("(", j)
        if lp < 0:
            i = j + 10
            continue
        p = lp + 1
        while p < len(text) and text[p] in " \t\n\r":
            p += 1
        if p >= len(text):
            break
        qch = text[p]
        if qch not in '"\'':
            i = j + 10
            continue
        p += 1
        buf: List[str] = []
        esc = False
        while p < len(text):
            c = text[p]
            if esc:
                buf.append(c)
                esc = False
            elif c == "\\":
                esc = True
            elif c == qch:
                break
            else:
                buf.append(c)
            p += 1
        inner = "".join(buf)
        i = p + 1 if p < len(text) else len(text)
        if len(inner) > 8:
            payloads.append(inner)
    return payloads


def _decode_json_parse_inner(inner: str) -> Optional[Any]:
    """将 JS 字符串内容解析为 JSON（多策略）。"""
    try:
        return json.loads(inner)
    except json.JSONDecodeError:
        pass
    try:
        dec = inner.encode("utf-8", "surrogatepass").decode("unicode_escape")
        return json.loads(dec)
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return None


def _has_title_signal(d: Dict[str, Any]) -> bool:
    for k in ("title", "name", "productName"):
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return True
    return False


def _has_price_signal(d: Dict[str, Any]) -> bool:
    return bool(_extract_price_bundle_from_product_node(d)["has_price"])


def _has_image_signal(d: Dict[str, Any]) -> bool:
    for k in ("image", "images", "gallery"):
        v = d.get(k)
        if v is None or v == "" or v == []:
            continue
        return True
    return False


def _is_product_like_node(d: Dict[str, Any]) -> bool:
    if not _has_title_signal(d):
        return False
    return _has_price_signal(d) or _has_image_signal(d)


def _images_from_product_node(d: Dict[str, Any]) -> List[str]:
    for key in ("images", "image", "gallery", "imageList", "imageUrls"):
        v = d.get(key)
        got = _normalize_images(v)
        if got:
            return got
        if isinstance(v, list) and v:
            acc: List[str] = []
            for it in v:
                if isinstance(it, dict):
                    u = it.get("url") or it.get("imageUrl") or it.get("src")
                    if isinstance(u, str) and u.strip().startswith(
                        ("http://", "https://", "//")
                    ):
                        acc.append(u.strip())
            if acc:
                return acc
    return []


def _product_like_node_to_raw(node: Dict[str, Any], source_tag: str) -> Optional[Dict[str, Any]]:
    if not _is_product_like_node(node):
        return None
    r = _empty_raw()
    r["_source"] = source_tag
    # schema.org Product：优先 name
    r["title"] = (
        node.get("name") if isinstance(node.get("name"), str) else None
    ) or (
        node.get("title") if isinstance(node.get("title"), str) else None
    ) or (
        node.get("productName") if isinstance(node.get("productName"), str) else None
    )

    bundle = _extract_price_bundle_from_product_node(node)
    r["price"] = bundle["price"]
    r["original_price"] = bundle["original_price"]
    r["currency"] = bundle["currency"]
    r["rating"] = None
    for k in ("rating", "reviewScore", "score", "avgRating", "averageRating", "starRating"):
        r["rating"] = _coerce_star_rating_0_5(node.get(k))
        if r["rating"] is not None:
            break
    r["review_count"] = None
    for k in (
        "reviewCount",
        "review_count",
        "totalReviews",
        "commentCount",
        "comments",
        "ratingCount",
    ):
        r["review_count"] = _coerce_int(node.get(k))
        if r["review_count"] is not None:
            break
    if isinstance(node.get("aggregateRating"), dict):
        agg = node["aggregateRating"]
        if r["rating"] is None:
            r["rating"] = _coerce_star_rating_0_5(
                agg.get("ratingValue") or agg.get("rating")
            )
        if r["review_count"] is None:
            r["review_count"] = _coerce_int(
                agg.get("reviewCount") or agg.get("ratingCount")
            )
    pid = node.get("itemId") or node.get("item_id") or node.get("productId") or node.get("sku")
    r["product_id"] = str(pid) if pid is not None else None
    r["item_id"] = r["product_id"]
    br = node.get("brand")
    if isinstance(br, dict):
        r["brand"] = br.get("name")
    elif isinstance(br, str):
        r["brand"] = br
    se = node.get("seller")
    if isinstance(se, dict) and not r.get("brand"):
        r["brand"] = se.get("shopName") or se.get("name")
    imgl = _images_from_product_node(node)
    r["images"] = imgl
    r["main_image"] = imgl[0] if imgl else None
    if isinstance(node.get("description"), str):
        r["description"] = node["description"].strip()
    return r


def _walk_product_like_nodes(
    obj: Any,
    path: str,
    depth: int,
    max_depth: int,
    out_logs: List[Tuple[str, Dict[str, Any]]],
) -> None:
    if depth > max_depth:
        return
    if isinstance(obj, dict):
        if _is_product_like_node(obj):
            out_logs.append((path, obj))
        for k, v in list(obj.items())[:140]:
            if isinstance(v, (dict, list)):
                nk = f"{path}.{k}" if path else str(k)
                _walk_product_like_nodes(v, nk, depth + 1, max_depth, out_logs)
    elif isinstance(obj, list):
        for i, it in enumerate(obj[:60]):
            if isinstance(it, (dict, list)):
                _walk_product_like_nodes(
                    it,
                    f"{path}[{i}]" if path else f"[{i}]",
                    depth + 1,
                    max_depth,
                    out_logs,
                )


def _process_inline_js_scripts(html: str, candidates: List[Dict[str, Any]]) -> None:
    script_idx = 0
    for m in re.finditer(
        r"<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)</script>",
        html,
        re.IGNORECASE,
    ):
        script_idx += 1
        text = m.group(1) or ""
        if len(text) <= 500:
            continue
        if not _inline_keyword_hits(text):
            continue

        blobs = _collect_js_object_blobs(text)
        json_parse_inners = _extract_json_parse_quoted_payloads(text)
        seen_raw: Set[str] = set()

        def _append_inline(node: Dict[str, Any], label: str, subpath: str) -> None:
            src = f"inline_js:{script_idx}:{label}:{subpath}"
            raw = _product_like_node_to_raw(node, src)
            if not raw:
                return
            key = f"{raw.get('title')}|{raw.get('price')}|{len(raw.get('images') or [])}"
            if key in seen_raw:
                return
            seen_raw.add(key)
            fin = _finalize_raw(raw, raw["_source"])
            candidates.append(fin)

        for inner in json_parse_inners:
            parsed = _decode_json_parse_inner(inner)
            if parsed is None:
                continue
            label = "json_parse_string"
            if isinstance(parsed, dict):
                logs: List[Tuple[str, Dict[str, Any]]] = []
                _walk_product_like_nodes(
                    parsed,
                    f"inline[{script_idx}].{label}",
                    0,
                    7,
                    logs,
                )
                for subpath, node in logs:
                    _append_inline(node, label, subpath)
            elif isinstance(parsed, list):
                for i, it in enumerate(parsed[:25]):
                    if isinstance(it, dict):
                        logs = []
                        _walk_product_like_nodes(
                            it,
                            f"inline[{script_idx}].{label}[{i}]",
                            0,
                            6,
                            logs,
                        )
                        for subpath, node in logs:
                            _append_inline(node, f"{label}[{i}]", subpath)

        for label, blob in blobs:
            obj = _try_json_loads_loose(blob)
            if isinstance(obj, dict):
                logs = []
                _walk_product_like_nodes(
                    obj,
                    f"inline[{script_idx}].{label}",
                    0,
                    7,
                    logs,
                )
                for subpath, node in logs:
                    _append_inline(node, label, subpath)
            elif isinstance(obj, list):
                for i, it in enumerate(obj[:20]):
                    if isinstance(it, dict):
                        logs = []
                        _walk_product_like_nodes(
                            it,
                            f"inline[{script_idx}].{label}[{i}]",
                            0,
                            6,
                            logs,
                        )
                        for subpath, node in logs:
                            _append_inline(node, f"{label}[{i}]", subpath)

        if len(blobs) == 0 and not json_parse_inners and text.strip().startswith("{"):
            root = _try_json_loads_loose(text.strip())
            if isinstance(root, dict):
                logs = []
                _walk_product_like_nodes(
                    root,
                    f"inline[{script_idx}].whole",
                    0,
                    7,
                    logs,
                )
                for subpath, node in logs:
                    _append_inline(node, "whole", subpath)
            elif isinstance(root, list):
                for i, it in enumerate(root[:25]):
                    if isinstance(it, dict):
                        pr = _parse_script_json_root(it, f"inline_whole[{script_idx}][{i}]")
                        if pr:
                            candidates.append(
                                _finalize_raw(pr, f"inline_whole[{script_idx}][{i}]")
                            )

def _extract_from_json_ld_product(obj: Dict[str, Any]) -> Dict[str, Any]:
    r = _empty_raw()
    r["_source"] = "application/ld+json"
    r["title"] = obj.get("name") or obj.get("title")
    brand = obj.get("brand")
    if isinstance(brand, dict):
        r["brand"] = brand.get("name")
    elif isinstance(brand, str):
        r["brand"] = brand

    b = _extract_price_bundle_from_product_node(obj)
    r["price"] = b["price"]
    r["original_price"] = b["original_price"]
    r["currency"] = b["currency"]

    agg = obj.get("aggregateRating")
    if isinstance(agg, dict):
        r["rating"] = _coerce_star_rating_0_5(agg.get("ratingValue") or agg.get("rating"))
        r["review_count"] = _coerce_int(agg.get("reviewCount") or agg.get("ratingCount"))
    if r.get("rating") is None:
        r["rating"] = _coerce_star_rating_0_5(
            obj.get("rating") or obj.get("reviewScore") or obj.get("avgRating")
        )
    if r.get("review_count") is None:
        r["review_count"] = _coerce_int(
            obj.get("reviewCount")
            or obj.get("review_count")
            or obj.get("totalReviews")
            or obj.get("commentCount")
            or obj.get("comments")
            or obj.get("ratingCount")
        )

    imgs = _normalize_images(obj.get("image"))
    r["images"] = imgs
    r["main_image"] = imgs[0] if imgs else None
    desc = obj.get("description")
    if isinstance(desc, str):
        r["description"] = desc.strip()
    return r


def _try_parse_json_ld_block(chunk: str) -> Optional[Dict[str, Any]]:
    chunk = chunk.strip()
    if not chunk:
        return None
    try:
        data = json.loads(chunk)
    except json.JSONDecodeError:
        return None
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and _is_product_type(item.get("@type")):
                return _extract_from_json_ld_product(item)
        return None
    if isinstance(data, dict) and _is_product_type(data.get("@type")):
        return _extract_from_json_ld_product(data)
    return None


def probe_ld_json(html: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
    found = False
    for m in re.finditer(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        found = True
        raw = _try_parse_json_ld_block(m.group(1) or "")
        if raw:
            return True, raw
    return found, None


def _script_by_id(html: str, script_id: str) -> Optional[str]:
    m = re.search(
        rf'<script[^>]*\bid=["\']{re.escape(script_id)}["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    )
    return (m.group(1) or "").strip() if m else None


def _shallow_pluck_product_fields(obj: Any, depth: int = 0, max_depth: int = 6) -> Optional[Dict[str, Any]]:
    """有限深度扫描 dict/list，寻找常见 Lazada PDP 字段（非全页 BFS）。"""
    if depth > max_depth:
        return None
    if isinstance(obj, dict):
        title = obj.get("title") or obj.get("name") or obj.get("subject")
        price = (
            obj.get("price")
            or obj.get("salePrice")
            or obj.get("sale_price")
            or obj.get("finalPrice")
        )
        orig = obj.get("originalPrice") or obj.get("original_price") or obj.get("listPrice")
        pid = obj.get("itemId") or obj.get("item_id") or obj.get("productId") or obj.get("product_id")
        imgs = obj.get("images") or obj.get("imageList") or obj.get("imageUrls")
        rating = None
        for k in ("rating", "reviewScore", "score", "avgRating", "averageRating", "starRating"):
            rating = _coerce_star_rating_0_5(obj.get(k))
            if rating is not None:
                break
        rc = None
        for k in (
            "reviewCount",
            "review_count",
            "totalReviews",
            "commentCount",
            "comments",
            "ratingCount",
        ):
            rc = _coerce_int(obj.get(k))
            if rc is not None:
                break
        brand = obj.get("brand")
        if isinstance(brand, dict):
            brand = brand.get("name")
        desc = obj.get("description")
        bullets = obj.get("bulletPoints") or obj.get("highlights") or obj.get("featureTags")

        if title or price or imgs:
            r = _empty_raw()
            r["_source"] = "script_json_shallow"
            r["title"] = title if isinstance(title, str) else None
            r["price"] = price
            r["original_price"] = orig
            r["currency"] = obj.get("currency") or obj.get("currencyCode")
            r["rating"] = rating
            r["review_count"] = rc
            r["product_id"] = str(pid) if pid is not None else None
            r["item_id"] = r["product_id"]
            r["brand"] = str(brand).strip() if brand else None
            if isinstance(desc, str):
                r["description"] = desc.strip()
            if isinstance(bullets, list):
                r["bullet_points"] = [str(x) for x in bullets if x is not None][:24]
            elif isinstance(bullets, str) and bullets.strip():
                r["bullet_points"] = [bullets.strip()]
            imgl = _normalize_images(imgs)
            r["images"] = imgl
            r["main_image"] = imgl[0] if imgl else None
            return r
        for v in list(obj.values())[:80]:
            sub = _shallow_pluck_product_fields(v, depth + 1, max_depth)
            if sub and (sub.get("title") or sub.get("price") or sub.get("images")):
                return sub
    elif isinstance(obj, list):
        for it in obj[:40]:
            sub = _shallow_pluck_product_fields(it, depth + 1, max_depth)
            if sub:
                return sub
    return None


def _parse_script_json_root(root: Any, source_label: str) -> Optional[Dict[str, Any]]:
    if root is None:
        return None
    if isinstance(root, dict):
        plucked = _shallow_pluck_product_fields(root, 0, 6)
        if plucked:
            plucked["_source"] = source_label
            return plucked
    return None


def _iter_hydration_script_contents(html: str) -> List[Tuple[str, str]]:
    """__NEXT_DATA__、常见 hydration / page-data id。"""
    out: List[Tuple[str, str]] = []
    for sid in (
        "__NEXT_DATA__",
        "__INITIAL_STATE__",
        "__APP_INITIAL_STATE__",
        "page_data",
    ):
        c = _script_by_id(html, sid)
        if c:
            out.append((sid, c))
    for m in re.finditer(
        r'<script[^>]*\bid=["\'][^"\']*(?:page-data|hydration|lazada)[^"\']*["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        chunk = (m.group(1) or "").strip()
        if chunk:
            out.append(("id_pattern_hydration", chunk))
    return out


def _iter_application_json_scripts(html: str) -> List[str]:
    chunks: List[str] = []
    for m in re.finditer(
        r'<script[^>]*type=["\']application/json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        c = (m.group(1) or "").strip()
        if c:
            chunks.append(c)
    return chunks


def _has_price(raw: Dict[str, Any]) -> bool:
    p = raw.get("price")
    return p is not None and bool(str(p).strip())


def _has_currency(raw: Dict[str, Any]) -> bool:
    c = raw.get("currency")
    return bool(c is not None and str(c).strip())


def _images_count(raw: Dict[str, Any]) -> int:
    imgs = raw.get("images")
    return len(imgs) if isinstance(imgs, list) else 0


def _primary_rank_tuple(raw: Dict[str, Any]) -> Tuple[int, int, int, int, int]:
    """
    若存在有价候选，仅在 pool=有价 内比较。
    键：(has_price, has_title, has_images, has_currency, images_count)
    """
    ic = _images_count(raw)
    return (
        1 if _has_price(raw) else 0,
        1 if raw.get("title") and str(raw.get("title")).strip() else 0,
        1 if ic > 0 else 0,
        1 if _has_currency(raw) else 0,
        ic,
    )


def _pick_best_candidate(candidates: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], Tuple[int, int, int, int, int]]:
    if not candidates:
        return None, (0, 0, 0, 0, 0)
    for c in candidates:
        if c.get("_source") == "detail_api" and _has_price(c):
            t = c.get("title")
            if t and str(t).strip():
                return c, _primary_rank_tuple(c)
    priced = [c for c in candidates if _has_price(c)]
    pool = priced if priced else candidates
    best = max(pool, key=lambda c: _primary_rank_tuple(c))
    return best, _primary_rank_tuple(best)


def _collect_image_urls_from_candidate(c: Dict[str, Any]) -> List[str]:
    out: List[str] = []
    seen: Set[str] = set()
    for key in ("images", "image", "image_list", "main_images", "pictures"):
        v = c.get(key)
        if v is None:
            continue
        for u in _normalize_images(v):
            if u and u not in seen:
                seen.add(u)
                out.append(u)
    return out


def _rating_value_for_merge(val: Any) -> Optional[float]:
    """merge 补 rating：优先星级规则，否则 0~5 内第一个可解析 float。"""
    r = _coerce_star_rating_0_5(val)
    if r is not None:
        return r
    f = _coerce_float(val)
    if f is None:
        return None
    if 0.0 <= f <= 5.0:
        return f
    return None


def _merge_complementary_fields(
    base: Dict[str, Any], candidates: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """以 base 为基底，仅从其它候选补齐缺失字段；不覆盖 base 已有 price（及已有价时的 currency）。"""
    out = dict(base)
    api_lock = base.get("_source") == "detail_api"
    for other in candidates:
        if other is base:
            continue
        imgs = out.get("images")
        need_images = not isinstance(imgs, list) or len(imgs) == 0
        if api_lock and isinstance(imgs, list) and len(imgs) > 0:
            need_images = False
        if need_images:
            extra = _collect_image_urls_from_candidate(other)
            if extra:
                cur: List[str] = []
                if isinstance(imgs, list):
                    cur = [u for u in imgs if isinstance(u, str) and u.strip()]
                seen = set(cur)
                for u in extra:
                    if u not in seen:
                        seen.add(u)
                        cur.append(u)
                out["images"] = cur

        if not out.get("main_image"):
            mi = other.get("main_image")
            if isinstance(mi, str) and mi.strip():
                out["main_image"] = mi.strip()
            elif isinstance(out.get("images"), list) and out["images"]:
                out["main_image"] = out["images"][0]

        if not (out.get("brand") and str(out.get("brand")).strip()):
            b = other.get("brand")
            if isinstance(b, str) and b.strip():
                out["brand"] = b.strip()
            elif isinstance(b, dict):
                nm = b.get("name")
                if isinstance(nm, str) and nm.strip():
                    out["brand"] = nm.strip()

        if not (out.get("description") and str(out.get("description")).strip()):
            d = other.get("description")
            if isinstance(d, str) and d.strip():
                out["description"] = d.strip()

        if not (out.get("original_price") and str(out.get("original_price")).strip()):
            op = other.get("original_price")
            if op is not None and str(op).strip():
                out["original_price"] = op

        if not _has_currency(out):
            cc = other.get("currency")
            if isinstance(cc, str) and cc.strip():
                out["currency"] = cc.strip()

        if not (out.get("title") and str(out.get("title")).strip()):
            t = other.get("title")
            if isinstance(t, str) and t.strip():
                out["title"] = t.strip()

    if out.get("rating") is None:
        for other in candidates:
            if other is base:
                continue
            rr = _rating_value_for_merge(other.get("rating"))
            if rr is not None:
                out["rating"] = rr
                break

    if out.get("review_count") is None:
        for other in candidates:
            if other is base:
                continue
            rc = _coerce_int(other.get("review_count"))
            if rc is not None:
                out["review_count"] = rc
                break

    if not out.get("main_image") and isinstance(out.get("images"), list) and out["images"]:
        out["main_image"] = out["images"][0]
    return out


def _read_js_quoted_string_at(text: str, open_idx: int) -> Optional[Tuple[str, int]]:
    """从 open_idx 处的引号开始读取 JS 字符串内容，返回 (内容, 闭合引号后下标)。"""
    if open_idx < 0 or open_idx >= len(text):
        return None
    qch = text[open_idx]
    if qch not in '"\'':
        return None
    p = open_idx + 1
    buf: List[str] = []
    esc = False
    while p < len(text):
        c = text[p]
        if esc:
            buf.append(c)
            esc = False
        elif c == "\\":
            esc = True
        elif c == qch:
            return "".join(buf), p + 1
        else:
            buf.append(c)
        p += 1
    return None


def _infer_currency_from_pdt_price(val: Any) -> Optional[str]:
    s = str(val).strip().upper()
    if not s:
        return None
    m = re.match(
        r"^(SGD|USD|EUR|MYR|PHP|THB|VND|IDR|CNY|HKD|AUD|GBP|RM)(?:\s|$|[\d$])",
        s,
    )
    if m:
        c = m.group(1)
        return "MYR" if c == "RM" else c
    if s.startswith("S$") or s.startswith("SGD"):
        return "SGD"
    if s.startswith("US$") or s.startswith("USD"):
        return "USD"
    return None


def _walk_collect_pdt_dicts(root: Any, depth: int, max_depth: int, acc: List[Dict[str, Any]]) -> None:
    if depth > max_depth:
        return
    if isinstance(root, dict):
        if root.get("pdt_name") is not None and root.get("pdt_price") is not None:
            acc.append(root)
        for v in list(root.values())[:200]:
            if isinstance(v, (dict, list)):
                _walk_collect_pdt_dicts(v, depth + 1, max_depth, acc)
    elif isinstance(root, list):
        for it in root[:100]:
            _walk_collect_pdt_dicts(it, depth + 1, max_depth, acc)


def _extract_pdp_tracking_data_objects(script_text: str) -> List[Dict[str, Any]]:
    """从单段 inline script 中解析 pdpTrackingData / dataLayer / JSON.parse 等出现的 pdt_* 对象。"""
    collected: List[Dict[str, Any]] = []
    seen_sig: Set[str] = set()

    def _register_roots(parsed: Any) -> None:
        acc: List[Dict[str, Any]] = []
        _walk_collect_pdt_dicts(parsed, 0, 10, acc)
        for d in acc:
            sig = f"{d.get('pdt_name')}|{d.get('pdt_price')}"
            if sig in seen_sig:
                continue
            seen_sig.add(sig)
            collected.append(d)

    # JSON.parse("...") 串
    for inner in _extract_json_parse_quoted_payloads(script_text):
        try:
            parsed = _decode_json_parse_inner(inner)
        except Exception:
            continue
        if parsed is not None:
            _register_roots(parsed)

    # pdpTrackingData = "..." 或 = {...}
    for m in re.finditer(r"pdpTrackingData\s*=\s*", script_text):
        pos = m.end()
        while pos < len(script_text) and script_text[pos] in " \t\n\r":
            pos += 1
        if pos >= len(script_text):
            continue
        ch = script_text[pos]
        try:
            if ch in '"\'':
                got = _read_js_quoted_string_at(script_text, pos)
                if not got:
                    continue
                inner, _ = got
                parsed = _decode_json_parse_inner(inner)
                if parsed is not None:
                    _register_roots(parsed)
            elif ch == "{":
                blob = _balanced_brace_from(script_text, pos)
                if blob:
                    parsed = _try_json_loads_loose(blob)
                    if parsed is not None:
                        _register_roots(parsed)
        except Exception:
            continue

    # dataLayer.push({...}) / window.dataLayer.push({...})
    for m in re.finditer(r"(?:window\.)?dataLayer\.push\s*\(\s*", script_text):
        pos = m.end()
        while pos < len(script_text) and script_text[pos] in " \t\n\r":
            pos += 1
        if pos < len(script_text) and script_text[pos] == "{":
            try:
                blob = _balanced_brace_from(script_text, pos)
                if blob:
                    parsed = _try_json_loads_loose(blob)
                    if parsed is not None:
                        _register_roots(parsed)
            except Exception:
                continue

    return collected


def _tracking_obj_to_raw(
    obj: Dict[str, Any], source: str, script_text: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    pdt_name = obj.get("pdt_name")
    if not isinstance(pdt_name, str) or not pdt_name.strip():
        return None
    price = _extract_numeric_price(obj.get("pdt_price"))
    if not price:
        return None

    core = obj.get("core") if isinstance(obj.get("core"), dict) else {}
    currency: Optional[str] = None
    cc = core.get("currencyCode")
    if isinstance(cc, str) and cc.strip():
        currency = cc.strip()
    if not currency:
        currency = _infer_currency_from_pdt_price(obj.get("pdt_price"))

    pid = obj.get("pdt_sku") or obj.get("pdt_simplesku")
    brand = obj.get("brand_name")
    if isinstance(brand, str):
        brand = brand.strip() or None
    else:
        brand = None

    tr, trc = _extract_rating_review_from_tracking_dict(obj)
    if script_text:
        sr, src = _extract_rating_review_from_script_text(script_text)
        if tr is None:
            tr = sr
        if trc is None:
            trc = src

    r = _empty_raw()
    r["_source"] = source
    r["title"] = pdt_name.strip()
    r["price"] = price
    r["original_price"] = None
    r["currency"] = currency
    r["rating"] = tr
    r["review_count"] = trc
    r["product_id"] = str(pid) if pid is not None else None
    r["item_id"] = r["product_id"]
    r["brand"] = brand
    r["images"] = []
    r["main_image"] = None
    r["description"] = None
    r["raw_data"] = {
        "pdt_name": obj.get("pdt_name"),
        "pdt_price": obj.get("pdt_price"),
        "pdt_sku": obj.get("pdt_sku"),
        "pdt_simplesku": obj.get("pdt_simplesku"),
        "brand_name": obj.get("brand_name"),
        "core": obj.get("core") if isinstance(obj.get("core"), dict) else None,
    }
    return r


def _extract_tracking_price_candidates(html: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    seen_key: Set[str] = set()
    script_idx = 0
    for m in re.finditer(
        r"<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)</script>",
        html,
        re.IGNORECASE,
    ):
        script_idx += 1
        text = m.group(1) or ""
        tl = text.lower()
        if "pdt_" not in tl and "pdptracking" not in tl and "datalayer" not in tl:
            continue
        try:
            objs = _extract_pdp_tracking_data_objects(text)
        except Exception:
            continue
        for obj in objs:
            source = f"tracking_inline[{script_idx}]"
            raw = _tracking_obj_to_raw(obj, source, script_text=text)
            if not raw:
                continue
            k = f"{raw.get('title')}|{raw.get('price')}|{source}"
            if k in seen_key:
                continue
            seen_key.add(k)
            fin = _finalize_raw(raw, source)
            out.append(fin)
    return out


def _finalize_raw(raw: Dict[str, Any], source: str) -> Dict[str, Any]:
    out = dict(raw)
    out["_source"] = source
    out["raw_reviews"] = []
    if not isinstance(out.get("images"), list):
        out["images"] = []
    if out.get("main_image") is None and out["images"]:
        out["main_image"] = out["images"][0]
    if not isinstance(out.get("bullet_points"), list):
        out["bullet_points"] = []
    return out


def _lazada_norm_price_field(val: Any) -> Optional[str]:
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        if isinstance(val, float) and (val != val or val in (float("inf"), float("-inf"))):
            return None
        s = str(val).strip()
        return s if s else None
    s = str(val).strip()
    return s if s else None


def _resolve_lazada_sku_id(module_obj: Dict[str, Any]) -> str:
    pk = module_obj.get("primaryKey")
    if isinstance(pk, dict):
        for key in ("skuId", "defaultSkuId"):
            v = pk.get(key)
            if v is not None and str(v).strip():
                return str(v).strip()
    infos = module_obj.get("skuInfos")
    if isinstance(infos, dict) and infos:
        ks = [str(k) for k in infos.keys()]
        nz = [k for k in ks if k != "0"]
        if nz:
            return nz[0]
        return ks[0]
    return "0"


def _lazada_sku_info_get(sku_infos: Dict[str, Any], sku_id: str) -> Optional[Dict[str, Any]]:
    if sku_id in sku_infos:
        v = sku_infos[sku_id]
        return v if isinstance(v, dict) else None
    try:
        ik = int(sku_id)
        if ik in sku_infos:
            v = sku_infos[ik]
            return v if isinstance(v, dict) else None
    except ValueError:
        pass
    return None


def _parse_lazada_detail_api_to_raw(detail_api_json: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """解析 mtop.global.detail.web.getdetailinfo 响应（data.module 可为 JSON 字符串）。"""
    data = detail_api_json.get("data")
    if not isinstance(data, dict):
        return None
    mod = data.get("module")
    if isinstance(mod, str) and mod.strip():
        try:
            module_obj = json.loads(mod)
        except json.JSONDecodeError:
            return None
    elif isinstance(mod, dict):
        module_obj = mod
    else:
        return None

    sku_id = _resolve_lazada_sku_id(module_obj)
    gc = (
        module_obj.get("globalConfig")
        if isinstance(module_obj.get("globalConfig"), dict)
        else {}
    )
    tr = module_obj.get("tracking") if isinstance(module_obj.get("tracking"), dict) else {}
    core = tr.get("core") if isinstance(tr.get("core"), dict) else {}

    rating: Optional[float] = None
    review_count: Optional[int] = None
    rev = module_obj.get("review")
    if isinstance(rev, dict):
        rating = _coerce_float(rev.get("averageRating"))
        review_count = _coerce_int(rev.get("reviews"))
    prod = module_obj.get("product")
    if isinstance(prod, dict):
        pr = prod.get("rating")
        if isinstance(pr, dict):
            if rating is None:
                rating = _coerce_float(pr.get("score"))
            if review_count is None:
                review_count = _coerce_int(pr.get("total"))
    if rating is not None:
        if not (0.0 < rating <= 5.0):
            rating = None

    title: Optional[str] = None
    brand: Optional[str] = None
    if isinstance(prod, dict):
        t = prod.get("title")
        if isinstance(t, str) and t.strip():
            title = t.strip()
        b = prod.get("brand")
        if isinstance(b, dict):
            bn = b.get("name")
            if isinstance(bn, str) and bn.strip():
                brand = bn.strip()

    images: List[str] = []
    sg = module_obj.get("skuGalleries")
    if isinstance(sg, dict):
        gal = sg.get(sku_id) or sg.get(str(sku_id)) or sg.get("0")
        if isinstance(gal, list):
            for it in gal:
                if isinstance(it, dict):
                    u = it.get("src") or it.get("poster")
                    if isinstance(u, str) and u.strip():
                        images.append(u.strip())

    sale_price: Optional[str] = None
    original_price: Optional[str] = None
    currency: Optional[str] = None
    sku_infos = module_obj.get("skuInfos")
    if isinstance(sku_infos, dict):
        sinfo = _lazada_sku_info_get(sku_infos, sku_id)
        if isinstance(sinfo, dict):
            price = sinfo.get("price")
            if isinstance(price, dict):
                sp = price.get("salePrice")
                op = price.get("originalPrice")
                if isinstance(sp, dict):
                    sale_price = _lazada_norm_price_field(sp.get("value"))
                    sign = sp.get("sign")
                    if (
                        sign == "$"
                        and isinstance(gc.get("currency"), str)
                        and gc.get("currency", "").strip()
                    ):
                        currency = str(gc.get("currency")).strip()
                if isinstance(op, dict):
                    original_price = _lazada_norm_price_field(op.get("value"))
    if not currency and isinstance(gc.get("currency"), str) and gc.get("currency", "").strip():
        currency = str(gc.get("currency")).strip()
    if not currency and isinstance(core.get("currencyCode"), str) and core.get("currencyCode", "").strip():
        currency = str(core.get("currencyCode")).strip()

    raw = _empty_raw()
    raw["_source"] = "detail_api"
    raw["title"] = title
    raw["brand"] = brand
    raw["price"] = sale_price
    raw["original_price"] = original_price
    raw["currency"] = currency
    raw["rating"] = rating
    raw["review_count"] = review_count
    raw["images"] = images
    raw["main_image"] = images[0] if images else None
    raw["item_id"] = sku_id
    return raw


def extract(html: str, detail_api_json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not isinstance(html, str):
        html = ""

    candidates: List[Dict[str, Any]] = []

    if isinstance(detail_api_json, dict) and detail_api_json:
        api_raw = _parse_lazada_detail_api_to_raw(detail_api_json)
        if api_raw:
            fin = _finalize_raw(api_raw, "detail_api")
            candidates.append(fin)
            logger.info(
                "[LazadaApiParse] source=detail_api sku_id=%s title=%r rating=%r review_count=%r "
                "sale_price=%r original_price=%r currency=%r images_count=%d",
                str(api_raw.get("item_id") or ""),
                fin.get("title"),
                fin.get("rating"),
                fin.get("review_count"),
                fin.get("price"),
                fin.get("original_price"),
                fin.get("currency"),
                _images_count(fin),
            )
            logger.info(
                "[LazadaApiCandidate] has_title=%s has_price=%s has_original_price=%s "
                "has_rating=%s has_review_count=%s has_images=%s",
                bool(fin.get("title") and str(fin.get("title")).strip()),
                _has_price(fin),
                bool(fin.get("original_price") and str(fin.get("original_price")).strip()),
                fin.get("rating") is not None,
                fin.get("review_count") is not None,
                _images_count(fin) > 0,
            )

    # 1) application/ld+json
    found_ld, ld_raw = probe_ld_json(html)
    if ld_raw:
        candidates.append(_finalize_raw(ld_raw, "application/ld+json"))

    # 2) hydration / __NEXT_DATA__ / named scripts
    hydration_list = _iter_hydration_script_contents(html)
    for label, chunk in hydration_list:
        try:
            root = json.loads(chunk)
        except json.JSONDecodeError:
            continue
        pr = _parse_script_json_root(root, label)
        if pr:
            candidates.append(_finalize_raw(pr, label))

    # 3) other application/json scripts
    aj = _iter_application_json_scripts(html)
    for i, chunk in enumerate(aj):
        try:
            root = json.loads(chunk)
        except json.JSONDecodeError:
            continue
        label = f"application_json[{i}]"
        pr = _parse_script_json_root(root, label)
        if pr:
            candidates.append(_finalize_raw(pr, label))

    # 4) 无 src 的 inline JS：关键词 + {...} 片段 / JSON.parse / 商品子树
    _process_inline_js_scripts(html, candidates)

    # 5) pdpTrackingData / dataLayer 等业务追踪脚本价格兜底
    for tc in _extract_tracking_price_candidates(html):
        candidates.append(tc)

    if not candidates and found_ld:
        # fallback：重新尝试宽松 ld+json（仅 Product）
        for m in re.finditer(
            r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html,
            re.IGNORECASE | re.DOTALL,
        ):
            raw = _try_parse_json_ld_block(m.group(1) or "")
            if raw:
                candidates.append(_finalize_raw(raw, "application/ld+json_fallback"))
                break

    best, _ = _pick_best_candidate(candidates)

    if best is None:
        out = _empty_raw()
        out["_source"] = "none"
        logger.info(
            "[LazadaExtractorFinal] source=none title=None price=None original_price=None "
            "currency=None images_count=0 rating=None review_count=None",
        )
        return out

    merged = _merge_complementary_fields(best, candidates)

    logger.info(
        "[LazadaExtractorSelected] source=%s title=%r has_price=%s",
        best.get("_source"),
        best.get("title"),
        _has_price(best),
    )
    logger.info(
        "[LazadaExtractorFinal] source=%s title=%r price=%r original_price=%r currency=%r "
        "images_count=%d rating=%r review_count=%r",
        merged.get("_source"),
        merged.get("title"),
        merged.get("price"),
        merged.get("original_price"),
        merged.get("currency"),
        len(merged.get("images") or []) if isinstance(merged.get("images"), list) else 0,
        merged.get("rating"),
        merged.get("review_count"),
    )
    return merged
