"""
CEO Agent Service (Orchestrator)

架构：
- Classify: 判断需要激活哪些 agents
- Dispatch: 分发任务给各 agents
- Aggregate: 聚合各 agent 结果为统一格式
"""

from typing import List, Dict, Any, Set, Optional, Tuple
import logging

from .reddit_agent import reddit_agent
from .seo_agent import seo_agent
from .xai_search import xai_search_service
from .ai_report_service import ai_report_service
from .scrape_do_service import ScrapeDoService
from .ceo_tools import ImageGenerationTool
from .analysis_agent import call_grok_analysis
from ..analysis.gap_analysis import analyze_keyword_gap
from ..analysis.content_ideas import generate_content_ideas

# Configure logging
logger = logging.getLogger(__name__)


def format_display_keyword(keyword: str) -> str:
    """
    Format keyword for user-friendly display.

    Converts underscores to spaces, capitalizes words, and preserves
    common tech abbreviations.

    Args:
        keyword: Raw keyword string (e.g., "codex_cli")

    Returns:
        Formatted display string (e.g., "Codex CLI")

    Examples:
        "codex_cli" -> "Codex CLI"
        "api_integration" -> "API Integration"
        "seo_tips" -> "SEO Tips"
        "vscode_extensions" -> "VSCode Extensions"
        "gpt_copilot" -> "GPT Copilot"
    """
    if not keyword:
        return ""

    # Known abbreviations to preserve in uppercase
    KNOWN_ABBR = {
        "api": "API",
        "cli": "CLI",
        "seo": "SEO",
        "ide": "IDE",
        "vscode": "VSCode",
        "gpt": "GPT",
        "ai": "AI",
        "ux": "UX",
        "ui": "UI",
        "http": "HTTP",
        "https": "HTTPS",
        "json": "JSON",
        "csv": "CSV",
        "sql": "SQL",
        "html": "HTML",
        "css": "CSS",
        "js": "JS",
        "ts": "TS",
        "py": "PY",
        "rb": "RB",
        "go": "Go",
        "rs": "RS"
    }

    # Replace underscores with spaces
    text = keyword.replace("_", " ")

    # Split into words
    words = text.split()

    # Format each word
    formatted_words = []
    for word in words:
        lower_word = word.lower()
        if lower_word in KNOWN_ABBR:
            formatted_words.append(KNOWN_ABBR[lower_word])
        else:
            # Capitalize first letter, lowercase rest
            formatted_words.append(word.capitalize())

    return " ".join(formatted_words)


