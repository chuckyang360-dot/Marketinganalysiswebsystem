import asyncio
import httpx
import logging
from typing import Dict, Any
from datetime import datetime
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ScrapeDoService:
    def __init__(self):
        from ..config import settings

        self.api_token = settings.SCRAPE_DO_API_TOKEN
        if not self.api_token:
            raise ValueError("SCRAPE_DO_API_TOKEN is not set in settings")

    def _extract_structured_data(self, html: str, url: str) -> Dict[str, Any]:
        """
        从 Amazon HTML 中提取结构化商品信息（V1.0，多字段 + 多 fallback）

        新增字段：
        - images: list[str]（尽量取高清）
        - original_price: str（划线价/原价）
        - description: str（约前 200 字）
        - bullet_points: list[str]
        """
        import json
        import re

        data: Dict[str, Any] = {
            "title": "未提取到标题",
            "price": "N/A",
            "original_price": "N/A",
            "rating": 0.0,
            "review_count": 0,
            "main_image": "",
            "images": [],
            "brand": "N/A",
            "bullet_points": [],
            "description": "",
            # V1.0 用户评价洞察 - 严格按产品需求实现
            "reviews": [],
            "platform": "amazon",
            "url": url,
        }

        soup = BeautifulSoup(html, "html.parser")

        def _clean_text(s: str) -> str:
            return re.sub(r"\s+", " ", (s or "").strip())

        def _uniq_keep_order(items):
            seen = set()
            out = []
            for x in items:
                if not x:
                    continue
                if x in seen:
                    continue
                seen.add(x)
                out.append(x)
            return out

        def _normalize_image_url(raw_url: str) -> str:
            """
            紧急修复主图数量+原图 bug：
            - 尽量把 Amazon 常见缩略/尺寸变体 URL 规整为同一张高清图的 canonical 形式
            - 保留可直接访问的图片 URL（不做复杂重写）
            """
            u = _clean_text(raw_url)
            if not u:
                return ""
            # 去掉 query，避免把同一张图当多张
            u = u.split("?")[0]
            # 去掉 Amazon 常见的 ._AC_SX679_.jpg / ._SL1500_.jpg 这类尺寸片段
            u = re.sub(r"\._[A-Z0-9,]+_\.(jpg|jpeg|png|webp)$", r".\1", u, flags=re.I)
            return u

        def _is_image_url(u: str) -> bool:
            if not u:
                return False
            ul = u.lower()
            return u.startswith("http") and any(ul.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])

        def _image_quality_score(image_url: str) -> int:
            ul = (image_url or "").lower()
            score = 0
            if "_sl1500_" in ul or "_ac_sl1500_" in ul:
                score += 1000
            elif "_sl1200_" in ul or "_ac_sl1200_" in ul:
                score += 900
            elif "_sl1000_" in ul or "_ac_sl1000_" in ul:
                score += 850
            elif "_ac_sl" in ul:
                score += 800
            elif "_ul" in ul or "_us" in ul or "_sx" in ul or "_sy" in ul:
                score += 100
            else:
                score += 500
            nums = [int(n) for n in re.findall(r"\d+", ul)]
            if nums:
                score += max(nums)
            return score

        def _extract_gallery_images_in_order() -> tuple[list[str], int, int]:
            """
            仅从商品主图 gallery 节点提取图片，避免混入推荐/关联商品图。
            返回：gallery_images（有序）、candidate_gallery_images_count、filtered_non_gallery_images_count
            """
            def _parse_dynamic_image_urls(raw: str) -> list[str]:
                if not raw:
                    return []
                candidates: list[str] = []
                text = raw.strip()
                for payload in (text, text.replace("&quot;", '"').replace("&#34;", '"')):
                    try:
                        obj = json.loads(payload)
                        if isinstance(obj, dict):
                            candidates.extend([_normalize_image_url(_clean_text(u)) for u in obj.keys()])
                    except Exception:
                        continue
                return [u for u in candidates if _is_image_url(u)]

            def _parse_thumb_action_urls(raw: str) -> list[str]:
                if not raw:
                    return []
                vals: list[str] = []
                text = raw.strip()
                for payload in (text, text.replace("&quot;", '"').replace("&#34;", '"')):
                    try:
                        obj = json.loads(payload)
                    except Exception:
                        continue
                    if not isinstance(obj, dict):
                        continue
                    for key in (
                        "hiRes",
                        "mainUrl",
                        "largeImage",
                        "large",
                        "imageUrl",
                        "url",
                        "displayUrl",
                        "thumb",
                    ):
                        v = obj.get(key)
                        if isinstance(v, str) and v.strip():
                            vals.append(_normalize_image_url(_clean_text(v)))
                    # 部分结构会把动态图放在 data / params 子对象里
                    for sub_key in ("data", "params"):
                        sub = obj.get(sub_key)
                        if isinstance(sub, dict):
                            dyn = sub.get("dynamicImage") or sub.get("data-a-dynamic-image")
                            if isinstance(dyn, str):
                                vals.extend(_parse_dynamic_image_urls(dyn))
                return [u for u in vals if _is_image_url(u)]

            def _collect_candidates(node) -> list[tuple[str, str]]:
                out: list[tuple[str, str]] = []

                def _push(source: str, value: str):
                    if not value:
                        return
                    v = _normalize_image_url(_clean_text(value))
                    if _is_image_url(v):
                        out.append((source, v))

                # 1) 当前缩略图节点优先字段
                _push("data-old-hires", node.get("data-old-hires", ""))
                _push("data-zoom-image", node.get("data-zoom-image", ""))
                _push("data-image-url", node.get("data-image-url", ""))
                _push("data-src", node.get("data-src", ""))
                _push("src", node.get("src", ""))
                for u in _parse_dynamic_image_urls(node.get("data-a-dynamic-image", "")):
                    _push("data-a-dynamic-image", u)

                # 2) 缩略图所属 li 节点上的字段（Amazon 常把高清信息挂在这里）
                li = node.find_parent("li")
                if li is not None:
                    _push("li-data-old-hires", li.get("data-old-hires", ""))
                    _push("li-data-zoom-image", li.get("data-zoom-image", ""))
                    _push("li-data-image-url", li.get("data-image-url", ""))
                    for u in _parse_dynamic_image_urls(li.get("data-a-dynamic-image", "")):
                        _push("li-data-a-dynamic-image", u)
                    for u in _parse_thumb_action_urls(li.get("data-thumb-action", "")):
                        _push("li-data-thumb-action", u)

                return out

            def _truncate_text(value: str, limit: int = 900) -> str:
                if value is None:
                    return ""
                text = str(value)
                return text[:limit] + ("...(truncated)" if len(text) > limit else "")

            def _safe_json_attrs(tag) -> str:
                try:
                    attrs = dict(getattr(tag, "attrs", {}) or {})
                    # 防止日志过长
                    compact = {k: _truncate_text(v, 300) for k, v in attrs.items()}
                    return json.dumps(compact, ensure_ascii=False)
                except Exception:
                    return "{}"

            def _log_page_image_json_snippets():
                keywords = [
                    "colorImages",
                    "mainUrl",
                    "hiRes",
                    "large",
                    "imageBlock",
                    "landingAsinColor",
                ]
                lower_html = html.lower()
                for kw in keywords:
                    start = 0
                    hits = 0
                    kw_lower = kw.lower()
                    while hits < 3:
                        idx = lower_html.find(kw_lower, start)
                        if idx == -1:
                            break
                        left = max(0, idx - 220)
                        right = min(len(html), idx + 420)
                        snippet = html[left:right].replace("\n", " ").replace("\r", " ")
                        logger.info(
                            "[EcomStruct][ScrapeDoPageImageJson] keyword=%s hit_index=%d snippet=%s",
                            kw,
                            hits,
                            _truncate_text(snippet, 900),
                        )
                        hits += 1
                        start = idx + len(kw_lower)

            _log_page_image_json_snippets()

            gallery_nodes = soup.select(
                "#altImages li img, #altImages img, #imageBlockThumbs img, #imageBlock_feature_div #imgTagWrapperId img#landingImage"
            )

            # 全局候选用于日志统计：有多少图片因“非 gallery 来源”被过滤
            global_nodes = soup.select("img[data-a-dynamic-image], img.a-dynamic-image")
            global_candidates = []
            for node in global_nodes:
                dyn = node.get("data-a-dynamic-image")
                if dyn:
                    try:
                        dyn_obj = json.loads(dyn)
                        if isinstance(dyn_obj, dict):
                            global_candidates.extend([_normalize_image_url(_clean_text(u)) for u in dyn_obj.keys()])
                    except Exception:
                        pass
                for key in ("data-old-hires", "data-src", "src"):
                    v = node.get(key)
                    if v:
                        global_candidates.append(_normalize_image_url(_clean_text(v)))
            global_candidates = _uniq_keep_order([u for u in global_candidates if _is_image_url(u)])

            ordered_gallery = []
            for idx, node in enumerate(gallery_nodes):
                node_html = _truncate_text(str(node), 1000)
                node_attrs = _safe_json_attrs(node)
                li = node.find_parent("li")
                li_attrs = _safe_json_attrs(li) if li is not None else "{}"

                # 节点及父节点字段优先诊断
                node_thumb_action = node.get("data-thumb-action", "")
                li_thumb_action = li.get("data-thumb-action", "") if li is not None else ""
                node_dynamic = node.get("data-a-dynamic-image", "")
                li_dynamic = li.get("data-a-dynamic-image", "") if li is not None else ""
                node_old_hires = node.get("data-old-hires", "")
                li_old_hires = li.get("data-old-hires", "") if li is not None else ""
                node_image_url = node.get("data-image-url", "")
                li_image_url = li.get("data-image-url", "") if li is not None else ""
                node_src = node.get("src", "")
                node_data_src = node.get("data-src", "")

                logger.info(
                    "[EcomStruct][ScrapeDoGalleryNode] gallery_index=%d node_html=%s node_attrs=%s li_attrs=%s "
                    "has_data_thumb_action=%s data_thumb_action=%s has_data_a_dynamic_image=%s data_a_dynamic_image=%s "
                    "has_data_old_hires=%s data_old_hires=%s has_data_image_url=%s data_image_url=%s img_src=%s img_data_src=%s",
                    idx,
                    node_html,
                    node_attrs,
                    li_attrs,
                    bool(node_thumb_action or li_thumb_action),
                    _truncate_text(node_thumb_action or li_thumb_action, 900),
                    bool(node_dynamic or li_dynamic),
                    _truncate_text(node_dynamic or li_dynamic, 900),
                    bool(node_old_hires or li_old_hires),
                    _truncate_text(node_old_hires or li_old_hires, 900),
                    bool(node_image_url or li_image_url),
                    _truncate_text(node_image_url or li_image_url, 900),
                    _truncate_text(node_src, 500),
                    _truncate_text(node_data_src, 500),
                )

                per_node_pairs = _collect_candidates(node)
                if not per_node_pairs:
                    continue
                best_source, best = sorted(per_node_pairs, key=lambda x: _image_quality_score(x[1]), reverse=True)[0]
                ordered_gallery.append(best)
                logger.info(
                    "[EcomStruct][ScrapeDoGalleryRaw] gallery_index=%d source_type=%s extracted_url=%s",
                    idx,
                    best_source,
                    best,
                )

            # landingImage 单独兜底，且保持在首位
            landing = soup.find("img", id="landingImage")
            if landing:
                landing_candidates = []
                dyn = landing.get("data-a-dynamic-image")
                if dyn:
                    try:
                        dyn_obj = json.loads(dyn)
                        if isinstance(dyn_obj, dict):
                            landing_candidates.extend([_normalize_image_url(_clean_text(u)) for u in dyn_obj.keys()])
                    except Exception:
                        pass
                for key in ("data-old-hires", "src"):
                    v = landing.get(key)
                    if v:
                        landing_candidates.append(_normalize_image_url(_clean_text(v)))
                landing_candidates = [u for u in landing_candidates if _is_image_url(u)]
                if landing_candidates:
                    landing_best = sorted(landing_candidates, key=_image_quality_score, reverse=True)[0]
                    ordered_gallery = [landing_best] + [u for u in ordered_gallery if u != landing_best]

            ordered_gallery = _uniq_keep_order(ordered_gallery)
            candidate_gallery_images_count = len(ordered_gallery)
            filtered_non_gallery_images_count = max(0, len(global_candidates) - candidate_gallery_images_count)
            return ordered_gallery, candidate_gallery_images_count, filtered_non_gallery_images_count

        def _extract_color_images_initial_in_order() -> list[str]:
            """
            优先从页面源码中的 colorImages.initial 提取主图集合。
            顺序与 colorImages.initial 保持一致。
            """
            def _find_balanced_block(text: str, start_idx: int, open_ch: str, close_ch: str) -> str:
                if start_idx < 0 or start_idx >= len(text) or text[start_idx] != open_ch:
                    return ""
                depth = 0
                in_string = False
                quote_ch = ""
                escaped = False
                for i in range(start_idx, len(text)):
                    ch = text[i]
                    if in_string:
                        if escaped:
                            escaped = False
                        elif ch == "\\":
                            escaped = True
                        elif ch == quote_ch:
                            in_string = False
                        continue
                    if ch in ("'", '"'):
                        in_string = True
                        quote_ch = ch
                        continue
                    if ch == open_ch:
                        depth += 1
                    elif ch == close_ch:
                        depth -= 1
                        if depth == 0:
                            return text[start_idx : i + 1]
                return ""

            def _extract_initial_array_block(text: str) -> str:
                # 先定位 colorImages，再定位其对象中的 initial 数组
                m = re.search(r"[\"']colorImages[\"']\s*:", text)
                if not m:
                    return ""
                after = m.end()
                obj_start = text.find("{", after)
                if obj_start == -1:
                    return ""
                color_obj = _find_balanced_block(text, obj_start, "{", "}")
                if not color_obj:
                    return ""
                m2 = re.search(r"[\"']initial[\"']\s*:", color_obj)
                if not m2:
                    return ""
                arr_start = color_obj.find("[", m2.end())
                if arr_start == -1:
                    return ""
                return _find_balanced_block(color_obj, arr_start, "[", "]")

            def _split_top_level_objects(arr_text: str) -> list[str]:
                out: list[str] = []
                if not arr_text or len(arr_text) < 2:
                    return out
                i = 0
                while i < len(arr_text):
                    if arr_text[i] == "{":
                        block = _find_balanced_block(arr_text, i, "{", "}")
                        if not block:
                            break
                        out.append(block)
                        i += len(block)
                    else:
                        i += 1
                return out

            def _extract_string_field(obj_text: str, field_name: str) -> str:
                pattern = rf"[\"']{re.escape(field_name)}[\"']\s*:\s*([\"'])(.*?)\1"
                m = re.search(pattern, obj_text, flags=re.S)
                if not m:
                    return ""
                return m.group(2)

            def _extract_main_best(obj_text: str) -> str:
                m = re.search(r"[\"']main[\"']\s*:\s*", obj_text)
                if not m:
                    return ""
                brace_start = obj_text.find("{", m.end())
                if brace_start == -1:
                    return ""
                main_block = _find_balanced_block(obj_text, brace_start, "{", "}")
                if not main_block:
                    return ""

                url_matches = re.findall(r"https?:\\\\?/\\\\?/[^\"'\\s,}]+", main_block)
                # 兼容非转义斜杠格式
                url_matches += re.findall(r"https?://[^\"'\\s,}]+", main_block)
                if not url_matches:
                    return ""

                candidates = []
                for u in url_matches:
                    unescaped = u.replace("\\/", "/")
                    normalized = _normalize_image_url(_clean_text(unescaped))
                    if _is_image_url(normalized):
                        candidates.append(normalized)
                if not candidates:
                    return ""
                return sorted(candidates, key=_image_quality_score, reverse=True)[0]

            raw_arr = _extract_initial_array_block(html)
            if not raw_arr:
                logger.info("[EcomStruct][ScrapeDoColorImages] color_images_count=0")
                return []

            object_blocks = _split_top_level_objects(raw_arr)
            logger.info("[EcomStruct][ScrapeDoColorImages] color_images_count=%d", len(object_blocks))

            selected_urls: list[str] = []
            for idx, obj_text in enumerate(object_blocks):
                selected_source = "none"
                selected_url = ""

                hi_res = _extract_string_field(obj_text, "hiRes")
                large = _extract_string_field(obj_text, "large")
                thumb = _extract_string_field(obj_text, "thumb")
                main_best = _extract_main_best(obj_text)

                for source, raw in (
                    ("hiRes", hi_res),
                    ("large", large),
                    ("main", main_best),
                    ("thumb", thumb),
                ):
                    candidate = _normalize_image_url(_clean_text(raw.replace("\\/", "/") if raw else ""))
                    if candidate and _is_image_url(candidate):
                        selected_source = source
                        selected_url = candidate
                        break

                if selected_url:
                    selected_urls.append(selected_url)

                logger.info(
                    "[EcomStruct][ScrapeDoColorImages] index=%d selected_source_type=%s selected_url=%s",
                    idx,
                    selected_source,
                    selected_url,
                )
                if selected_url:
                    logger.info(
                        "[EcomStruct][ScrapeDoGalleryRaw] gallery_index=%d source_type=%s extracted_url=%s",
                        idx,
                        f"colorImages.{selected_source}",
                        selected_url,
                    )

            return _uniq_keep_order(selected_urls)

        def _clean_price(raw: str) -> str:
            # 紧急修复 Amazon 价格解析失败（$,, 问题）
            s = _clean_text(raw or "")
            if not s:
                return ""
            # 去掉除货币符号/数字/小数点/逗号之外的字符
            s = re.sub(r"[^\d\.,\$￥€£]", "", s)
            # 清理多余逗号、空白等：$,, / $,,. -> $
            s = re.sub(r",+", ",", s).strip(",")
            # $29,99（误分隔）尽量规整为 $29.99：只有一个逗号且无小数点时
            if "." not in s and s.count(",") == 1 and re.search(r"[\$￥€£]\d+,\d{2}$", s):
                s = s.replace(",", ".")
            # 去掉千分位逗号：$1,299.99 -> $1299.99
            s = re.sub(r"(?<=\d),(?=\d{3}\b)", "", s)
            return s

        def _is_valid_price(p: str) -> bool:
            # 至少包含一个数字，且不是只有符号/标点
            if not p:
                return False
            if not re.search(r"\d", p):
                return False
            # 过滤 $,, 这种情况
            if re.fullmatch(r"[\$￥€£\.,]+", p):
                return False
            return True
        

        def _extract_reviews():
            """V1.0 用户评价洞察 - 最终稳定版（纯文字评论）"""
            reviews = []
            filtered_count = 0

            selectors = [
            'li[data-hook="review"]',
            'div[data-hook="review"]',
            '[data-hook="cr-review-card"]',
            'div.a-section.review',
            'div[data-review-id]',
            '#cm_cr-review_list .review',
            '#cm_cr-review_list [data-hook="review"]',
            'div.review'
            ]

            nodes = []
            for sel in selectors:
                nodes = soup.select(sel)
                if nodes:
                    logger.info(f"[ScrapeDoService] Reviews found with selector: {sel} ({len(nodes)} nodes)")
                    break

            if not nodes:
                logger.warning("[ScrapeDoService] No review nodes found with any selector")
                return []

            for node in nodes:
                # 过滤图片/视频评论（放宽，只过滤明显带媒体的）
                has_big_media = node.select_one('img[src*="review"], .review-image-tile, .cr-video-reviews, [data-hook*="review-image"]')
                if has_big_media:
                    filtered_count += 1
                    continue

                rating = 0.0
                rating_tag = node.select_one('span.a-icon-alt, [data-hook="review-star-rating"] span.a-icon-alt')
                if rating_tag:
                    text = rating_tag.get_text(" ", strip=True)
                    m = re.search(r"(\d+(?:\.\d+)?) out of 5", text) or re.search(r"(\d+(?:\.\d+)?)", text)
                    if m:
                        try:
                            rating = float(m.group(1))
                        except:
                            pass

                title_tag = node.select_one('[data-hook="review-title"] span') or node.select_one('[data-hook="review-title"]') or node.select_one('span.review-title')
                title = _clean_text(title_tag.get_text(" ", strip=True) if title_tag else "")

                body_tag = node.select_one('[data-hook="review-body"]') or node.select_one("span.review-text") or node.select_one("div.review-text-content")
                content = body_tag.get_text("\n", strip=True) if body_tag else ""
                content = re.sub(r"\n{3,}", "\n\n", content).strip()
                if not content:
                    continue

                author_tag = node.select_one("span.a-profile-name") or node.select_one("span.review-byline span")
                author = _clean_text(author_tag.get_text(" ", strip=True) if author_tag else "")

                date_tag = node.select_one('[data-hook="review-date"]') or node.select_one("span.review-date")
                date = _clean_text(date_tag.get_text(" ", strip=True) if date_tag else "")

                verified_purchase = bool(node.select_one('[data-hook="avp-badge"]') or "Verified Purchase" in node.get_text(" ", strip=True))

                helpful_votes = 0
                helpful_tag = node.select_one('[data-hook="helpful-vote-statement"]')
                if helpful_tag:
                    txt = helpful_tag.get_text(" ", strip=True)
                    m = re.search(r"(\d{1,3}(?:,\d{3})*)", txt)
                    if m:
                        try:
                            helpful_votes = int(m.group(1).replace(",", ""))
                        except:
                            pass

                reviews.append({
                    "rating": rating,
                    "title": title,
                    "content": content,
                    "author": author,
                    "date": date,
                    "verified_purchase": verified_purchase,
                    "helpful_votes": helpful_votes,
                })

            logger.info(f"[ScrapeDoService] ✅ Extracted {len(reviews)} reviews (filtered {filtered_count} image reviews)")
            return reviews

        # 1) 标题
        for tag in (soup.find("span", id="productTitle"), soup.find("h1", id="title"), soup.find("title")):
            if tag:
                title_text = _clean_text(tag.get_text())
                if title_text:
                    data["title"] = title_text.split("| Amazon")[0].split(" - ")[0].strip()
                    break

        # 2) 价格（尽量拿到 $xx.xx）
        # 紧急修复 Amazon 价格解析失败（$,, 问题）：增加多 fallback + 清理
        price_text = ""
        # 常见结构：corePriceDisplay_desktop_feature_div 下的 .a-offscreen
        offscreen = soup.select_one(
            "#corePriceDisplay_desktop_feature_div span.a-offscreen"
        ) or soup.select_one("#corePrice_feature_div span.a-offscreen")
        if offscreen:
            price_text = _clean_price(offscreen.get_text())
        if not price_text:
            price_tag = soup.find("span", id="priceblock_ourprice") or soup.find("span", id="priceblock_dealprice")
            if price_tag:
                price_text = _clean_price(price_tag.get_text())
        if not _is_valid_price(price_text):
            # 备用：priceToPay（Amazon 新版常见）
            p2p = soup.select_one('span.priceToPay span.a-offscreen') or soup.select_one(
                "#corePriceDisplay_desktop_feature_div span.priceToPay span.a-offscreen"
            )
            if p2p:
                price_text = _clean_price(p2p.get_text())
        if not _is_valid_price(price_text):
            # 备用：a-price-whole + a-price-fraction (+ a-price-symbol)
            sym = soup.select_one("span.a-price-symbol")
            whole = soup.select_one("span.a-price-whole")
            frac = soup.select_one("span.a-price-fraction")
            if whole:
                symbol = _clean_price(sym.get_text() if sym else "$") or "$"
                w = re.sub(r"[^\d]", "", whole.get_text() or "")
                f = re.sub(r"[^\d]", "", frac.get_text() or "") if frac else ""
                if w and f:
                    price_text = _clean_price(f"{symbol}{w}.{f}")
                elif w:
                    price_text = _clean_price(f"{symbol}{w}")
        if not price_text:
            # regex fallback
            m = re.search(r"[\$￥€£]\s*[\d,]+(?:\.\d+)?", html)
            if m:
                price_text = _clean_price(m.group(0))

        original_price_before = data.get("original_price", "N/A")
        if _is_valid_price(price_text):
            data["price"] = price_text
        else:
            # 最终兜底：用 original_price 或再次从 html 找任意含货币符号的数字
            fallback = _clean_price(original_price_before)
            if not _is_valid_price(fallback):
                m = re.search(r"[\$￥€£]\s*[\d,]+(?:\.\d+)?", html)
                fallback = _clean_price(m.group(0)) if m else ""
            if _is_valid_price(fallback):
                logger.info(
                    f"[ScrapeDoService] Price fallback used: {fallback} (original was {price_text or 'EMPTY'})"
                )
                data["price"] = fallback

        # 3) 原价/划线价（常见：a-text-price / basisPrice）
        original_price = ""
        strike = soup.select_one("span.a-text-price span.a-offscreen") or soup.select_one(
            "#basisPrice span.a-offscreen"
        )
        if strike:
            original_price = _clean_price(strike.get_text())
        if not original_price:
            m = re.search(r'"listPrice"\s*:\s*\{\s*"amount"\s*:\s*"?([\d.]+)"?\s*\}', html)
            if m:
                original_price = m.group(1)
        if original_price:
            data["original_price"] = _clean_price(original_price)

        # 4) 主图 + 多图：优先 colorImages.initial，失败时回退到 gallery DOM 抽取
        normalized = _extract_color_images_initial_in_order()
        if normalized:
            candidate_gallery_images_count = len(normalized)
            filtered_non_gallery_images_count = 0
        else:
            normalized, candidate_gallery_images_count, filtered_non_gallery_images_count = _extract_gallery_images_in_order()
        logger.info(
            "[EcomStruct][ScrapeDoGallery] candidate_gallery_images_count=%d filtered_non_gallery_images_count=%d",
            candidate_gallery_images_count,
            filtered_non_gallery_images_count,
        )

        # 4.1) main_image 与 gallery 首图保持一致（后续 cleaner 再做 canonical 提升）
        if normalized:
            data["images"] = normalized
            data["main_image"] = normalized[0]
        else:
            data["images"] = []
            data["main_image"] = ""

        # 5) 评分 & 评价数
        rating_tag = soup.find("span", class_="a-icon-alt")
        if rating_tag:
            m = re.search(r"(\d+(?:\.\d+)?)", rating_tag.get_text())
            if m:
                try:
                    data["rating"] = float(m.group(1))
                except Exception:
                    pass

        review_tag = soup.find("span", id="acrCustomerReviewText")
        if review_tag:
            m = re.search(r"(\d{1,3}(?:,\d{3})*)", review_tag.get_text())
            if m:
                try:
                    data["review_count"] = int(m.group(1).replace(",", ""))
                except Exception:
                    pass
        else:
            m = re.search(r"(\d{1,3}(?:,\d{3})*)\s+global ratings?", html, re.I)
            if m:
                try:
                    data["review_count"] = int(m.group(1).replace(",", ""))
                except Exception:
                    pass

        # 6) 品牌
        brand_tag = soup.find("a", id="bylineInfo")
        if brand_tag:
            data["brand"] = _clean_text(brand_tag.get_text())
        else:
            m = re.search(r"Brand:\s*([^<\n\r]+)", html, re.I)
            if m:
                data["brand"] = _clean_text(m.group(1))

        # 7) Bullet points（feature-bullets）
        bullets = []
        for li in soup.select("#feature-bullets ul li"):
            txt = _clean_text(li.get_text(" ", strip=True))
            if not txt:
                continue
            # 过滤“关注/配送/退货”等噪声（保守）
            if len(txt) < 8:
                continue
            bullets.append(txt)
        data["bullet_points"] = _uniq_keep_order(bullets)[:12]

        # 8) 简短描述（前 200 字）
        desc = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            desc = _clean_text(meta_desc["content"])
        if not desc:
            pd_desc = soup.select_one("#productDescription")
            if pd_desc:
                desc = _clean_text(pd_desc.get_text(" ", strip=True))
        if not desc and data["bullet_points"]:
            desc = "；".join(data["bullet_points"][:3])
        if desc:
            data["description"] = desc[:200]

        # 9) 用户评价洞察（V1.0） - 强制加入 reviews
        try:
            reviews_list = _extract_reviews()
            data["reviews"] = reviews_list
            logger.info(f"[ScrapeDoService] Successfully added {len(reviews_list)} reviews to structured data")
        except Exception as e:
            logger.error(f"[ScrapeDoService] Failed to add reviews: {str(e)}")
            data["reviews"] = []

        # 最终保证：main_image 与 images[0] 一致（紧急修复主图数量+原图 bug）
        if data["images"]:
            data["main_image"] = data["images"][0]
        elif data["main_image"]:
            data["images"] = [data["main_image"]]

        logger.info(
            "[ScrapeDoService] ✅ Structured data extracted - "
            f"Title: {str(data.get('title', ''))[:80]}..., "
            f"Price: {data.get('price')}, "
            f"Orig: {data.get('original_price')}, "
            f"Rating: {data.get('rating')}, "
            f"Images: {len(data.get('images') or [])}"
        )

        # === 强制确保 reviews 字段存在并返回给前端 ===
        if "reviews" not in data:
            data["reviews"] = []
        logger.info(f"[ScrapeDoService] Final parse_data contains {len(data.get('reviews', []))} reviews before return")

        return data

    async def scrape_and_parse(self, url: str) -> Dict[str, Any]:
        """调用 scrape.do Amazon 专用 Scraper API - 增加流式读取和重试机制"""
        logger.info(f"[ScrapeDoService] Starting Amazon专用 scrape for URL: {url}")

        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:  # 加大超时
                    params = {
                        "token": self.api_token,
                        "url": url,
                        "geocode": "us",
                        "zipcode": "10001",
                        "output": "html",
                        "render": "true",
                        "waitUntil": "networkidle0",
                        "super": "true",
                        "device": "desktop",
                    }

                    response = await client.get(
                        "https://api.scrape.do/plugin/amazon/", params=params
                    )

                    # 关键修复：使用 stream=True + 完整读取 body
                    if response.status_code == 200:
                        # 流式读取完整 HTML，避免 chunked 中断
                        html = ""
                        async for chunk in response.aiter_text():
                            html += chunk

                        structured_data = self._extract_structured_data(html, url)

                        result = {
                            "raw_html": html[:15000],  # 只保留前15k用于调试
                            "structured_data": structured_data,
                            "url": url,
                            "platform": "amazon",
                            "parsed_at": datetime.utcnow().isoformat(),
                            "status": "scraped",
                            "message": f"✅ Amazon 商品数据抓取成功（第 {attempt + 1} 次尝试）",
                        }

                        logger.info(
                            "[ScrapeDoService] ✅ Amazon product scraped successfully via /plugin/amazon/ "
                            f"(attempt {attempt + 1})"
                        )
                        return result

                    response.raise_for_status()

            except Exception as e:
                logger.warning(
                    f"[ScrapeDoService] Attempt {attempt + 1} failed: {str(e)}"
                )
                if attempt == max_retries:
                    logger.error(f"[ScrapeDoService] All retries failed for {url}")
                    raise
                await asyncio.sleep(1)  # 短暂等待后重试

        raise Exception("Failed to scrape after retries")

    def _detect_platform(self, url: str) -> str:
        """检测电商平台"""
        url_lower = url.lower()
        if "amazon." in url_lower:
            return "amazon"
        elif "shopify." in url_lower:
            return "shopify"
        elif "taobao." in url_lower or "tmall." in url_lower:
            return "taobao"
        elif "jd.com" in url_lower:
            return "jd"
        elif "ebay." in url_lower:
            return "ebay"
        elif "walmart." in url_lower:
            return "walmart"
        elif "lazada." in url_lower or "shopee." in url_lower:
            return "southeast_asia"
        else:
            return "other"

