"""
AI Report Service

职责：
- 接收来自 CEO Orchestrator 的原始证据（Reddit/SEO/X）
- 将 query + 各 Agent 结果打包为统一 prompt
- 调用 Grok（x.ai）生成最终报告（JSON）
- 返回 JSON 格式的完整报告，结构与前端完全一致
"""

from typing import Dict, Any, List, Optional
import logging
import json

from .analysis_agent import call_grok_analysis

# Configure logging
logger = logging.getLogger(__name__)


class AIReportService:
    """
    AI Report Service
    """

    def __init__(self):
        """初始化 AI Report Service"""
        pass

    async def generate_ai_report(
        self,
        query: str,
        reddit_result: Optional[Dict[str, Any]] = None,
        seo_result: Optional[Dict[str, Any]] = None,
        x_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        生成 AI 咨询报告（占位实现）

        Args:
            query: 搜索查询
            reddit_result: Reddit Agent 返回的原始结果
            seo_result: SEO Agent 返回的原始结果
            x_result: X Agent 返回的原始结果

        Returns:
            {
                "executive_summary": "执行摘要",
                "market_analysis": "市场分析",
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
        """
        logger.info(f"[AI_REPORT_SERVICE] Generating AI report for: {query}")
        logger.info(f"[AI_REPORT_SERVICE] Reddit result: {reddit_result is not None}")
        logger.info(f"[AI_REPORT_SERVICE] SEO result: {seo_result is not None}")
        logger.info(f"[AI_REPORT_SERVICE] X result: {x_result is not None}")

        # 收集精简 evidence 样本（帮助 Grok 理解数据结构）
        evidence_samples: List[Dict[str, Any]] = []

        # 从 Reddit 结果中提取 sample（最多 3 条）
        if reddit_result:
            reddit_mentions = reddit_result.get("mentions", []) or []
            for m in reddit_mentions[:3]:
                evidence_samples.append(
                    {
                        "source": "reddit",
                        "type": "mention",
                        "sample": {
                            "text": m.get("text", ""),
                            "author": m.get("author", ""),
                            "subreddit": m.get("subreddit", ""),
                            "created_at": m.get("created_at", ""),
                        },
                    }
                )

        # 从 SEO 结果中提取 sample（最多 3 条）
        if seo_result:
            seo_mentions = seo_result.get("mentions", []) or []
            for m in seo_mentions[:3]:
                evidence_samples.append(
                    {
                        "source": "seo",
                        "type": "mention",
                        "sample": {
                            "title": m.get("title", ""),
                            "url": m.get("url", ""),
                            "domain": m.get("domain", ""),
                        },
                    }
                )

        # 从 X 结果中提取 sample（最多 3 条）
        if x_result:
            x_mentions = x_result.get("mentions", []) or []
            for m in x_mentions[:3]:
                evidence_samples.append(
                    {
                        "source": "x",
                            "type": "mention",
                            "sample": {
                                "text": m.get("text", ""),
                                "author": m.get("author", ""),
                                "engagement": m.get("engagement", 0),
                            },
                    }
                )

        logger.info(f"[AI_REPORT_SERVICE] Collected {len(evidence_samples)} evidence samples for Grok prompt")

        # 组装传给 Grok 的原始数据（避免过大，只保留核心字段）
        grok_input = {
            "query": query,
            "reddit_result": reddit_result or {},
            "seo_result": seo_result or {},
            "x_result": x_result or {},
            "evidence_samples": evidence_samples,
        }

        # 构造 Grok prompt
        grok_prompt = f"""
You are a **CEO-level marketing strategy expert**.

Your task:
- Based on the following cross-platform evidence (Reddit / SEO / X) about a market topic,
- Produce an integrated, board-ready marketing intelligence report for a startup CEO.

Persona & tone:
- Speak as a senior marketing & growth strategy leader to a CEO / founder.
- Be sharp, concise, insight-driven, and execution-oriented.

STRICT OUTPUT FORMAT (IMPORTANT):
- You MUST output **VALID JSON ONLY**.
- Do NOT add markdown, explanations, comments or backticks.
- The JSON MUST strictly match the following schema and key names:

{{
  "executive_summary": "string (1-3 段，对全局机会和风险的高层总结，用中文)",
  "market_analysis": "string (市场格局 + 需求侧/供给侧 + 渠道格局分析，用中文)",
  "key_findings": [
    "string (每条是一句话的关键发现，用中文，面向 CEO)"
  ],
  "strategy_recommendations": [
    {{
      "market_judgment": "string (对当前市场机会/风险的判断，用中文)",
      "channels": [
        "string (建议重点发力的渠道名称，如：X、Reddit、SEO、YouTube、短视频平台等)"
      ],
      "positioning": "string (品牌/产品在该话题下的建议定位，用中文)"
    }}
  ],
  "methods": [
    {{
      "name": "string (方法名称，例如「建立话题占位」)",
      "steps": [
        "string (执行步骤，按顺序，用中文)"
      ],
      "metrics": [
        "string (衡量这套方法效果的核心指标，如「曝光量」「互动率」「线索数」等)"
      ]
    }}
  ],
  "content_plan": {{
    "articles": [
      "string (长文/博客/专栏选题标题，用中文)"
    ],
    "social_posts": [
      "string (X/微博/社区短帖选题，用中文)"
    ],
    "video_ideas": [
      "string (视频选题，如 B 站/抖音，用中文)"
    ],
    "poster_ideas": [
      "string (海报/配图创意标题，用中文)"
    ]
  }}
}}

Input data (JSON,来自不同 Agent 的原始结果，仅用于参考，不要原样复述)：
{json.dumps(grok_input, ensure_ascii=False)[:6000]}

Instructions:
1. 深度理解用户在不同平台上的真实讨论、情绪和需求，不要只是重复关键词。
2. 优先输出「可执行的 CEO 级别决策信息」，而不是教科书式概念。
3. 确保所有字段都被填充，列表字段至少给出 2-3 条有差异化的选项。
4. 严格保证输出是合法可解析的 JSON。
"""

        logger.info("[AI_REPORT_SERVICE] Sending prompt to Grok for structured report generation")

        try:
            grok_response = await call_grok_analysis(grok_prompt)
        except Exception as e:
            logger.error(f"[AI_REPORT_SERVICE] Grok analysis failed: {e}")
            # Grok 调用失败时，仅返回「报告不可用」的空结构，避免伪策略误导
            fallback_result: Dict[str, Any] = {
                "executive_summary": "",
                "market_analysis": "",
                "key_findings": [],
                "strategy_recommendations": [],
                "methods": [],
                "content_plan": {
                    "articles": [],
                    "social_posts": [],
                    "video_ideas": [],
                    "poster_ideas": [],
                },
            }

            logger.info(f"[AI_REPORT_SERVICE] Returning EMPTY fallback report for: {query}")
            return fallback_result

        # 对 Grok 返回结果做容错 & 归一化，确保完全符合前端 JSON 结构
        logger.info("[AI_REPORT_SERVICE] Normalizing Grok response to frontend schema")

        def _ensure_str_list(value: Any) -> List[str]:
            if not value:
                return []
            if isinstance(value, list):
                return [str(v) for v in value]
            return [str(value)]

        # 顶层字段
        executive_summary = str(grok_response.get("executive_summary", "") or "")
        market_analysis = str(grok_response.get("market_analysis", "") or "")
        key_findings = _ensure_str_list(grok_response.get("key_findings"))

        # strategy_recommendations 归一化
        raw_strategies = grok_response.get("strategy_recommendations") or []
        strategy_recommendations: List[Dict[str, Any]] = []
        if isinstance(raw_strategies, list):
            for item in raw_strategies:
                if not isinstance(item, dict):
                    continue
                strategy_recommendations.append(
                    {
                        "market_judgment": str(item.get("market_judgment", "") or ""),
                        "channels": _ensure_str_list(item.get("channels")),
                        "positioning": str(item.get("positioning", "") or ""),
                    }
                )

        if not strategy_recommendations:
            strategy_recommendations = [
                {
                    "market_judgment": "暂无足够信息生成可靠的市场判断。",
                    "channels": [],
                    "positioning": "",
                }
            ]

        # methods 归一化
        raw_methods = grok_response.get("methods") or []
        methods: List[Dict[str, Any]] = []
        if isinstance(raw_methods, list):
            for item in raw_methods:
                if not isinstance(item, dict):
                    continue
                methods.append(
                    {
                        "name": str(item.get("name", "") or ""),
                        "steps": _ensure_str_list(item.get("steps")),
                        "metrics": _ensure_str_list(item.get("metrics")),
                    }
                )

        if not methods:
            methods = [
                {
                    "name": "占位方法",
                    "steps": ["Grok 返回结果中未包含 methods 字段，使用占位数据。"],
                    "metrics": [],
                }
            ]

        # content_plan 归一化
        raw_content_plan = grok_response.get("content_plan") or {}
        if not isinstance(raw_content_plan, dict):
            raw_content_plan = {}

        content_plan = {
            "articles": _ensure_str_list(raw_content_plan.get("articles")),
            "social_posts": _ensure_str_list(raw_content_plan.get("social_posts")),
            "video_ideas": _ensure_str_list(raw_content_plan.get("video_ideas")),
            "poster_ideas": _ensure_str_list(raw_content_plan.get("poster_ideas")),
        }

        result: Dict[str, Any] = {
            "executive_summary": executive_summary,
            "market_analysis": market_analysis,
            "key_findings": key_findings,
            "strategy_recommendations": strategy_recommendations,
            "methods": methods,
            "content_plan": content_plan,
        }

        logger.info(f"[AI_REPORT_SERVICE] AI report generated via Grok for: {query}")
        return result


# Singleton instance
ai_report_service = AIReportService()
