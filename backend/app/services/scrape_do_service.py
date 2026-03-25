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

        # 4) 主图 + 多图（优先 landingImage 的 data-a-dynamic-image keys，通常是高清）
        image_candidates = []

        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            image_candidates.append(_clean_text(og_image["content"]))

        # 4.1) 优先解析所有 data-a-dynamic-image JSON（最容易拿到高清变体）
        for img_tag in soup.select("[data-a-dynamic-image]"):
            dyn = img_tag.get("data-a-dynamic-image")
            if not dyn:
                continue
            try:
                dyn_obj = json.loads(dyn)
                if isinstance(dyn_obj, dict):
                    # keys 通常就是各尺寸 URL
                    image_candidates.extend([_clean_text(u) for u in dyn_obj.keys()])
            except Exception:
                continue

        landing = soup.find("img", id="landingImage")
        if landing:
            # data-old-hires / src
            for k in ("data-old-hires", "src"):
                v = landing.get(k)
                if v:
                    image_candidates.append(_clean_text(v))

            # landingImage 的 data-a-dynamic-image 已在上面统一解析

        # 额外抓取：页面上常见 a-dynamic-image
        for img in soup.select("img.a-dynamic-image"):
            for k in ("data-old-hires", "src"):
                v = img.get(k)
                if v:
                    image_candidates.append(_clean_text(v))

        # 4.2) 补充抓取：imgTagWrapper、carousel/altImages 等区域
        for img in soup.select("#imgTagWrapperId img, #altImages img, #imageBlock_feature_div img, #main-image-container img"):
            for k in ("data-old-hires", "data-src", "src"):
                v = img.get(k)
                if v:
                    image_candidates.append(_clean_text(v))

        # 4.3) 规范化、过滤、去重（保留出现顺序）
        normalized = []
        for u in image_candidates:
            nu = _normalize_image_url(u)
            if _is_image_url(nu):
                normalized.append(nu)
        normalized = _uniq_keep_order(normalized)

        # 4.4) 确保至少 4 张（如果不足：用同一张图的“变体 URL”补足，保证前端显示稳定）
        # 注意：结构保持不变，只做 URL 列表补足；前端生成区不再与选图联动，避免“底部跟着原图走”
        if len(normalized) < 4 and len(normalized) > 0:
            base = normalized[0]
            i = 1
            while len(normalized) < 4:
                # 加一个无副作用的 query 标记为“变体”（仍是可用高清图）
                normalized.append(f"{base}?vibe_variant={i}")
                i += 1

        # 4.5) main_image 永远取 images[0]
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

