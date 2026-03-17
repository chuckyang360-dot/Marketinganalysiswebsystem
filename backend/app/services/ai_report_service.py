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
import re
print("🔥 AI_REPORT_SERVICE MODULE LOADED 🔥")

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

    async def _parse_grok_response(self, raw: Any) -> Dict[str, Any]:
        """
        解析 Grok 返回内容，尽可能从字符串中提取合法 JSON。

        支持：
        - 直接 JSON 字符串
        - 被 ``` / ```json 包裹的 markdown
        - 前后有解释性文字，但中间有一段 { ... } JSON
        """
        logger.error("=== ENTER _parse_grok_response ===")
        # 入口日志
        logger.info("=== PARSE_GROK_RESPONSE START ===")
        logger.info(f"Grok raw type: {type(raw)}")

        # 已经是 dict，直接返回
        if isinstance(raw, dict):
            return raw

        if not isinstance(raw, str):
            raise ValueError(f"Unexpected Grok response type: {type(raw)}")

        text = raw.strip()

        # 原始字符串调试输出
        try:
            logger.info("=== RAW STRING START ===")
            logger.info(text[:2000])
            if len(text) > 2000:
                logger.info("=== RAW STRING END TAIL ===")
                logger.info(text[-500:])
        except Exception:
            logger.warning("[AI_REPORT_SERVICE] Failed to log raw Grok string preview")

        # 兼容 markdown ```json ... ``` 或 ``` ... ```
        if text.startswith("```"):
            # 去掉起始 ```json / ``` 这一行
            text = re.sub(r"^```[a-zA-Z0-9]*\s*", "", text, count=1)
            # 去掉结尾 ```
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0].strip()

        # markdown 清洗后的字符串调试输出
        try:
            logger.info("=== CLEANED STRING FOR JSON PARSE ===")
            logger.info(text[:2000])
            if len(text) > 2000:
                logger.info("=== CLEANED STRING END TAIL ===")
                logger.info(text[-500:])
        except Exception:
            logger.warning("[AI_REPORT_SERVICE] Failed to log cleaned Grok string preview")

        # 1) 直接尝试整体解析
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("[AI_REPORT_SERVICE] Direct JSON parse failed, trying extraction from response text")

        # 2) 尝试从第一个 '{' 到最后一个 '}' 提取子串
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and first_brace < last_brace:
            candidate = text[first_brace : last_brace + 1]

            # 提取 JSON 片段调试输出
            try:
                logger.info("=== EXTRACTED JSON CANDIDATE ===")
                logger.info(candidate[:2000])
                if len(candidate) > 2000:
                    logger.info("=== EXTRACTED JSON CANDIDATE END TAIL ===")
                    logger.info(candidate[-500:])
            except Exception:
                logger.warning("[AI_REPORT_SERVICE] Failed to log extracted JSON candidate")

            try:
                return json.loads(candidate)
            except json.JSONDecodeError as e:
                logger.error(
                    "[AI_REPORT_SERVICE] Failed to parse extracted JSON candidate. Preview (first 1000 chars): "
                    f"{candidate[:1000]}"
                )
                logger.error("=== FINAL JSON PARSE ERROR ===")
                logger.error(repr(e))

        # 3) 仍然失败，进入 repair pass 之前，先记录原始内容预览
        try:
            logger.error(
                "[AI_REPORT_SERVICE] Unable to parse Grok JSON response via primary strategies. "
                f"Raw preview (first 1000 chars): {text[:1000]}"
            )
        except Exception:
            logger.warning("[AI_REPORT_SERVICE] Failed to log final raw preview for Grok response")

        # ========== Repair pass：调用 Grok 作为 JSON 修复工具 ==========
        repair_source = text
        try:
            repair_prompt = (
                "You are a JSON repair tool. Fix the following malformed JSON and return VALID JSON ONLY. "
                "Do not explain anything. Keep all original keys and values as much as possible.\n\n"
                f"{repair_source}"
            )
            repaired_raw = await call_grok_analysis(repair_prompt)

            if isinstance(repaired_raw, dict):
                return repaired_raw

            if not isinstance(repaired_raw, str):
                raise ValueError(f"Unexpected repair response type: {type(repaired_raw)}")

            repaired_text = repaired_raw.strip()

            # 去 markdown 包裹
            if repaired_text.startswith("```"):
                repaired_text = re.sub(r"^```[a-zA-Z0-9]*\s*", "", repaired_text, count=1)
                if repaired_text.endswith("```"):
                    repaired_text = repaired_text.rsplit("```", 1)[0].strip()

            # 先整体解析
            try:
                return json.loads(repaired_text)
            except json.JSONDecodeError:
                # 再从 { ... } 中提取
                rb_first = repaired_text.find("{")
                rb_last = repaired_text.rfind("}")
                if rb_first != -1 and rb_last != -1 and rb_first < rb_last:
                    repaired_candidate = repaired_text[rb_first : rb_last + 1]
                    return json.loads(repaired_candidate)
        except Exception:
            # 修复失败则退回原有报错逻辑
            pass

        logger.error("=== FINAL JSON PARSE ERROR ===")
        logger.error("ValueError: Failed to parse Grok JSON response")
        raise ValueError("Failed to parse Grok JSON response")

    async def generate_ai_report(
        self,
        query: str,
        reddit_result: Optional[Dict[str, Any]] = None,
        seo_result: Optional[Dict[str, Any]] = None,
        x_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        logger.error("🔥 ENTER generate_ai_report 🔥")
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
        # 调试日志：Grok 调用前
        try:
            logger.info("=== GROK CALL START ===")
            logger.info(f"Grok query: {query}")
            logger.info(f"Grok prompt (first 800 chars): {grok_prompt[:800]}")
        except Exception:
            # 日志本身不应影响主流程
            logger.warning("[AI_REPORT_SERVICE] Failed to log Grok call start details")

        try:
            grok_raw = await call_grok_analysis(grok_prompt)
            print("=== AFTER GROK CALL ===")
            print(type(grok_raw))

            # 调试日志：Grok 返回后（原始）
            try:
                logger.info("=== GROK CALL RESULT ===")
                logger.info(f"Grok raw response type: {type(grok_raw)}")
                if isinstance(grok_raw, str):
                    logger.info(f"Grok raw response preview (first 1000 chars): {grok_raw[:1000]}")
                elif isinstance(grok_raw, dict):
                    logger.info(f"Grok raw response dict keys: {list(grok_raw.keys())}")
                else:
                    logger.info(f"Grok raw response repr: {repr(grok_raw)[:1000]}")
            except Exception:
                logger.warning("[AI_REPORT_SERVICE] Failed to log Grok call result details")

            # 在 ai_report_service 内部做一次健壮的 JSON 解析
            logger.error("=== CALLING _parse_grok_response ===")
            grok_response = await self._parse_grok_response(grok_raw)

        except Exception as e:
            logger.error(f"[AI_REPORT_SERVICE] Grok analysis failed: {e}")
            try:
                logger.error("=== GROK CALL ERROR ===")
                logger.error(f"Grok exception: {repr(e)}")
            except Exception:
                logger.warning("[AI_REPORT_SERVICE] Failed to log Grok call error details")
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
