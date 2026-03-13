"""
CEO Agent Service (Orchestrator)

架构：
- Classify: 判断需要激活哪些 agents
- Dispatch: 分发任务给各 agents
- Aggregate: 聚合各 agent 结果为统一格式
"""

from typing import List, Dict, Any, Set, Optional
import logging
from .reddit_agent import reddit_agent
from .seo_agent import seo_agent
from .xai_search import xai_search_service
from .ai_report_service import ai_report_service
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
            # 调用 X Provider 获取 mentions
            mentions = await x_provider.search_mentions(query, limit)

            # 防空处理 mentions
            processed_mentions = []
            positive_count = 0
            negative_count = 0
            neutral_count = 0

            for m in mentions:
                if not m:
                    continue

                # 防空处理各字段
                author_display = getattr(m, 'author_display_name', None) or getattr(m, 'author', '') or ''
                author = getattr(m, 'author', '') or ''
                likes = getattr(m, 'likes', 0)
                comments = getattr(m, 'comments', 0)
                shares = getattr(m, 'shares', 0)
                sentiment = getattr(m, 'sentiment', 'neutral')
                text = getattr(m, 'text', '')

                # 统计情绪
                if sentiment == "positive":
                    positive_count += 1
                elif sentiment == "negative":
                    negative_count += 1
                else:
                    neutral_count += 1

                processed_mentions.append({
                    "text": text,
                    "author": author_display or author,
                    "engagement": likes + comments + shares,
                    "sentiment": "积极" if sentiment == "positive" else
                                "消极" if sentiment == "negative" else "中性"
                })

            # 构建返回结果（严格对齐后端 schema）
            result = {
                "mentions": processed_mentions,
                "stats": {
                    "total_mentions": len(processed_mentions),
                    "positive_count": positive_count,
                    "negative_count": negative_count,
                    "neutral_count": neutral_count
                },
                "sentimentTrend": [],  # 第一版不生成
                "influencers": [],  # 第一版不生成
                "alerts": [],
                "summary": f"关于 {query} 的 X 平台相关讨论",
                "topics": []  # 第一版不提取
            }

            return result

        except Exception as e:
            logger.error(f"[CEO_DISPATCH] X agent failed: {str(e)}")
            # 返回标准空对象，确保 schema 一致
            return {
                "mentions": [],
                "stats": {"total_mentions": 0, "positive_count": 0, "negative_count": 0, "neutral_count": 0},
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
            # 返回标准空对象，确保 schema 一致
            return {
                "executive_summary": f"无法生成 {query} 的 AI 咨询报告",
                "market_analysis": "暂无市场分析",
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
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        运行完整分析流程（orchestrator 主入口）

        流程：
        1. Classify: 判断激活哪些 agents
        2. Dispatch: 分发任务给 agents
        3. Aggregate: 聚合结果
        """
        logger.info(f"[CEO_ORCHESTRATOR] Starting analysis for: '{query}'")

        # 1. CLASSIFY: 决定激活哪些 agents
        enabled_agents = {"reddit", "seo"}  # 基础 agents 始终启用

        # 动态判断是否启用 X
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


# Singleton instance
ceo_agent = CEOAgent()
