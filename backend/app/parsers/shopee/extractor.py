import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ShopeeExtractor:
    """Shopee extractor: script/json first, DOM fallback second."""

    def extract(self, raw_response: Dict[str, Any]) -> Dict[str, Any]:
        html = raw_response.get("html", "") or ""
        url = raw_response.get("final_url", "") or ""
        soup = BeautifulSoup(html, "html.parser")

        base_result = {
            "product_id": "",
            "title": "未提取到标题",
            "price": "N/A",
            "original_price": "N/A",
            "rating": 0.0,
            "review_count": 0,
            "currency": "SGD",
            "brand": "N/A",
            "raw_images": [],
            "raw_reviews": [],
            "description": "",
            "raw_data": {"provider_payload": raw_response.get("raw_response", {})},
            "url": url,
            "platform": "shopee",
        }

        # 先输出 script 候选定位日志，确认真实可用数据源位置
        self._debug_script_candidates(soup)

        # 主路径：window.__INITIAL_STATE__
        patch = self.extract_from_initial_state(html)
        if patch is not None:
            patch["strategy"] = "initial_state_json"
            base_result.update({k: v for k, v in patch.items() if v not in (None, "", [], {})})
            logger.info("[PRICE_FLOW] merged_result_price=%s", base_result.get("price", "N/A"))
            final_strategy = "initial_state_json"
        else:
            # fallback：保留原有逻辑
            final_strategy = "none"
            for strategy_name, strategy in (
                ("script_json", self._extract_from_script_json),
                ("ld_json", self._extract_from_ld_json),
                ("dom_fallback", self._extract_from_dom_fallback),
            ):
                patch = strategy(html=html, soup=soup)
                success = bool(patch.get("title") and patch.get("raw_images"))
                logger.info("[EcomStruct][ShopeeExtractor] strategy=%s success=%s", strategy_name, success)
                if patch:
                    patch["strategy"] = "dom"
                    base_result.update({k: v for k, v in patch.items() if v not in (None, "", [], {})})
                    logger.info("[PRICE_FLOW] merged_result_price=%s", base_result.get("price", "N/A"))
                if success:
                    final_strategy = strategy_name
                    break

        main_image = self._select_main_image(base_result.get("raw_images", []) or [])

        logger.info("[EcomStruct][ShopeeExtractor] extracted_title=%s", base_result.get("title", ""))
        logger.info("[EcomStruct][ShopeeExtractor] raw_images_count=%d", len(base_result.get("raw_images", []) or []))
        logger.info("[EcomStruct][ShopeeExtractor] raw_reviews_count=%d", len(base_result.get("raw_reviews", []) or []))
        logger.info(
            "[EcomStruct][ShopeeExtractorFinal] strategy=%s script_index=%s title=%s images_count=%d reviews_count=%d main_image=%s",
            final_strategy,
            base_result.get("raw_data", {}).get("script_json_index", ""),
            base_result.get("title", ""),
            len(base_result.get("raw_images", []) or []),
            len(base_result.get("raw_reviews", []) or []),
            main_image,
        )
        logger.info("[PRICE_FLOW] extractor_return_price=%s", base_result.get("price", "N/A"))
        # 评论正文改由 ShopeeParser + get_ratings API 注入，避免 PDP 内嵌/BFS 与 API 混用
        base_result["raw_reviews"] = []
        return base_result

    def extract_from_initial_state(self, html: str) -> Optional[Dict[str, Any]]:
        logger.info("[EXTRACTOR] strategy=initial_state_json start")
        marker = "window.__INITIAL_STATE__"
        idx = html.find(marker)
        found = idx != -1
        logger.info(f"[EXTRACTOR] initial_state found={found}")
        if not found:
            return None

        eq_idx = html.find("=", idx)
        if eq_idx == -1:
            logger.info("[EXTRACTOR] parse_success=False")
            return None

        json_start = html.find("{", eq_idx)
        if json_start == -1:
            logger.info("[EXTRACTOR] parse_success=False")
            return None

        json_text = self._extract_balanced_json_object(html, json_start)
        if not json_text:
            logger.info("[EXTRACTOR] parse_success=False")
            return None

        try:
            payload = json.loads(json_text)
        except Exception:
            logger.info("[EXTRACTOR] parse_success=False")
            return None

        logger.info("[EXTRACTOR] parse_success=True")

        item = self._find_item_node(payload)
        if not isinstance(item, dict):
            logger.info("[EXTRACTOR] images_count=0")
            logger.info("[EXTRACTOR] item_id= shop_id=")
            return None

        images = self._extract_initial_state_images(item)
        item_id = item.get("itemid") or item.get("item_id") or ""
        shop_id = item.get("shopid") or item.get("shop_id") or ""
        title = str(item.get("name") or item.get("title") or "").strip()

        logger.info(f"[EXTRACTOR] images_count={len(images)}")
        logger.info(f"[EXTRACTOR] item_id={item_id} shop_id={shop_id}")

        # 失败判定：必须字段
        if not images:
            return None
        if item_id in ("", None):
            return None
        if shop_id in ("", None):
            return None
        if not title:
            return None

        price = self._extract_price(item)
        rating, review_count, currency = self._extract_pdp_rating_review_currency_fields(item)
        sold = item.get("historical_sold") or item.get("sold")
        sku = item.get("modelid") or item.get("model_id") or item.get("sku")

        raw_reviews = self._extract_shopee_reviews_from_initial_state(payload, item)

        result = {
            "product_id": str(item_id),
            "shop_id": str(shop_id),
            "title": title,
            "price": price,
            "rating": rating,
            "review_count": review_count,
            "currency": currency or "SGD",
            "raw_images": self._prioritize_images(self._uniq_keep_order(images))[:20],
            "raw_reviews": raw_reviews,
            "description": str(item.get("description") or "").strip(),
            "raw_data": {
                "source": "window.__INITIAL_STATE__",
                "item_id": item_id,
                "shop_id": shop_id,
                "sold": sold,
                "sku": sku,
            },
        }
        return result

    def _extract_balanced_json_object(self, text: str, start_idx: int) -> str:
        if start_idx < 0 or start_idx >= len(text) or text[start_idx] != "{":
            return ""
        depth = 0
        in_string = False
        quote_char = ""
        escaped = False
        for i in range(start_idx, len(text)):
            ch = text[i]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == quote_char:
                    in_string = False
                continue

            if ch in ("'", '"'):
                in_string = True
                quote_char = ch
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start_idx : i + 1]
        return ""

    def _find_item_node(self, payload: Any) -> Optional[Dict[str, Any]]:
        queue: List[Any] = [payload]
        seen = 0
        while queue and seen < 50000:
            node = queue.pop(0)
            seen += 1
            if isinstance(node, dict):
                has_itemid = "itemid" in node or "item_id" in node
                has_shopid = "shopid" in node or "shop_id" in node
                has_images = "images" in node or "image" in node
                has_title = "name" in node or "title" in node
                if has_itemid and has_shopid and has_images and has_title:
                    return node
                for v in node.values():
                    if isinstance(v, (dict, list)):
                        queue.append(v)
            elif isinstance(node, list):
                for v in node:
                    if isinstance(v, (dict, list)):
                        queue.append(v)
        return None

    def _extract_initial_state_images(self, item: Dict[str, Any]) -> List[str]:
        out: List[str] = []
        raw = item.get("images") or item.get("image") or []

        if isinstance(raw, list):
            for val in raw:
                if isinstance(val, str):
                    v = val.strip()
                    if not v:
                        continue
                    if v.startswith("http://") or v.startswith("https://"):
                        out.append(v)
                    else:
                        out.append(f"https://cf.shopee.sg/file/{v}")
        elif isinstance(raw, str) and raw.strip():
            v = raw.strip()
            if v.startswith("http://") or v.startswith("https://"):
                out.append(v)
            else:
                out.append(f"https://cf.shopee.sg/file/{v}")

        return self._uniq_keep_order(out)

    @staticmethod
    def _extract_price(item: Dict[str, Any]) -> str:
        # Shopee initial state often uses integer cents.
        for key in ("price", "price_min", "price_max"):
            val = item.get(key)
            if val in (None, ""):
                continue
            try:
                n = int(val)
                if n > 1000:
                    return f"{n / 100000:.2f}"
                return str(n)
            except Exception:
                return str(val)
        return "N/A"

    def _extract_from_script_json(self, *, html: str, soup: BeautifulSoup) -> Dict[str, Any]:
        scripts = soup.find_all("script")
        best_candidate: Dict[str, Any] | None = None
        best_score = -1
        best_meta: Dict[str, Any] = {}
        script_price_overrides: Dict[int, tuple[str, str, Any]] = {}
        global_price_override = ("N/A", "", None)

        for idx, script in enumerate(scripts):
            text = (script.string or script.get_text() or "").strip()
            if not text or len(text) < 40:
                continue

            # 先定位并解析脚本内 JSON 对象，再做路径级候选打分选择
            ranked_candidates = self._rank_script_object_candidates(text, script_idx=idx)
            pdp_price_for_log = self._extract_pdp_price_from_ranked_candidates(ranked_candidates)
            logger.info("[PRICE_FROM_PDP] idx=%s price=%s", idx, pdp_price_for_log)
            script_price_overrides[idx] = self._extract_script_level_price_from_text(text)
            
            price_override = script_price_overrides[idx]
            if price_override[0] != "N/A" and global_price_override[0] == "N/A":
                global_price_override = price_override

            
            if idx == 29 and ranked_candidates:
                for top in ranked_candidates[:5]:
                    logger.info(
                        "[EXTRACTOR_RANK] path=%s title=%s has_description=%s has_price=%s has_itemid=%s has_shopid=%s has_images=%s has_sold=%s has_cmt=%s score=%d",
                        top["path"],
                        top["title"],
                        top["has_description"],
                        top["has_price"],
                        top["has_itemid"],
                        top["has_shopid"],
                        top["has_images"],
                        top["has_sold"],
                        top["has_cmt"],
                        top["score"],
                    )

            pdp_obj: Optional[Dict[str, Any]] = None
            if ranked_candidates:
                top = ranked_candidates[0]
                candidate = top["candidate"]
                score = int(top["score"])
                accepted = score > 0
                reject_reason = "accepted" if accepted else "low_score"
                selected_path = top["path"]
                po = top.get("pdp_object")
                pdp_obj = po if isinstance(po, dict) else None
            else:
                # 兜底：保留原候选提取逻辑
                candidate = self._extract_script_candidate(text)
                accepted, reject_reason, score = self._validate_script_candidate(candidate)
                selected_path = "fallback.regex_candidate"

            logger.info(
                "[EcomStruct][ShopeeExtractorCandidate] source=script_json index=%d title=%s images_count=%d reviews_count=%d has_price=%s has_itemid=%s has_shopid=%s accepted=%s reject_reason=%s",
                idx,
                candidate.get("title", ""),
                len(candidate.get("raw_images", []) or []),
                int(candidate.get("review_count", 0) or 0),
                bool(candidate.get("price") and candidate.get("price") != "N/A"),
                bool(candidate.get("product_id")),
                bool(candidate.get("shop_id")),
                accepted,
                reject_reason,
            )

            if accepted:
                out_candidate = {
                    "product_id": candidate.get("product_id", ""),
                    "shop_id": candidate.get("shop_id", ""),
                    "title": candidate.get("title", ""),
                    "price": candidate.get("price", "N/A"),
                    "rating": candidate.get("rating", 0.0),
                    "review_count": candidate.get("review_count", 0),
                    "currency": candidate.get("currency", "SGD") or "SGD",
                    "raw_images": candidate.get("raw_images", [])[:20],
                    "raw_reviews": [],
                    "description": candidate.get("description", ""),
                    "raw_data": {
                        "script_json_index": idx,
                        "shop_id": candidate.get("shop_id", ""),
                        "selected_path": selected_path,
                        "price_source": candidate.get("price_source", ""),
                        "price_raw": candidate.get("price_raw", ""),
                    },
                }
                override_price, override_source, override_raw = script_price_overrides.get(idx, ("N/A", "", None))
                if override_price != "N/A":
                    out_candidate["price"] = override_price
                    out_candidate["raw_data"]["price_source"] = override_source
                    out_candidate["raw_data"]["price_raw"] = override_raw
                # 更强候选打分：选最优而非首个（评论只从最终胜出 PDP 节点抽一次）
                if score > best_score:
                    best_score = score
                    raw_batch = (
                        self._extract_shopee_reviews_from_pdp_object(pdp_obj)
                        if isinstance(pdp_obj, dict)
                        else []
                    )
                    out_candidate["raw_reviews"] = raw_batch[:10]
                    best_candidate = out_candidate
                    best_meta = {"script_index": idx, "selected_path": selected_path}

        if best_candidate:
            best_idx = int(best_meta.get("script_index", -1))
            override_price, override_source, override_raw = script_price_overrides.get(
                best_idx, ("N/A", "", None)
            )

            if override_price == "N/A":
                override_price, override_source, override_raw = global_price_override

            logger.info(
                "[PRICE_DEBUG_FINAL_INJECT] best_idx=%s override_price=%s override_source=%s override_raw=%s global_price_override=%s",
                best_idx,
                override_price,
                override_source,
                override_raw,
                global_price_override,
            )

            if override_price != "N/A":
                best_candidate["price"] = override_price
                best_candidate.setdefault("raw_data", {})
                best_candidate["raw_data"]["price_source"] = override_source
                best_candidate["raw_data"]["price_raw"] = override_raw

        return best_candidate or {}

    def _extract_pdp_price_from_ranked_candidates(self, ranked_candidates: List[Dict[str, Any]]) -> Any:
        for entry in ranked_candidates:
            path = str(entry.get("path", ""))
            candidate = entry.get("candidate", {}) or {}
            price_source = str(candidate.get("price_source", ""))
            price_val = candidate.get("price", "N/A")
            if ".item" in path and price_source.endswith(".item_price") and price_val not in (None, "", "N/A"):
                return price_val
        return None

    def _extract_script_level_price_from_ranked(self, ranked_candidates: List[Dict[str, Any]]) -> tuple[str, str, Any]:
        # deprecated: keep for compatibility, but do not use for root-level offers price
        return "N/A", "", None

    def _extract_script_level_price_from_text(self, text: str) -> tuple[str, str, Any]:
        # Extract from full script text directly; do not depend on ranked candidates.
        # Prefer root.offers.price if present.
        m = re.search(r'"offers"\s*:\s*\{[^{}]{0,500}?"price"\s*:\s*("?[0-9]+(?:\.[0-9]+)?"?)', text, re.S)
        if not m:
            return "N/A", "", None
        raw_token = m.group(1).strip().strip('"')
        normalized = self._normalize_price_value(raw_token, "root.offers.price")
        if normalized == "N/A":
            return "N/A", "", None
        try:
            raw_val = float(raw_token) if "." in raw_token else int(raw_token)
        except Exception:
            raw_val = raw_token
        return normalized, "root.offers.price", raw_val

    def _extract_from_ld_json(self, *, html: str, soup: BeautifulSoup) -> Dict[str, Any]:
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            text = (script.string or script.get_text() or "").strip()
            if not text:
                continue
            try:
                data = json.loads(text)
            except Exception:
                continue

            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                if item.get("@type") not in ("Product",):
                    continue
                image_value = item.get("image", [])
                if isinstance(image_value, str):
                    images = [image_value]
                elif isinstance(image_value, list):
                    images = [x for x in image_value if isinstance(x, str)]
                else:
                    images = []

                return {
                    "title": (item.get("name") or "").strip(),
                    "description": (item.get("description") or "").strip(),
                    "raw_images": self._prioritize_images(self._uniq_keep_order(images))[:20],
                    "price": str((item.get("offers") or {}).get("price") or "N/A"),
                }
        return {}

    def _extract_from_dom_fallback(self, *, html: str, soup: BeautifulSoup) -> Dict[str, Any]:
        title = ""
        meta_og_title = soup.find("meta", property="og:title")
        if meta_og_title and meta_og_title.get("content"):
            title = meta_og_title["content"].strip()
        if not title and soup.title:
            title = soup.title.get_text(" ", strip=True)

        images = []
        meta_og_img = soup.find("meta", property="og:image")
        if meta_og_img and meta_og_img.get("content"):
            images.append(meta_og_img["content"].strip())
        for img in soup.select("img"):
            for key in ("data-src", "src"):
                v = img.get(key)
                if isinstance(v, str) and "shopee" in v and re.search(r"\.(jpg|jpeg|png|webp)($|\?)", v, re.I):
                    images.append(v)

        price = "N/A"
        text = soup.get_text(" ", strip=True)
        m = re.search(r"(S\$|SGD)\s*[\d\.,]+", text)
        if m:
            price = m.group(0)

        return {
            "title": title,
            "price": price,
            "raw_images": self._prioritize_images(self._uniq_keep_order(images))[:20],
        }

    def _extract_script_candidate(self, text: str) -> Dict[str, Any]:
        title = ""
        for pattern in (
            r'"item_name"\s*:\s*"([^"]+)"',
            r'"name"\s*:\s*"([^"]+)"',
            r'"title"\s*:\s*"([^"]+)"',
        ):
            m = re.search(pattern, text)
            if m:
                title = m.group(1).strip()
                break

        price = "N/A"
        m_price = re.search(r'"price"\s*:\s*"?(SGD\s*[\d\.,]+|S\$\s*[\d\.,]+|[\d\.,]+)"?', text)
        if m_price:
            price = m_price.group(1).strip()

        rating = 0.0
        m_rating = re.search(r'"ratingStar"\s*:\s*([\d\.]+)', text)
        if m_rating:
            try:
                rating = float(m_rating.group(1))
            except Exception:
                rating = 0.0

        review_count = 0
        m_reviews = re.search(r'"cmt_count"\s*:\s*(\d+)', text)
        if m_reviews:
            try:
                review_count = int(m_reviews.group(1))
            except Exception:
                review_count = 0

        product_id = ""
        m_itemid = re.search(r'"itemid"\s*:\s*(\d+)', text)
        if m_itemid:
            product_id = m_itemid.group(1)

        shop_id = ""
        m_shopid = re.search(r'"shopid"\s*:\s*(\d+)', text)
        if m_shopid:
            shop_id = m_shopid.group(1)

        description = ""
        m_desc = re.search(r'"description"\s*:\s*"([^"]{10,})"', text)
        if m_desc:
            description = m_desc.group(1).strip()

        images = self._extract_images_from_script(text)

        return {
            "product_id": product_id,
            "shop_id": shop_id,
            "title": title,
            "price": price,
            "rating": rating,
            "review_count": review_count,
            "raw_images": images,
            "description": description,
        }

    def _rank_script_object_candidates(self, text: str, script_idx: int = -1) -> List[Dict[str, Any]]:
        roots = self._extract_preferred_roots(text)
        ranked: List[Dict[str, Any]] = []
        script_root_obj = next((obj for obj, p in roots if p == "root"), None)
        script_price, script_price_source, script_price_raw = self._extract_script_level_price(script_root_obj)

        for root_obj, root_path in roots:
            for candidate_obj, path in self._walk_dict_candidates(root_obj, root_path):
                candidate = self._candidate_from_obj(
                    candidate_obj,
                    path,
                    script_idx=script_idx,
                    script_price=script_price,
                    script_price_source=script_price_source,
                    script_price_raw=script_price_raw,
                )
                if not candidate:
                    continue
                score, signals = self._score_candidate_obj(candidate, path)
                ranked.append(
                    {
                        "path": path,
                        "title": candidate.get("title", ""),
                        "candidate": candidate,
                        "pdp_object": candidate_obj,
                        "score": score,
                        **signals,
                    }
                )

        ranked.sort(key=lambda x: int(x.get("score", 0)), reverse=True)
        return ranked

    def _extract_preferred_roots(self, text: str) -> List[tuple[Dict[str, Any], str]]:
        roots: List[tuple[Dict[str, Any], str]] = []
        preferred_keys = [
            "initialState",
            "data",
            "item",
            "itemDetail",
            "product",
            "productInfo",
            "pageData",
            "PDP",
            "item_basic",
            "itemData",
        ]

        # 尝试解析第一个完整对象（常见 window.xxx = {...}）
        first_brace = text.find("{")
        if first_brace != -1:
            block = self._extract_balanced_json_object(text, first_brace)
            if block:
                for payload in (
                    block,
                    block.replace("'", '"'),
                    block.replace("\\'", "'"),
                ):
                    try:
                        obj = json.loads(payload)
                        if isinstance(obj, dict):
                            roots.append((obj, "root"))
                            break
                    except Exception:
                        continue

        # 尝试在脚本文本中精确定位首选根字段
        for key in preferred_keys:
            for pattern in (
                rf'"{re.escape(key)}"\s*:\s*\{{',
                rf"'{re.escape(key)}'\s*:\s*\{{",
                rf"{re.escape(key)}\s*:\s*\{{",
            ):
                m = re.search(pattern, text)
                if not m:
                    continue
                brace_idx = text.find("{", m.end() - 1)
                if brace_idx == -1:
                    continue
                block = self._extract_balanced_json_object(text, brace_idx)
                if not block:
                    continue
                for payload in (block, block.replace("'", '"')):
                    try:
                        obj = json.loads(payload)
                        if isinstance(obj, dict):
                            roots.append((obj, f"root.{key}"))
                            break
                    except Exception:
                        continue
        # 去重（按 path）
        dedup = {}
        for obj, path in roots:
            dedup[path] = obj
        return [(v, k) for k, v in dedup.items()]

    def _walk_dict_candidates(self, node: Any, path: str) -> List[tuple[Dict[str, Any], str]]:
        out: List[tuple[Dict[str, Any], str]] = []
        if isinstance(node, dict):
            out.append((node, path))
            for k, v in node.items():
                if isinstance(v, dict):
                    out.extend(self._walk_dict_candidates(v, f"{path}.{k}"))
                elif isinstance(v, list):
                    for i, item in enumerate(v):
                        if isinstance(item, dict):
                            out.extend(self._walk_dict_candidates(item, f"{path}.{k}[{i}]"))
        return out

    def _format_shopee_time(self, val: Any) -> str:
        if val in (None, "", 0, "0"):
            return ""
        try:
            n = float(val)
            if n > 1e12:
                n /= 1000.0
            if n > 1e9:
                return datetime.utcfromtimestamp(n).strftime("%Y-%m-%d")
        except Exception:
            pass
        return str(val).strip()

    def _normalize_raw_shopee_review(self, d: Dict[str, Any]) -> Dict[str, Any]:
        content = str(
            d.get("comment")
            or d.get("content")
            or d.get("comment_text")
            or d.get("description")
            or d.get("text")
            or ""
        ).strip()
        author = (
            d.get("author_username")
            or d.get("username")
            or d.get("user_name")
            or d.get("shop_username")
            or d.get("author")
        )
        if author is None and d.get("userid") is not None:
            author = f"user_{d.get('userid')}"
        author_s = str(author or "").strip()
        try:
            rating = float(d.get("rating_star") or d.get("rating") or d.get("rating_star_score") or 0)
        except Exception:
            rating = 0.0
        date = self._format_shopee_time(d.get("ctime") or d.get("mtime") or d.get("create_time") or d.get("time"))
        if not date:
            date = str(d.get("submit_time") or d.get("date") or "").strip()
        imgs_raw = d.get("images") or d.get("media") or d.get("videos") or []
        img_urls: List[str] = []
        if isinstance(imgs_raw, list):
            for im in imgs_raw[:10]:
                if isinstance(im, str) and im.strip().startswith("http"):
                    img_urls.append(im.strip())
                elif isinstance(im, dict):
                    u = im.get("url") or im.get("image") or im.get("thumb") or im.get("cover")
                    if isinstance(u, str) and u.strip().startswith("http"):
                        img_urls.append(u.strip())
        return {
            "rating": rating,
            "title": str(d.get("title") or "").strip(),
            "content": content,
            "author": author_s,
            "date": date,
            "verified_purchase": bool(d.get("is_verified", d.get("verified_purchase", False))),
            "helpful_votes": int(d.get("like_count", d.get("helpful_votes", 0)) or 0),
            "images": img_urls,
        }

    def _shopee_dict_looks_like_review(self, d: Dict[str, Any]) -> bool:
        if not isinstance(d, dict):
            return False
        text = d.get("comment") or d.get("content") or d.get("comment_text") or d.get("description")
        return isinstance(text, str) and len(text.strip()) >= 6

    def _shopee_dict_looks_like_review_strict(self, d: Dict[str, Any]) -> bool:
        """
        全量 INITIAL_STATE 扫描用：避免把任意带 description 的节点误判为评价。
        对齐 Shopee get_ratings 类结构：comment / comment_text，或 (content + 用户标识)。
        """
        if not isinstance(d, dict):
            return False
        for key in ("comment", "comment_text"):
            t = d.get(key)
            if isinstance(t, str) and len(t.strip()) >= 6:
                return True
        content = d.get("content")
        if not isinstance(content, str) or len(content.strip()) < 6:
            return False
        if (
            d.get("author_username")
            or d.get("user_name")
            or d.get("username")
            or d.get("userid") is not None
        ):
            return True
        return False

    def _extract_shopee_reviews_from_initial_state(
        self, payload: Any, item: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """先_item 子树（宽松），再整棵 __INITIAL_STATE__（严格）。最多 10 条。"""
        out = self._extract_shopee_reviews_from_pdp_object(item)
        if out:
            return out[:10]
        if payload is not None:
            out = self._extract_shopee_reviews_from_full_initial_state(payload)
        return (out or [])[:10]

    def _extract_shopee_reviews_from_full_initial_state(self, root: Any) -> List[Dict[str, Any]]:
        """
        在整页 INITIAL_STATE 上查找内嵌的评论列表（少数版本/AB 或本地快照可能带 ratings[]）。
        典型商品节点仅有 item_rating.rating_star、cmt_count，无 comment 数组 → 返回 []。
        """
        out: List[Dict[str, Any]] = []
        seen: set[str] = set()
        queue: List[tuple[Any, str]] = [(root, "root")]
        visited = 0
        hit_path = ""
        while queue and visited < 15000 and len(out) < 10:
            node, path = queue.pop(0)
            visited += 1
            if isinstance(node, dict):
                for k, v in list(node.items())[:100]:
                    nk = f"{path}.{k}" if path != "root" else k
                    if isinstance(v, list):
                        if 1 <= len(v) <= 150:
                            dict_items = [x for x in v if isinstance(x, dict)]
                            if dict_items:
                                sample_n = min(8, len(dict_items))
                                hits = sum(
                                    1
                                    for x in dict_items[:sample_n]
                                    if self._shopee_dict_looks_like_review_strict(x)
                                )
                                need = 2 if len(dict_items) >= 4 else 1
                                if hits >= need:
                                    for x in dict_items:
                                        if not isinstance(x, dict):
                                            continue
                                        if not self._shopee_dict_looks_like_review_strict(x):
                                            continue
                                        norm = self._normalize_raw_shopee_review(x)
                                        c = norm.get("content") or ""
                                        if len(c) < 6:
                                            continue
                                        key = " ".join(c.split()).lower()[:240]
                                        if key in seen:
                                            continue
                                        seen.add(key)
                                        out.append(norm)
                                        if not hit_path:
                                            hit_path = nk
                                        if len(out) >= 10:
                                            logger.info(
                                                "[EcomStruct][ShopeeExtractor] raw_reviews_embedded_path=%s count=%d",
                                                hit_path,
                                                len(out),
                                            )
                                            return out[:10]
                        for i, it in enumerate(v[:40]):
                            if isinstance(it, dict):
                                queue.append((it, f"{nk}[{i}]"))
                    elif isinstance(v, dict):
                        queue.append((v, nk))
            elif isinstance(node, list):
                for i, it in enumerate(node[:40]):
                    if isinstance(it, dict):
                        queue.append((it, f"{path}[{i}]"))

        if out:
            logger.info(
                "[EcomStruct][ShopeeExtractor] raw_reviews_embedded_path=%s count=%d",
                hit_path or "(multi)",
                len(out),
            )
        else:
            logger.info(
                "[EcomStruct][ShopeeExtractor] raw_reviews_full_state=0 — "
                "典型 PDP 源码仅 item_rating（评分聚合）与 cmt_count，无 comment 正文数组；"
                "评论列表需独立接口（如 item/get_ratings）。"
            )
        return out[:10]

    def _extract_shopee_reviews_from_pdp_object(self, root: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Best-effort: find embedded review/comment lists in Shopee PDP JSON (same page as item).
        Many listings omit full comment bodies; then this returns [].
        """
        out: List[Dict[str, Any]] = []
        seen = set()
        queue: List[Any] = [root]
        visited = 0
        while queue and visited < 200 and len(out) < 12:
            node = queue.pop(0)
            visited += 1
            if not isinstance(node, dict):
                continue
            for _k, v in list(node.items())[:50]:
                if isinstance(v, list) and 1 <= len(v) <= 80:
                    dict_items = [x for x in v if isinstance(x, dict)]
                    if len(dict_items) < 1:
                        continue
                    hits = sum(1 for x in dict_items[:5] if self._shopee_dict_looks_like_review(x))
                    if hits < 1:
                        continue
                    for x in dict_items:
                        if not isinstance(x, dict):
                            continue
                        norm = self._normalize_raw_shopee_review(x)
                        c = norm.get("content") or ""
                        if len(c) < 6:
                            continue
                        key = " ".join(c.split()).lower()[:240]
                        if key in seen:
                            continue
                        seen.add(key)
                        out.append(norm)
                        if len(out) >= 10:
                            logger.info(
                                "[EcomStruct][ShopeeExtractor] raw_reviews_extracted=%d (pdp_embedded)",
                                len(out),
                            )
                            return out
                elif isinstance(v, dict):
                    queue.append(v)
                elif isinstance(v, list):
                    for it in v[:25]:
                        if isinstance(it, dict):
                            queue.append(it)
        if not out:
            logger.info(
                "[EcomStruct][ShopeeExtractor] raw_reviews_item_subtree=0 "
                "(item 节点内无评论正文列表；聚合路径多为 item.item_rating、item.cmt_count)"
            )
        else:
            logger.info("[EcomStruct][ShopeeExtractor] raw_reviews_extracted=%d (pdp_embedded)", len(out))
        return out[:10]

    def _extract_pdp_rating_review_currency_fields(self, item: Dict[str, Any]) -> tuple[float, int, str]:
        try:
            ir = item.get("item_rating")
            rs = ir.get("rating_star", 0) if isinstance(ir, dict) else 0
            rating = float(rs or 0)
            rc = item.get("cmt_count", 0)
            if rc in (None, "", "N/A"):
                review_count = 0
            else:
                review_count = int(float(rc))
            cur = item.get("currency", "SGD")
            currency = str(cur).strip() if cur not in (None, "") else "SGD"
            if not currency:
                currency = "SGD"
            return rating, review_count, currency
        except Exception as e:
            logger.error("[SHOPEE_PARSE] rating/review_count/currency extract failed: %s", e)
            return 0.0, 0, "SGD"

    def _candidate_from_obj(
        self,
        obj: Dict[str, Any],
        path: str,
        *,
        script_idx: int,
        script_price: str,
        script_price_source: str,
        script_price_raw: Any,
    ) -> Dict[str, Any]:
        item_id = obj.get("itemid") or obj.get("item_id") or ""
        shop_id = obj.get("shopid") or obj.get("shop_id") or ""
        title = str(obj.get("name") or obj.get("title") or "").strip()
        description = str(obj.get("description") or obj.get("item_desc") or "").strip()
        rating, review_count, currency = self._extract_pdp_rating_review_currency_fields(obj)
        if rating == 0.0:
            try:
                rating = float(obj.get("ratingStar") or obj.get("rating") or 0.0)
            except Exception:
                rating = 0.0
        if review_count == 0:
            review_fallback = obj.get("comment_count") or obj.get("comments")
            if review_fallback not in (None, "", "N/A"):
                try:
                    review_count = int(float(review_fallback))
                except Exception:
                    pass

        images = self._extract_images_from_obj(obj)
        pdp_price, pdp_price_raw = self._extract_pdp_item_price(obj)

        # 优先使用 PDP item 价格；其次脚本级 offers；最后回退原有逻辑
        if pdp_price != "N/A":
            price, price_source, price_raw = pdp_price, f"{path}.item_price", pdp_price_raw
        elif script_price != "N/A":
            price, price_source, price_raw = script_price, script_price_source, script_price_raw
        else:
            price, price_source, price_raw = self._extract_price_from_obj(obj, path)
        sold_count = obj.get("historical_sold") or obj.get("sold") or 0
        try:
            sold_count = int(sold_count)
        except Exception:
            sold_count = 0

        if not any([item_id, shop_id, title, price != "N/A", images, review_count > 0]):
            return {}

        return {
            "product_id": str(item_id) if item_id not in (None, "") else "",
            "shop_id": str(shop_id) if shop_id not in (None, "") else "",
            "title": title,
            "price": price,
            "has_price": price not in (None, "", "N/A", 0, "0"),
            "rating": rating,
            "review_count": review_count,
            "currency": currency or "SGD",
            "raw_images": images[:20],
            "description": description,
            "sold_count": sold_count,
            "price_source": price_source,
            "price_raw": price_raw,
        }

    def _extract_images_from_obj(self, obj: Dict[str, Any]) -> List[str]:
        images: List[str] = []

        def add_value(v: Any):
            if isinstance(v, str):
                vv = v.strip()
                if not vv:
                    return
                if vv.startswith("http://") or vv.startswith("https://"):
                    images.append(vv)
                else:
                    # hash -> shopee url
                    if re.fullmatch(r"[a-fA-F0-9]{32,64}", vv):
                        images.append(f"https://cf.shopee.sg/file/{vv}")
            elif isinstance(v, list):
                for it in v:
                    add_value(it)

        for key in ("image", "images", "image_url", "imageUrl"):
            if key in obj:
                add_value(obj.get(key))

        # item.images / item.image
        item_obj = obj.get("item")
        if isinstance(item_obj, dict):
            for key in ("image", "images", "image_url", "imageUrl"):
                if key in item_obj:
                    add_value(item_obj.get(key))

        # model / variation neighbors
        models = obj.get("models")
        if isinstance(models, list):
            for m in models:
                if isinstance(m, dict):
                    for key in ("image", "images", "image_url", "imageUrl"):
                        if key in m:
                            add_value(m.get(key))
                    ext = m.get("extinfo")
                    if isinstance(ext, dict):
                        for key in ("image", "image_url", "imageUrl"):
                            if key in ext:
                                add_value(ext.get(key))

        return self._prioritize_images(self._uniq_keep_order(images))

    def _extract_price_from_obj(self, obj: Dict[str, Any], path: str) -> tuple[str, str, Any]:
        """
        Price extraction priority:
        1) root.offers.price (if present) -> direct return
        2) main item object direct price keys
        3) nested price objects (price_info/price_v2/price_data/item_price/display_price)
        """
        candidates: List[tuple[str, Any]] = []
        price_keys = [
            "price",
            "price_min",
            "price_max",
            "price_before_discount",
            "priceMin",
            "priceMax",
            "min_price",
            "max_price",
            "discounted_price",
            "price_info",
            "item_price",
            "display_price",
            "raw_discount",
        ]
        max_candidates = 10

        def _push_candidate(source: str, value: Any):
            if value in (None, "", "N/A"):
                return
            if len(candidates) >= max_candidates:
                return
            candidates.append((source, value))

        # 最高优先：root.offers.price，存在则直接返回，不再扫描其它路径
        offers_obj = obj.get("offers")
        if isinstance(offers_obj, dict) and offers_obj.get("price") not in (None, "", "N/A"):
            raw = offers_obj.get("price")
            normalized = self._normalize_price_value(raw, f"{path}.offers.price")
            if normalized != "N/A":
                return normalized, f"{path}.offers.price", raw

        # 主对象优先
        for key in price_keys:
            if key in obj:
                _push_candidate(key, obj.get(key))

        # item.* 子对象
        item_obj = obj.get("item")
        if isinstance(item_obj, dict):
            for key in price_keys + ["price_v2", "price_data"]:
                if key in item_obj:
                    _push_candidate(f"item.{key}", item_obj.get(key))

        # 一层/两层常见嵌套 price 对象
        for key in ("price_info", "price_v2", "price_data", "item_price", "display_price"):
            sub = obj.get(key)
            if isinstance(sub, dict):
                for sk, sv in sub.items():
                    if "price" in str(sk).lower() or "discount" in str(sk).lower():
                        _push_candidate(f"{key}.{sk}", sv)
            if isinstance(item_obj, dict):
                sub2 = item_obj.get(key)
                if isinstance(sub2, dict):
                    for sk, sv in sub2.items():
                        if "price" in str(sk).lower() or "discount" in str(sk).lower():
                            _push_candidate(f"item.{key}.{sk}", sv)

        # 选择候选
        for source, raw_val in candidates:
            normalized = self._normalize_price_value(raw_val, source)
            if normalized != "N/A":
                return normalized, source, raw_val
        return "N/A", "", None


    def _extract_pdp_item_price(self, obj: Dict[str, Any]) -> tuple[str, Any]:
        """Extract price directly from PDP item node."""
        raw_candidates: List[Any] = []
        # Priority: price_min -> price_max -> price -> price_before_discount -> models[0].price
        raw_candidates.append(obj.get("price_min"))
        raw_candidates.append(obj.get("price_max"))
        raw_candidates.append(obj.get("price"))
        raw_candidates.append(obj.get("price_before_discount"))

        # PDP item nested price objects (common on Shopee)
        for key in ("price_info", "price_v2", "price_data", "item_price", "display_price"):
            sub = obj.get(key)
            if isinstance(sub, dict):
                raw_candidates.append(sub.get("price_min"))
                raw_candidates.append(sub.get("price_max"))
                raw_candidates.append(sub.get("price"))
                raw_candidates.append(sub.get("price_before_discount"))

        models = obj.get("models")
        if isinstance(models, list) and models and isinstance(models[0], dict):
            model0 = models[0]
            raw_candidates.append(model0.get("price"))
            raw_candidates.append(model0.get("price_min"))
            raw_candidates.append(model0.get("price_max"))
            raw_candidates.append(model0.get("price_before_discount"))
            for key in ("price_info", "price_v2", "price_data"):
                sub = model0.get(key)
                if isinstance(sub, dict):
                    raw_candidates.append(sub.get("price_min"))
                    raw_candidates.append(sub.get("price_max"))
                    raw_candidates.append(sub.get("price"))
                    raw_candidates.append(sub.get("price_before_discount"))

        raw = None
        for candidate in raw_candidates:
            if candidate in (None, "", "N/A", 0, "0"):
                continue
            raw = candidate
            break

        if raw in (None, "", "N/A", 0, "0"):
            return "N/A", None
        normalized = self._normalize_price_value(raw, "pdp.item.price")
        if normalized in ("N/A", "0"):
            return "N/A", raw
        return normalized, raw

    def _extract_script_level_price(self, script_root_obj: Any) -> tuple[str, str, Any]:
        if not isinstance(script_root_obj, dict):
            return "N/A", "", None
        offers = script_root_obj.get("offers")
        if not isinstance(offers, dict):
            return "N/A", "", None
        raw = offers.get("price")
        if raw in (None, "", "N/A"):
            return "N/A", "", None
        normalized = self._normalize_price_value(raw, "root.offers.price")
        if normalized == "N/A":
            return "N/A", "", None
        return normalized, "root.offers.price", raw

    def _normalize_price_value(self, raw_val: Any, source: str) -> str:
        if raw_val in (None, "", "N/A"):
            return "N/A"

        # 字典/列表递归提取第一个可用数字
        if isinstance(raw_val, dict):
            for k, v in raw_val.items():
                if "price" in str(k).lower() or "discount" in str(k).lower() or isinstance(v, (int, float, str)):
                    out = self._normalize_price_value(v, f"{source}.{k}")
                    if out != "N/A":
                        return out
            return "N/A"
        if isinstance(raw_val, list):
            for i, v in enumerate(raw_val):
                out = self._normalize_price_value(v, f"{source}[{i}]")
                if out != "N/A":
                    return out
            return "N/A"

        text = str(raw_val).strip()
        m = re.search(r"-?\d+(?:\.\d+)?", text.replace(",", ""))
        if not m:
            return "N/A"
        try:
            num = float(m.group(0))
        except Exception:
            return "N/A"

        # Shopee 单位归一：常见百万/十万缩放
        if num >= 1_000_000:
            normalized = num / 1_000_000
        elif num >= 100_000:
            normalized = num / 100_000
        elif num >= 10_000:
            normalized = num / 1_000
        else:
            normalized = num

        out = f"{normalized:.2f}".rstrip("0").rstrip(".")
        return out

    def _score_candidate_obj(self, candidate: Dict[str, Any], path: str) -> tuple[int, Dict[str, Any]]:
        title = str(candidate.get("title", "")).strip()
        title_low = title.lower()
        description = str(candidate.get("description", "")).strip()
        has_description = bool(description)
        has_price = bool(candidate.get("price") and candidate.get("price") != "N/A")
        has_itemid = bool(candidate.get("product_id"))
        has_shopid = bool(candidate.get("shop_id"))
        has_images = len(candidate.get("raw_images", []) or []) > 0
        has_sold = int(candidate.get("sold_count", 0) or 0) > 0
        has_cmt = int(candidate.get("review_count", 0) or 0) > 0
        images_count = len(candidate.get("raw_images", []) or [])

        score = 0
        # 优先级规则
        if has_itemid and has_shopid and title and images_count > 1:
            score += 100
        if has_itemid and has_shopid and title and has_cmt:
            score += 80
        if has_itemid and has_shopid and title and has_price:
            score += 60
        if has_price:
            score += 50
        if has_description:
            score += 30
        if has_images:
            score += min(images_count * 8, 32)
        if has_cmt:
            score += 20

        # 属性节点排除/降权
        if title_low in {"material", "size", "color", "variation", "type"}:
            score -= 120
        path_low = path.lower()
        if any(k in path_low for k in ("tier_variation", "model", "option", "attribute")):
            score -= 70
        if title and has_images and not has_description and not has_price:
            score -= 50

        signals = {
            "has_description": has_description,
            "has_price": has_price,
            "has_itemid": has_itemid,
            "has_shopid": has_shopid,
            "has_images": has_images,
            "has_sold": has_sold,
            "has_cmt": has_cmt,
        }
        return score, signals

    def _validate_script_candidate(self, candidate: Dict[str, Any]) -> tuple[bool, str, int]:
        title = str(candidate.get("title", "")).strip()
        title_low = title.lower()
        images = candidate.get("raw_images", []) or []
        images_count = len(images)
        has_price = bool(candidate.get("price") and candidate.get("price") != "N/A")
        has_itemid = bool(candidate.get("product_id"))
        has_shopid = bool(candidate.get("shop_id"))
        review_count = int(candidate.get("review_count", 0) or 0)

        placeholder_titles = {"shopee__domain", "shopee", "product", "item"}
        title_valid = bool(title) and title_low not in placeholder_titles and len(title) > 4
        has_non_thumb_main = bool(self._select_main_image(images))

        # 候选打分规则（越高越优先）
        score = 0
        if has_itemid and has_shopid and title_valid and images_count > 1:
            score += 100
        if has_itemid and has_shopid and title_valid and review_count > 0:
            score += 80
        if has_itemid and has_shopid and title_valid and has_price:
            score += 60
        if images_count >= 3:
            score += 50
        if review_count > 0:
            score += 30
        if has_non_thumb_main:
            score += 20
        if title_low in placeholder_titles:
            score -= 80

        if not (has_itemid and has_shopid and title_valid):
            return False, "missing_core_identity_fields", score

        # 关键调整：即使目前只有 thumbnail，只要商品信号强，也先接受（后续再补图）
        strong_identity_with_reviews = has_itemid and has_shopid and title_valid and review_count > 0
        if images_count == 0 and not strong_identity_with_reviews:
            return False, "no_images_and_not_strong_identity", score

        if title_low in placeholder_titles:
            return False, "placeholder_title", score

        return True, "accepted", score

    def _select_main_image(self, images: List[str]) -> str:
        if not images:
            return ""
        for img in images:
            if not self._is_low_quality_image(img):
                return img
        return images[0]

    def _is_low_quality_image(self, url: str) -> bool:
        u = (url or "").lower()
        return any(k in u for k in ("@resize_w80", "@resize_w100", "thumbnail", "thumb"))

    def _prioritize_images(self, items: List[str]) -> List[str]:
        high = [x for x in items if not self._is_low_quality_image(x)]
        low = [x for x in items if self._is_low_quality_image(x)]
        return high + low

    def _extract_images_from_script(self, text: str) -> List[str]:
        images: List[str] = []
        # 1) full URLs
        images += re.findall(r"https://cf\.shopee\.[^\"'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^\"'\s]*)?", text)
        images += re.findall(r"https://down-[^\"'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^\"'\s]*)?", text)

        # 2) image-like keys with hashes
        hash_candidates = []
        hash_candidates += re.findall(r'"images?"\s*:\s*\[([^\]]+)\]', text)
        hash_candidates += re.findall(r'"image(?:_url|Url)?"\s*:\s*"([^"]+)"', text)
        hash_candidates += re.findall(r'"item\.images"\s*:\s*\[([^\]]+)\]', text)
        hash_candidates += re.findall(r'"item\.image"\s*:\s*"([^"]+)"', text)
        hash_candidates += re.findall(r'"modelid"\s*:\s*\d+[^{}]{0,400}"image"\s*:\s*"([^"]+)"', text)

        for blob in hash_candidates:
            if not isinstance(blob, str):
                continue
            # 32/64 length hex-ish shopee image ids
            for h in re.findall(r"[a-fA-F0-9]{32,64}", blob):
                images.append(f"https://cf.shopee.sg/file/{h}")
            # allow existing url-style tokens
            for u in re.findall(r"https?://[^\"'\s,]+", blob):
                images.append(u)

        return self._prioritize_images(self._uniq_keep_order(images))

    def _debug_script_candidates(self, soup: BeautifulSoup) -> None:
        scripts = soup.find_all("script")
        for idx, script in enumerate(scripts):
            text = (script.string or script.get_text() or "").strip()
            if not text:
                continue
            lower = text.lower()
            has_itemid = "itemid" in lower
            has_shopid = "shopid" in lower
            has_images = any(k in lower for k in ("image", "images", "image_url", "imageurl"))
            has_sold = any(k in lower for k in ("historical_sold", '"sold"', "sold"))
            has_cmt = "cmt_count" in lower
            has_name = any(k in lower for k in ('"name"', '"title"'))
            has_model = any(k in lower for k in ("modelid", "tier_variations"))

            # 仅输出有商品信号的脚本，减少噪音
            signals = sum([has_itemid, has_shopid, has_images, has_sold, has_cmt, has_name, has_model])
            if signals < 2:
                continue

            preview = re.sub(r"\s+", " ", text)[:200]
            logger.info(
                "[EXTRACTOR_DEBUG] script_index=%d length=%d has_itemid=%s has_shopid=%s has_images=%s has_sold=%s has_cmt=%s preview=%s",
                idx,
                len(text),
                has_itemid,
                has_shopid,
                has_images,
                has_sold,
                has_cmt,
                preview,
            )

    @staticmethod
    def _uniq_keep_order(items: List[str]) -> List[str]:
        seen = set()
        out = []
        for x in items:
            if not x or x in seen:
                continue
            seen.add(x)
            out.append(x)
        return out

