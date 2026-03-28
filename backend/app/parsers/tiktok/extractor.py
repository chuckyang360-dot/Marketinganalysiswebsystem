import json
import logging
import re
from collections import deque
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


def _looks_like_page_data(obj: Any) -> bool:
    if not isinstance(obj, dict):
        return False
    data = obj.get("data")
    if isinstance(data, dict):
        if any(k in data for k in ("components", "component_list", "page_data")):
            return True
        if "component" in str(data.keys()).lower():
            return True
    if "components" in obj:
        return True
    return False


def _balanced_json_from(html: str, start_brace: int) -> Optional[str]:
    if start_brace < 0 or start_brace >= len(html):
        return None
    depth = 0
    in_str = False
    esc = False
    quote = ""
    for i in range(start_brace, len(html)):
        c = html[i]
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
                return html[start_brace : i + 1]
    return None


def _extract_script_json_by_id(html: str, script_id: str) -> Optional[Any]:
    m = re.search(
        rf'<script[^>]*\bid=["\']{re.escape(script_id)}["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    )
    if not m:
        return None
    chunk = (m.group(1) or "").strip()
    if not chunk:
        return None
    try:
        return json.loads(chunk)
    except json.JSONDecodeError:
        return None


def _extract_sigi_state(html: str) -> Optional[Any]:
    o = _extract_script_json_by_id(html, "SIGI_STATE")
    if o is not None:
        return o
    m = re.search(r"SIGI_STATE\s*=\s*(\{)", html, re.IGNORECASE)
    if not m:
        return None
    blob = _balanced_json_from(html, m.start(1))
    if not blob:
        return None
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        return None


def _extract_universal_data(html: str) -> Optional[Any]:
    """常见键名 universal_data / __UNIVERSAL_DATA_FOR_REHYDRATION__ 等。"""
    for pat in (
        r'"universal_data"\s*:\s*(\{)',
        r"'universal_data'\s*:\s*(\{)",
        r"__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*(\{)",
    ):
        m = re.search(pat, html, re.IGNORECASE)
        if not m:
            continue
        blob = _balanced_json_from(html, m.start(1))
        if not blob:
            continue
        try:
            return json.loads(blob)
        except json.JSONDecodeError:
            continue
    m = re.search(
        r'<script[^>]*id=["\'][^"\']*universal[^"\']*["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    )
    if m:
        chunk = (m.group(1) or "").strip()
        if chunk.startswith("{"):
            try:
                return json.loads(chunk)
            except json.JSONDecodeError:
                return None
    return None


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


def _wrap_if_lone_component(d: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """将单组件节点包装成 page_data 形态供 _collect_components 使用。"""
    if _looks_like_page_data(d):
        return d
    ct = d.get("component_type") or d.get("component_name")
    ppi = d.get("product_price_info")
    if (ct or ppi) and (
        d.get("title")
        or (isinstance(ppi, dict) and ppi)
        or (isinstance(d.get("image"), dict) and d.get("image"))
    ):
        return {"data": {"components": [d]}}
    return None


def _bfs_find_page_data_candidates(root: Any, *, max_nodes: int = 8000) -> List[Dict[str, Any]]:
    """在任意 JSON 根上 BFS，收集所有疑似 page_data 或 lone product component。"""
    out: List[Dict[str, Any]] = []
    seen: Set[int] = set()
    q: deque = deque([root])
    nvisited = 0
    while q and nvisited < max_nodes:
        obj = q.popleft()
        nvisited += 1
        if isinstance(obj, dict):
            oid = id(obj)
            if oid in seen:
                continue
            seen.add(oid)
            if _looks_like_page_data(obj):
                out.append(obj)
            else:
                wrapped = _wrap_if_lone_component(obj)
                if wrapped is not None:
                    out.append(wrapped)
            for v in obj.values():
                if isinstance(v, (dict, list)):
                    q.append(v)
        elif isinstance(obj, list):
            for it in obj[:200]:
                if isinstance(it, (dict, list)):
                    q.append(it)
    return out


def _html_json_entry_points(html: str) -> List[Tuple[str, Any]]:
    """多入口：__NEXT_DATA__、SIGI_STATE、universal_data，以及 application/json 脚本 BFS。"""
    labeled: List[Tuple[str, Any]] = []
    nd = _extract_script_json_by_id(html, "__NEXT_DATA__")
    if nd is not None:
        labeled.append(("__NEXT_DATA__", nd))
    sigi = _extract_sigi_state(html)
    if sigi is not None:
        labeled.append(("SIGI_STATE", sigi))
    uni = _extract_universal_data(html)
    if uni is not None:
        labeled.append(("universal_data", uni))
    seen_root_id: Set[int] = set()
    for i, chunk in enumerate(_iter_application_json_scripts(html)):
        try:
            root = json.loads(chunk)
        except json.JSONDecodeError:
            continue
        rid = id(root)
        if rid in seen_root_id:
            continue
        seen_root_id.add(rid)
        labeled.append((f"application_json_script[{i}]", root))
    return labeled


def _data_source_type(comp: Dict[str, Any]) -> str:
    fc = comp.get("fe_config")
    if not isinstance(fc, dict):
        return ""
    ds = fc.get("data_source")
    if not isinstance(ds, dict):
        return ""
    t = ds.get("type")
    return str(t).strip().lower() if t is not None else ""


def _is_excluded_component(comp: Dict[str, Any]) -> bool:
    ct = str(comp.get("component_type") or "").lower()
    cn = str(comp.get("component_name") or "").lower()
    dst = _data_source_type(comp)
    if ct == "feed_list" and dst == "more_from":
        return True
    if "more_from" in cn:
        return True
    if any(x in cn for x in ("guess_you", "you_may_like", "similar_item", "similar_product")):
        return True
    if "recommend" in cn and "feed" in cn:
        return True
    if "feed_list_more" in cn:
        return True
    return False


def _get_title_text(comp: Dict[str, Any]) -> str:
    t = comp.get("title")
    if isinstance(t, str) and t.strip():
        return t.strip()
    for sub in ("data", "props", "product"):
        b = comp.get(sub)
        if isinstance(b, dict):
            tt = b.get("title")
            if isinstance(tt, str) and tt.strip():
                return tt.strip()
    return ""


def _has_product_price_info(comp: Dict[str, Any]) -> bool:
    p = comp.get("product_price_info")
    return isinstance(p, dict) and bool(p)


def _has_seller_info(comp: Dict[str, Any]) -> bool:
    s = comp.get("seller_info")
    return isinstance(s, dict) and bool(s)


def _has_sku_info(comp: Dict[str, Any]) -> bool:
    s = comp.get("sku_info")
    return isinstance(s, dict) and bool(s)


def _has_image_url_list(comp: Dict[str, Any]) -> bool:
    im = comp.get("image")
    if not isinstance(im, dict):
        return False
    ul = im.get("url_list")
    return isinstance(ul, list) and len(ul) > 0


def _component_flags(comp: Dict[str, Any]) -> Tuple[bool, bool, bool, bool, bool]:
    ht = bool(_get_title_text(comp))
    hp = _has_product_price_info(comp)
    hs = _has_seller_info(comp)
    hi = _has_image_url_list(comp)
    hk = _has_sku_info(comp)
    return ht, hp, hs, hi, hk


def _tier_full(ht: bool, hp: bool, hs: bool, hi: bool, hk: bool) -> bool:
    return ht and hp and hs and hi and hk


def _quality_count(comp: Dict[str, Any]) -> int:
    ht, hp, hs, hi, hk = _component_flags(comp)
    return int(ht) + int(hp) + int(hs) + int(hi) + int(hk)


def _collect_components(page_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """从 page_data.data 收集带 component 元数据的节点（浅层 list + 有限深度 BFS）。"""
    out: List[Dict[str, Any]] = []
    data = page_data.get("data")
    if not isinstance(data, dict):
        return out
    for key in ("components", "component_list"):
        v = data.get(key)
        if isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    out.append(item)
    seen: Set[int] = set()
    q: deque = deque([(data, 0)])
    while q:
        obj, depth = q.popleft()
        if not isinstance(obj, dict):
            continue
        oid = id(obj)
        if oid in seen:
            continue
        seen.add(oid)
        if (obj.get("component_type") or obj.get("component_name")) and obj not in out:
            out.append(obj)
        if depth >= 8:
            continue
        for v in obj.values():
            if isinstance(v, dict):
                q.append((v, depth + 1))
            elif isinstance(v, list):
                for it in v[:120]:
                    if isinstance(it, dict):
                        q.append((it, depth + 1))
    uniq: List[Dict[str, Any]] = []
    seen_id: Set[int] = set()
    for c in out:
        cid = id(c)
        if cid not in seen_id:
            seen_id.add(cid)
            uniq.append(c)
    return uniq


def _score_component(comp: Dict[str, Any]) -> int:
    ht, hp, hs, hi, hk = _component_flags(comp)
    if _tier_full(ht, hp, hs, hi, hk):
        return 100
    n = sum([ht, hp, hs, hi, hk])
    return n


def _pick_best_component(components: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], int, str]:
    """优先满分组件；否则取分数最高；平局取标题更长。"""
    best: Optional[Dict[str, Any]] = None
    best_key = (-1, -1)
    best_idx = -1
    for idx, comp in enumerate(components):
        if _is_excluded_component(comp):
            continue
        sc = _score_component(comp)
        title = _get_title_text(comp)
        key = (sc, len(title))
        if key > best_key:
            best_key = key
            best = comp
            best_idx = idx
    if best is None:
        return None, -1, ""
    path = f"page_data.data.component[{best_idx}]"
    return best, best_idx, path


def _candidate_rank(
    page_data: Dict[str, Any],
) -> Tuple[int, int, int]:
    """
    返回 (quality_ge2, quality_count, component_score) 用于排序。
    quality_ge2: 1 若最佳组件 _quality_count >= 2，否则 0（优先满足 >=2）。
    """
    components = _collect_components(page_data)
    best, _, _ = _pick_best_component(components)
    if best is None:
        return (0, 0, -1)
    qc = _quality_count(best)
    ge2 = 1 if qc >= 2 else 0
    sc = _score_component(best)
    return (ge2, qc, sc)


def _enumerate_page_data_candidates_from_html(html: str) -> List[Tuple[str, Dict[str, Any]]]:
    """从 HTML 多入口 + BFS 收集所有 page_data 候选。"""
    results: List[Tuple[str, Dict[str, Any]]] = []
    seen_pd: Set[int] = set()

    def add(label: str, pd: Dict[str, Any]) -> None:
        pid = id(pd)
        if pid in seen_pd:
            return
        seen_pd.add(pid)
        results.append((label, pd))

    for label, root in _html_json_entry_points(html):
        if root is None:
            continue
        if isinstance(root, dict) and _looks_like_page_data(root):
            add(f"{label}/direct", root)
        for sub in _bfs_find_page_data_candidates(root):
            add(f"{label}/bfs", sub)
    return results


def _build_raw_from_component(comp: Dict[str, Any]) -> Dict[str, Any]:
    ppi = comp.get("product_price_info") if isinstance(comp.get("product_price_info"), dict) else {}
    ri = comp.get("rate_info") if isinstance(comp.get("rate_info"), dict) else {}
    sold = comp.get("sold_info") if isinstance(comp.get("sold_info"), dict) else {}
    img = comp.get("image") if isinstance(comp.get("image"), dict) else {}
    urls = img.get("url_list") if isinstance(img.get("url_list"), list) else []
    seller = comp.get("seller_info") if isinstance(comp.get("seller_info"), dict) else {}
    brand = comp.get("brand_info") if isinstance(comp.get("brand_info"), dict) else {}
    seo = comp.get("seo_url") if isinstance(comp.get("seo_url"), dict) else {}

    pid = comp.get("product_id")
    title = _get_title_text(comp) or comp.get("title")

    return {
        "product_id": pid,
        "item_id": pid,
        "title": title,
        "images": list(urls),
        "main_image": urls[0] if urls else None,
        "price": ppi.get("sale_price_format"),
        "original_price": ppi.get("origin_price_format"),
        "currency": ppi.get("currency_name"),
        "currency_symbol": ppi.get("currency_symbol"),
        "product_price_info": ppi,
        "rate_info": ri,
        "sold_info": sold,
        "rating": ri.get("score"),
        "review_count": ri.get("review_count"),
        "sold_count": sold.get("sold_count"),
        "seller": seller.get("shop_name") or seller.get("name"),
        "shop_name": seller.get("shop_name"),
        "brand": brand.get("name") if brand else None,
        "brand_info": brand,
        "seller_info": seller,
        "sku_info": comp.get("sku_info"),
        "canonical_url": seo.get("canonical_url"),
        "seo_url": seo,
        "image": img,
        "raw_reviews": [],
    }


def _pick_best_page_data(
    candidates: List[Tuple[str, Dict[str, Any]]],
) -> Tuple[Optional[Dict[str, Any]], str]:
    """在多个 page_data 候选中选优：优先 _quality_count >= 2，其次 rank 元组。"""
    if not candidates:
        return None, ""
    scored: List[Tuple[Tuple[int, int, int], str, Dict[str, Any]]] = []
    for label, pd in candidates:
        rank = _candidate_rank(pd)
        scored.append((rank, label, pd))
    scored.sort(key=lambda x: x[0], reverse=True)
    best_rank, best_label, best_pd = scored[0]
    logger.info(
        "[TikTokPageDataPick] best_source=%s rank=%s (quality_ge2, qc, score)",
        best_label,
        best_rank,
    )
    for rank, label, _ in scored[:6]:
        logger.info("[TikTokPageDataPick] candidate source=%s rank=%s", label, rank)
    return best_pd, best_label


def extract(adapter_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    主链路：HTML 多入口（__NEXT_DATA__ / SIGI_STATE / universal_data + json script BFS）；
    adapter 提供的 page_data（若有）参与同一候选池择优。
    """
    page_data = adapter_payload.get("page_data")
    html = adapter_payload.get("html") if isinstance(adapter_payload.get("html"), str) else ""
    html = html or ""

    candidates: List[Tuple[str, Dict[str, Any]]] = []
    if isinstance(page_data, dict) and _looks_like_page_data(page_data):
        candidates.append(("adapter_page_data", page_data))

    if html.strip():
        candidates.extend(_enumerate_page_data_candidates_from_html(html))

    if not candidates:
        logger.info(
            "[TikTokExtractorFinal] source=none path=none title=None price=None images_count=0",
        )
        return _build_raw_from_component({})

    best_pd, best_label = _pick_best_page_data(candidates)
    if best_pd is None:
        logger.info(
            "[TikTokExtractorFinal] source=none path=none title=None price=None images_count=0",
        )
        return _build_raw_from_component({})

    components = _collect_components(best_pd)
    for idx, comp in enumerate(components):
        ex = _is_excluded_component(comp)
        ht, hp, hs, hi, hk = _component_flags(comp)
        logger.info(
            "[TikTokPageDataComponent] idx=%d type=%s name=%s excluded=%s has_title=%s "
            "has_price=%s has_seller=%s has_images=%s has_sku=%s qc=%d",
            idx,
            comp.get("component_type"),
            comp.get("component_name"),
            ex,
            ht,
            hp,
            hs,
            hi,
            hk,
            _quality_count(comp),
        )

    best, best_idx, path_hint = _pick_best_component(components)
    if best is None:
        logger.info(
            "[TikTokExtractorFinal] source=%s path=none title=None price=None images_count=0",
            best_label,
        )
        return _build_raw_from_component({})

    raw = _build_raw_from_component(best)
    ppi = raw.get("product_price_info") if isinstance(raw.get("product_price_info"), dict) else {}
    seller = raw.get("seller_info") if isinstance(raw.get("seller_info"), dict) else {}
    logger.info(
        "[TikTokPageDataSelected] idx=%s type=%s name=%s title=%r price=%r seller=%r qc=%d",
        best_idx,
        best.get("component_type"),
        best.get("component_name"),
        raw.get("title"),
        ppi.get("sale_price_format") if ppi else None,
        seller.get("shop_name") if seller else None,
        _quality_count(best),
    )
    imgs = raw.get("images") if isinstance(raw.get("images"), list) else []
    logger.info(
        "[TikTokExtractorFinal] source=%s path=%s title=%r price=%r images_count=%d",
        best_label,
        path_hint or "page_data.data.selected",
        raw.get("title"),
        raw.get("price"),
        len(imgs or []),
    )
    return raw