class CEOAgent:
    """
    CEO Orchestrator

    职责：
    - 分析查询，决定激活哪些 agents
    - 分发任务给独立 agents
    - 聚合结果为统一格式
    """

    def __init__(self):
        """Initialize CEO orchestrator with sub-agents."""
        self.reddit_agent = reddit_agent
        self.seo_agent = seo_agent
        self.x_agent = xai_search_service
        self.ai_report_service = ai_report_service
        self.image_generation_tool = ImageGenerationTool()

    # ========== 1. CLASSIFY LAYER ==========

    def _should_enable_x_analysis(self, query: str) -> bool:
        """
        判断是否启用 X 分析

        支持的 provider：
        - "mock": 使用 mock 数据
        - "xai": 使用真实 X API

        判断逻辑：
        1. 检查 X_ANALYSIS_PROVIDER 配置
        2. 只在 provider 为 "mock" 或 "xai" 时启用
        """
        from ..config import settings

        # 防空处理
        provider = (settings.X_ANALYSIS_PROVIDER or "").lower()

        # 支持的 provider 集合
        supported_providers = {"mock", "xai"}

        if provider not in supported_providers:
            logger.warning(f"[CEO_CLASSIFY] Unsupported X_ANALYSIS_PROVIDER: '{provider}'. X analysis disabled.")
            return False

        logger.info(f"[CEO_CLASSIFY] X analysis enabled (provider={provider})")
        return True

    # ========== 2. DISPATCH LAYER ==========

    async def _call_reddit_agent(self, query: str, limit: int) -> Dict[str, Any]:
        """封装 Reddit agent 调用"""
        logger.info(f"[CEO_DISPATCH] Calling Reddit Agent")
        return await self.reddit_agent.run_analysis(keywords=[query], subreddits=None, limit=limit)

    async def _call_seo_agent(self, query: str, limit: int) -> Dict[str, Any]:
        """封装 SEO agent 调用"""
        logger.info(f"[CEO_DISPATCH] Calling SEO Agent")
        return await self.seo_agent.run_analysis(keywords=[query], site_url=None, limit=limit)

    async def _call_ecom_parser(self, url: str) -> Dict[str, Any]:
        """封装电商商品URL解析：调用 scrape.do 并返回结构化结果"""
        logger.info(f"[CEO_DISPATCH] Calling Ecom Parser for URL: {url}")

        try:
            scrape_service = ScrapeDoService()
            parse_result = await scrape_service.scrape_and_parse(url)

            structured = parse_result.get("structured_data", {})

            enhanced_query = f"""
你是 Vibe Marketing 的 CEO，请用**专业、锐利、带营销洞察的中文**，对这个 Amazon 商品进行完整营销诊断和优化建议。

商品基础信息：
- 标题：{structured.get('title', 'N/A')}
- 价格：{structured.get('price', 'N/A')}
- 原价：{structured.get('original_price', 'N/A')}
- 评分：{structured.get('rating', 'N/A')} 分（{structured.get('review_count', 0)} 条评价）
- 主图：{structured.get('main_image', 'N/A')}
- 主图/图片列表（最多展示前 8 张）：{(structured.get('images') or [])[:8]}
- 品牌：{structured.get('brand', 'N/A')}
- Bullet Points（若有）：{(structured.get('bullet_points') or [])[:8]}
- 简短描述（若有）：{structured.get('description', '')}
- URL：{url}

请严格按照以下结构输出（使用 Markdown 格式）：

# Vibe Marketing 商品分析报告

## 1. 当前 Vibe 诊断
（从视觉、卖点、竞争力三个维度分析当前页面氛围和问题）

## 2. 标题优化建议
给出 3 个更吸引人的标题版本（带理由）

## 3. 主图与视觉优化建议
基于「当前主图 + 图片列表 + bullet points」，给出可直接执行的主图/视觉优化清单：
- 现有主图的主要问题（3-5条）
- 新主图的构图/元素/文案建议（3套方向）
- 详情图（若有多图）如何分镜与信息层级
- 颜色/字体/对比度/信任背书（评分、认证、对比图）如何呈现

## 4. 定价与促销策略
当前定价是否合理？建议怎么调价、用什么促销手段

## 5. 卖点提炼（推荐 Bullet Points）
给出 5-7 条高转化率的 bullet points

语气要专业、自信、带干货，像顶级营销顾问在给客户做方案。全部用中文输出。
"""

            grok_analysis = await self._call_grok_analysis(enhanced_query)

            return {
                "type": "ecom_product_analysis",
                "parse_data": {
                    "title": structured.get("title", "N/A"),
                    "price": structured.get("price", "N/A"),
                    "original_price": structured.get("original_price", "N/A"),
                    "rating": structured.get("rating", 0.0),
                    "review_count": structured.get("review_count", 0),
                    "reviews": structured.get("reviews", []) or [],
                    "main_image": structured.get("main_image", ""),
                    "images": structured.get("images", []) or [],
                    "brand": structured.get("brand", "N/A"),
                    "bullet_points": structured.get("bullet_points", []) or [],
                    "description": structured.get("description", ""),
                    "url": url,
                    "platform": "amazon"
                },
                "ceo_analysis": grok_analysis,
                "status": "success",
                "message": "Vibe Marketing 商品解析完成"
            }

        except Exception as e:
            logger.error(f"[CEO_DISPATCH] Ecom Parser failed for {url}: {str(e)}")
            return {
                "type": "ecom_product_analysis",
                "parse_data": {
                    "title": "解析失败",
                    "price": "N/A",
                    "rating": 0.0,
                    "review_count": 0,
                    "reviews": [],
                    "main_image": "",
                    "brand": "N/A",
                    "url": url,
                    "platform": "amazon"
                },
                "ceo_analysis": f"解析失败: {str(e)}",
                "status": "error"
            }

    # ========== 图片优化（指挥：抓取 + 委托 ImageGenerationTool）==========

    @staticmethod
    def _ecom_parse_data_from_structured(
        structured: Dict[str, Any],
        product_url: str,
        *,
        optimized_images: Optional[List[str]] = None,
        image_generation_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "title": structured.get("title", "N/A"),
            "price": structured.get("price", "N/A"),
            "original_price": structured.get("original_price", "N/A"),
            "rating": structured.get("rating", 0.0),
            "review_count": structured.get("review_count", 0),
            "reviews": structured.get("reviews", []) or [],
            "main_image": structured.get("main_image", ""),
            "images": structured.get("images", []) or [],
            "brand": structured.get("brand", "N/A"),
            "bullet_points": structured.get("bullet_points", []) or [],
            "description": structured.get("description", ""),
            "url": product_url,
            "platform": "amazon",
        }
        if optimized_images is not None:
            d["optimized_images"] = optimized_images
        if image_generation_provider:
            d["image_generation_provider"] = image_generation_provider
        return d

    async def _generate_optimized_images(
        self,
        user_prompt: str,
        reference_images: List[str],
    ) -> Tuple[List[str], str]:
        refs = [u for u in reference_images if isinstance(u, str) and u.strip()][:6]
        if not refs:
            raise ValueError("至少需要选择一张参考图")
        if not user_prompt.strip():
            raise ValueError("user_prompt 不能为空")
        return await self.image_generation_tool.generate(user_prompt.strip(), refs)

    async def _handle_ecom_optimize_images(
        self,
        product_url: str,
        user_prompt: str,
        reference_images: List[str],
    ) -> Dict[str, Any]:
        """抓取商品页 → 调用主图生成工具 → 写入 parse_data。"""
        if not self._is_ecom_product_url(product_url):
            return {
                "type": "ecom_product_analysis",
                "parse_data": {"url": product_url, "platform": "amazon"},
                "ceo_analysis": "图片优化失败：query 必须是已支持的电商商品 URL。",
                "status": "error",
                "message": "无效的电商 URL",
            }

        refs = [u for u in (reference_images or []) if isinstance(u, str) and u.strip()][:6]
        up = (user_prompt or "").strip()
        if not refs or not up:
            return {
                "type": "ecom_product_analysis",
                "parse_data": {"url": product_url, "platform": "amazon"},
                "ceo_analysis": "图片优化失败：请提供 user_prompt 并至少选择一张参考图。",
                "status": "error",
                "message": "参数不完整",
            }

        try:
            parse_result = await ScrapeDoService().scrape_and_parse(product_url)
            structured = parse_result.get("structured_data", {}) or {}
        except Exception as e:
            logger.error("[CEO_IMAGE] 抓取失败：%s", e)
            return {
                "type": "ecom_product_analysis",
                "parse_data": {"url": product_url, "platform": "amazon"},
                "ceo_analysis": f"图片优化失败：无法抓取商品页 — {e}",
                "status": "error",
                "message": "抓取失败",
            }

        try:
            optimized, provider = await self._generate_optimized_images(up, refs)
        except Exception as e:
            logger.error("[CEO_IMAGE] 生成失败：%s", e)
            return {
                "type": "ecom_product_analysis",
                "parse_data": self._ecom_parse_data_from_structured(
                    structured, product_url, optimized_images=[]
                ),
                "ceo_analysis": (
                    f"图片优化失败：{e}。"
                    "请检查 GEMINI_API_KEY（及 GEMINI_IMAGE_MODEL）或 XAI_API_KEY。"
                ),
                "status": "error",
                "message": "主图优化失败",
            }

        parse_data = self._ecom_parse_data_from_structured(
            structured,
            product_url,
            optimized_images=optimized,
            image_generation_provider=provider,
        )
        return {
            "type": "ecom_product_analysis",
            "parse_data": parse_data,
            "ceo_analysis": (
                f"CEO 已编排完成主图优化（**{provider}**），共 **{len(optimized)}** 张。"
                " 结果见 `parse_data.optimized_images`。"
            ),
            "status": "success",
            "message": "图片优化完成",
        }

    async def _call_x_agent(
        self,
        query: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        封装 X Agent 调用（独立 agent）
        调用 x_provider.search_mentions，返回统一格式
        失败或无数据时返回标准空对象，确保 schema 一致
        """
        logger.info(f"[CEO_DISPATCH] Calling X Agent for: {query}")

        from ..providers.x_provider import x_provider
        from ..config import settings

        try:
            mentions = await x_provider.search_mentions(query, limit)

            texts = [m.text for m in mentions if m and getattr(m, "text", None)]
            sentiments = await xai_search_service.analyze_sentiment_batch(texts) if texts else []

            processed_mentions = []
            positive_count = 0
            negative_count = 0
            neutral_count = 0

            for i, m in enumerate(mentions):
                if not m:
                    continue

                sentiment_data = sentiments[i] if i < len(sentiments) else {}

                raw_label = (
                    sentiment_data.get("label")
                    or sentiment_data.get("sentiment")
                    or "neutral"
                )

                label = str(raw_label).strip().lower()

                if label in ("积极", "positive", "pos"):
                    final_label = "positive"
                elif label in ("消极", "negative", "neg"):
                    final_label = "negative"
                else:
                    final_label = "neutral"

                score = sentiment_data.get("score") or sentiment_data.get("sentiment_score", 0.0)

                if final_label == "positive":
                    positive_count += 1
                elif final_label == "negative":
                    negative_count += 1
                else:
                    neutral_count += 1

                author_display = getattr(m, "author_display_name", None) or getattr(m, "author", "") or ""
                author = getattr(m, "author", "") or ""
                likes = getattr(m, "likes", 0) or 0
                comments = getattr(m, "comments", 0) or 0
                shares = getattr(m, "shares", 0) or 0
                text = getattr(m, "text", "") or ""
                tweet_id = getattr(m, "id", "") or getattr(m, "tweet_id", "") or ""
                author_username = getattr(m, "author_username", "") or ""
                url = getattr(m, "url", "") or ""

                created_at = ""
                timestamp = getattr(m, "timestamp", None)
                if timestamp:
                    try:
                        created_at = timestamp.isoformat()
                    except Exception:
                        created_at = ""

                processed_mentions.append({
                    "text": text,
                    "author": author_display or author,
                    "engagement": likes + comments + shares,
                    "sentiment": "积极" if final_label == "positive" else "消极" if final_label == "negative" else "中性",
                    "sentiment_score": score,
                    "tweet_id": tweet_id,
                    "author_username": author_username,
                    "url": url,
                    "created_at": created_at,
                })

            result = {
                "mentions": processed_mentions,
                "stats": {
                    "total_mentions": len(processed_mentions),
                    "positive_count": positive_count,
                    "negative_count": negative_count,
                    "neutral_count": neutral_count
                },
                "sentimentTrend": [],
                "influencers": [],
                "alerts": [],
                "summary": f"关于 {query} 的 X 平台相关讨论",
                "topics": []
            }

            return result

        except Exception as e:
            logger.error(f"[CEO_DISPATCH] X agent failed: {str(e)}")
            return {
                "mentions": [],
                "stats": {
                    "total_mentions": 0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "neutral_count": 0
                },
                "sentimentTrend": [],
                "influencers": [],
                "alerts": [f"X 分析失败: {str(e)}"],
                "summary": f"无法分析 {query} 的 X 平台数据",
                "topics": []
            }

    async def _call_ai_report_analysis(
        self,
        query: str,
        reddit_result: Dict[str, Any],
        seo_result: Dict[str, Any],
        x_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        调用 AI Report Service 生成咨询报告（占位实现）

        返回标准化的报告结构
        """
        logger.info(f"[CEO_DISPATCH] Calling AI Report Service for: {query}")

        try:
            report = await self.ai_report_service.generate_ai_report(
                query=query,
                reddit_result=reddit_result,
                seo_result=seo_result,
                x_result=x_result
            )
            return report
        except Exception as e:
            logger.error(f"[CEO_DISPATCH] AI Report Service failed: {str(e)}")
            # 返回「报告不可用」的空结构，避免伪造策略内容，保持 schema 一致
            return {
                "executive_summary": "",
                "market_analysis": "",
                "key_findings": [],
                "strategy_recommendations": [],
                "methods": [],
                "content_plan": {
                    "articles": [],
                    "social_posts": [],
                    "video_ideas": [],
                    "poster_ideas": []
                }
            }

    # ========== 3. AGGREGATE LAYER ==========

    async def _extract_topics(self, reddit_result: Dict, seo_result: Dict) -> tuple:
        """提取 topics（基于 reddit + seo，第一版不包含 x）"""
        reddit_topics = reddit_result.get("topics", [])
        seo_topics = seo_result.get("topics", [])
        logger.info(f"[CEO_AGGREGATE] Reddit topics: {reddit_topics}")
        logger.info(f"[CEO_AGGREGATE] SEO topics: {seo_topics}")
        return reddit_topics, seo_topics

    async def _call_gap_analysis(self, reddit_topics: List[str], seo_topics: List[str]) -> Dict[str, Any]:
        """调用 Gap Analysis"""
        logger.info(f"[CEO_AGGREGATE] Calling Gap Analysis")
        return analyze_keyword_gap(reddit_topics=reddit_topics, seo_topics=seo_topics)

    async def _call_content_ideas_agent(
        self,
        reddit_topics: List[str],
        seo_topics: List[str],
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """调用 Content Ideas Agent"""
        logger.info(f"[CEO_AGGREGATE] Calling Content Ideas Agent")
        ideas_result = generate_content_ideas(
            reddit_topics=reddit_topics,
            seo_topics=seo_topics,
            opportunities=opportunities
        )

        # 格式化 target_keyword
        content_ideas = ideas_result.get("content_ideas", [])
        for idea in content_ideas:
            idea["target_keyword"] = format_display_keyword(idea.get("target_keyword", ""))

        return content_ideas

    async def _aggregate_full_result(
        self,
        query: str,
        agent_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """聚合所有 agent 结果为统一格式"""
        reddit_result = agent_results.get("reddit", {})
        seo_result = agent_results.get("seo", {})
        x_result = agent_results.get("x", {})

        # 提取 topics
        reddit_topics, seo_topics = await self._extract_topics(reddit_result, seo_result)

        # Gap analysis（基于 reddit + seo，不包含 x）
        gap_result = await self._call_gap_analysis(reddit_topics, seo_topics)

        # Content ideas（基于 gap）
        content_ideas = await self._call_content_ideas_agent(
            reddit_topics,
            seo_topics,
            gap_result.get("opportunities", [])
        )

        # ========== AI REPORT LAYER (占位实现) ==========
        ai_report = await self._call_ai_report_analysis(
            query=query,
            reddit_result=reddit_result,
            seo_result=seo_result,
            x_result=x_result
        )

        # 调试：打印原始 mentions 样本（便于排查脏数据来源）
        try:
            import json as _json

            if reddit_result.get("mentions"):
                logger.info("=== REDDIT MENTION SAMPLE ===")
                logger.info(
                    _json.dumps(reddit_result.get("mentions", [])[:3], ensure_ascii=False, indent=2)
                )

            if seo_result.get("mentions"):
                logger.info("=== SEO MENTION SAMPLE ===")
                logger.info(
                    _json.dumps(seo_result.get("mentions", [])[:3], ensure_ascii=False, indent=2)
                )

            if x_result.get("mentions"):
                logger.info("=== X MENTION SAMPLE ===")
                logger.info(
                    _json.dumps(x_result.get("mentions", [])[:3], ensure_ascii=False, indent=2)
                )
        except Exception as _e:
            logger.warning(f"[CEO_AGGREGATE] Failed to log mention samples: {_e}")

        # 构建统一结果
        result = {
            "query": query,
            "reddit_analysis": reddit_result,
            "seo_analysis": seo_result,
            "x_analysis": x_result,  # X 作为独立结果
            "gap_analysis": gap_result,
            "content_ideas": content_ideas,
            "report": ai_report,
        }

        logger.info(f"[CEO_AGGREGATE] Full analysis complete")
        return result

    # ========== 4. PUBLIC ENTRY ==========

    async def run_full_analysis(
        self,
        query: str,
        limit: int = 20,
        action: Optional[str] = None,
        user_prompt: Optional[str] = None,
        selected_reference_images: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        运行完整分析流程（orchestrator 主入口）

        流程：
        1. Classify: 判断激活哪些 agents
        2. Dispatch: 分发任务给 agents
        3. Aggregate: 聚合结果

        扩展：action=ecom_optimize_images 时在 CEO 内编排主图优化（Banana → Grok）。
        """
        logger.info(f"[CEO_ORCHESTRATOR] Starting analysis for: '{query}' (action={action!r})")

        if (action or "").strip() == "ecom_optimize_images":
            return await self._handle_ecom_optimize_images(
                product_url=query.strip(),
                user_prompt=(user_prompt or "").strip(),
                reference_images=list(selected_reference_images or []),
            )

        # ==================== Vibe Marketing V1.0 - 电商URL优先处理 ====================
        if self._is_ecom_product_url(query):
            logger.info(f"[CEO] Detected ecom product URL → routing to ecom parser")
            parse_result = await self._call_ecom_parser(query)
            return parse_result   # 直接返回 _call_ecom_parser 构造好的结果（包含 parse_data 和 ceo_analysis）

        # ==================== 普通关键词分析走原有逻辑 ====================
        logger.info(f"[CEO] Regular query detected, routing to SEO/Reddit/X agents")
        
        # 1. CLASSIFY: 决定激活哪些 agents
        enabled_agents = {"reddit", "seo"}
        if self._should_enable_x_analysis(query):
            enabled_agents.add("x")
        logger.info(f"[CEO_CLASSIFY] Enabled agents: {enabled_agents}")

        # 2. DISPATCH: 分发任务
        agent_results = {}
        if "reddit" in enabled_agents:
            agent_results["reddit"] = await self._call_reddit_agent(query, limit)
        if "seo" in enabled_agents:
            agent_results["seo"] = await self._call_seo_agent(query, limit)
        if "x" in enabled_agents:
            agent_results["x"] = await self._call_x_agent(query, limit)

        # 3. AGGREGATE: 聚合结果
        result = await self._aggregate_full_result(query, agent_results)
        return result

    async def _call_grok_analysis(self, prompt: str) -> Any:
        """
        复用现有 Grok 调用函数（analysis_agent.call_grok_analysis）。
        返回 Grok 的原始文本结果，由上层决定如何展示/解析。
        """
        return await call_grok_analysis(prompt)

    def _is_ecom_product_url(self, input_str: str) -> bool:
        """判断输入是否为电商商品URL"""
        if not input_str or not input_str.startswith(("http://", "https://")):
            return False

        ecom_domains = [
            "amazon.",
            "shopify.",
            "taobao.",
            "tmall.",
            "jd.com",
            "ebay.",
            "walmart.",
            "lazada.",
            "shopee.",
        ]
        input_lower = input_str.lower()
        return any(domain in input_lower for domain in ecom_domains)


# Singleton instance
ceo_agent = CEOAgent()
