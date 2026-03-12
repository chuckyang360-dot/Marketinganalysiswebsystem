from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import httpx
from ...database import get_db
from ...models.x_analysis import XTask, XSearchResult
from ...auth.jwt_handler import get_current_user
from ...models import User
from ...config import settings
from ...services.xai_search import xai_search_service
from ...providers.x_provider import x_provider, XAPIError
import asyncio
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class XAnalysisRequest(BaseModel):
    brand: str
    competitors: List[str] = []
    hashtags: List[str] = []


async def run_xai_analysis(
    brand: str,
    competitors_list: List[str],
    hashtags_list: List[str]
) -> Dict[str, Any]:
    """
    Run real X analysis using X API for data and xAI for sentiment

    Returns:
        Dictionary with mentions, stats, sentimentTrend, influencers, alerts
    """
    logger.info(f"[PROVIDER] Using X API for analysis of: {brand}")

    try:
        # 1. Fetch real tweets from X API
        try:
            mentions = await x_provider.search_mentions(brand, limit=20)
            logger.info(f"[XProvider] Retrieved {len(mentions)} mentions from X API")
        except XAPIError as e:
            logger.error(f"[XProvider] Failed to fetch tweets: {e.message}")
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
                "alerts": [f"X API 获取失败: {e.message}"],
                "hashtags": hashtags_list,
                "competitors": competitors_list,
                "summary": f"X API 获取失败，无法分析 {brand} 的相关讨论",
                "topics": []
            }

        if not mentions:
            logger.warning(f"[XProvider] No tweets found for keyword: {brand}")
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
                "alerts": [f"未找到关于 {brand} 的相关推文"],
                "hashtags": hashtags_list,
                "competitors": competitors_list,
                "summary": f"未找到关于 {brand} 的相关推文",
                "topics": []
            }


        # 3. AI Analysis: Extract tweet texts and analyze with LLM
        tweet_texts = [m.text for m in mentions]
        logger.info(f"[AI Analysis] Starting AI analysis for {len(tweet_texts)} tweets")

        # 构建 tweets 摘要文本
        tweets_summary = "\n".join([f"- {text}" for text in tweet_texts[:20]])  # 最多分析前20条

        # 调用 xAI 进行综合分析
        ai_analysis = None
        try:
            prompt = f"""你是一位资深跨境营销分析师。基于以下关于 "{brand}" 的 X/Twitter 推文，提供营销洞察分析。

推文内容：
{tweets_summary}

请以 JSON 格式返回分析结果，包含以下字段：
{{
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "营销洞察总结（不超过150字）：1）用户主要讨论的核心内容 2）主要负面反馈点 3）主要正面认可点 4）对品牌营销、内容选题或产品传播的启发",
  "top_topics": ["可用于内容策划的话题标签1", "可用于营销复盘的讨论主题2", "垂直细分话题3"],
  "alerts": ["需要立即关注的风险1", "品牌公关建议2"]
}}

分析要求：
- summary 必须具体、有洞察价值，避免空泛总结
- top_topics 不要只是重复品牌名，要提取可操作的细分话题（如产品功能、用户体验、价格敏感度、竞品对比等）
- alerts 针对负面内容和潜在风险提出具体的公关或营销建议
- 只返回 JSON，不要有其他文字
- sentiment 根据正面和负面推文的比例判断
"""

            # 使用 xai_search_service 的内部方法调用 chat API
            async with httpx.AsyncClient(timeout=60.0) as client:
                chat_url = f"{settings.XAI_API_URL}/chat/completions"
                headers = {
                    "Authorization": f"Bearer {settings.XAI_API_KEY}",
                    "Content-Type": "application/json"
                }

                response = await client.post(
                    chat_url,
                    headers=headers,
                    json={
                        "messages": [
                            {"role": "system", "content": "You are a social media sentiment analyzer. Return only valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "model": settings.XAI_MODEL,
                        "stream": False
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                    try:
                        ai_analysis = json.loads(content)
                        logger.info(f"[AI Analysis] AI analysis completed: {ai_analysis}")
                    except json.JSONDecodeError:
                        logger.warning(f"[AI Analysis] Failed to parse AI response as JSON: {content}")
        except Exception as e:
            logger.warning(f"[AI Analysis] AI analysis failed: {str(e)}, using fallback")

        # AI 分析失败时的默认值
        if not ai_analysis:
            ai_analysis = {
                "sentiment": "neutral",
                "summary": f"关于 {brand} 的相关讨论",
                "top_topics": [f"{brand} 相关讨论"],
                "alerts": []
            }

        # 2. Extract texts for sentiment analysis
        texts = [m.text for m in mentions]

        # 3. Batch sentiment analysis
        sentiments = await xai_search_service.analyze_sentiment_batch(texts)

        logger.info(f"[XAISearch] Completed sentiment analysis for {len(sentiments)} tweets")

        # 4. Process results
        processed_mentions = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        influencer_map = {}

        for i, mention in enumerate(mentions):
            sentiment_data = sentiments[i] if i < len(sentiments) else {'label': 'neutral', 'score': 0.0}
            label = sentiment_data.get('label', 'neutral')
            score = sentiment_data.get('score', 0.0)

            # Count sentiments
            if label == 'positive':
                positive_count += 1
            elif label == 'negative':
                negative_count += 1
            else:
                neutral_count += 1

            # Get engagement from Mention object
            engagement = mention.engagement_total

            # Build mention dict for output (compatibility with existing format)
            processed_mention = {
                'tweet_id': mention.id,
                'text': mention.text,
                'author': mention.author_username or mention.author,
                'author_display': mention.author_display_name or mention.author,
                'sentiment_score': int(score * 100),
                'sentiment_label': label,
                'engagement': engagement,
                'created_at': mention.timestamp.isoformat() if mention.timestamp else '',
                'hashtags': [],  # TODO: Extract from platform_metadata if needed
                'mentions': []   # TODO: Extract from platform_metadata if needed
            }

            # Track influencers (mentions with high engagement)
            if engagement > 10:
                author = mention.author_username or mention.author
                if author not in influencer_map:
                    influencer_map[author] = {
                        'name': f"@{author}",
                        'followers': mention.followers,
                        'influence': '高' if mention.followers > 100000 else
                                   '中' if mention.followers > 10000 else '低'
                    }
                else:
                    # Update with max followers
                    influencer_map[author]['followers'] = max(
                        influencer_map[author]['followers'],
                        mention.followers
                    )

            processed_mentions.append(processed_mention)

        # 5. Build sentiment trend based on real tweets' created_at and sentiment_label
        sentimentTrend = []
        date_sentiment_map = {}

        # 按日期聚合情感数据
        for mention in processed_mentions:
            created_at = mention.get('created_at', '')
            sentiment_label = mention.get('sentiment_label', 'neutral')

            # 解析日期：X API 返回 ISO 8601 格式，如 "2024-03-11T10:30:00.000Z"
            # 提取 MM-DD 格式用于显示
            try:
                from datetime import datetime as dt
                parsed_date = dt.fromisoformat(created_at.replace('Z', '+00:00'))
                date_key = f"{parsed_date.month}-{parsed_date.day:02d}"  # 格式如 "3-11"
            except (ValueError, AttributeError):
                # 如果日期解析失败，使用当前日期
                from datetime import datetime as dt
                date_key = f"{dt.now().month}-{dt.now().day:02d}"

            # 初始化日期的统计
            if date_key not in date_sentiment_map:
                date_sentiment_map[date_key] = {
                    "positive": 0,
                    "negative": 0,
                    "neutral": 0
                }

            # 累加情感计数
            date_sentiment_map[date_key][sentiment_label] += 1

        # 按日期排序并转换为前端需要的格式
        sorted_dates = sorted(date_sentiment_map.keys(), key=lambda x: tuple(map(int, x.split('-'))))
        for date_key in sorted_dates:
            sentimentTrend.append({
                "date": date_key,
                "positive": date_sentiment_map[date_key]["positive"],
                "negative": date_sentiment_map[date_key]["negative"]
            })

        # 6. Build influencers list (top by engagement)
        influencers = sorted(
            list(influencer_map.values()),
            key=lambda x: x['followers'],
            reverse=True
        )[:5]

        # 7. Build alerts - combine AI alerts with rule-based alerts
        alerts = ai_analysis.get("alerts", [])
        if negative_count > 0:
            alerts.append(f"检测到 {negative_count} 条负面提及，建议关注用户反馈")
        if negative_count / (positive_count + 1) > 0.3:
            alerts.append(f"{brand} 负面情绪占比偏高，建议加强品牌公关")
        if len(processed_mentions) > 50:
            alerts.append(f"{brand} 相关讨论量近期较高，有成为热点趋势的潜力")

        result = {
            "mentions": processed_mentions,
            "stats": {
                "total_mentions": len(processed_mentions),
                "positive_count": positive_count,
                "negative_count": negative_count,
                "neutral_count": neutral_count
            },
            "sentimentTrend": sentimentTrend,
            "influencers": influencers,
            "alerts": alerts,
            "hashtags": [],
            "competitors": competitors_list,
            # AI 分析结果
            "summary": ai_analysis.get("summary", f"关于 {brand} 的相关讨论"),
            "topics": ai_analysis.get("top_topics", [])
        }

        logger.info(f"[XAISearch] Analysis complete: {len(processed_mentions)} mentions, "
                   f"{positive_count}+ / {negative_count}- / {neutral_count}n")
        return result

    except Exception as e:
        logger.error(f"[XAISearch] Error during analysis: {str(e)}", exc_info=True)
        # Return minimal data on error
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
            "alerts": [f"分析失败: {str(e)}"],
            "hashtags": hashtags_list,
            "competitors": competitors_list,
            "summary": f"分析 {brand} 时发生错误: {str(e)}",
            "topics": []
        }


async def run_mock_analysis(
    brand: str,
    competitors_list: List[str],
    hashtags_list: List[str]
) -> Dict[str, Any]:
    """
    Run mock X analysis (fallback)

    Returns:
        Dictionary with mentions, stats, sentimentTrend, influencers, alerts
    """
    logger.info(f"[PROVIDER] Using mock provider for analysis of: {brand}")

    # Mock sentiment trend data
    sentimentTrend = [
        {"date": "3-1", "positive": 35, "negative": 15},
        {"date": "3-2", "positive": 42, "negative": 18},
        {"date": "3-3", "positive": 38, "negative": 12},
        {"date": "3-4", "positive": 45, "negative": 20},
        {"date": "3-5", "positive": 50, "negative": 15},
        {"date": "3-6", "positive": 48, "negative": 22},
        {"date": "3-7", "positive": 55, "negative": 18},
    ]

    influencers = [
        {"name": "@tech_influencer", "followers": 125000, "influence": "高"},
        {"name": "@industry_expert", "followers": 89000, "influence": "中"},
        {"name": "@market_observer", "followers": 67000, "influence": "中"},
    ]

    alerts = [
        "检测到3条负面提及，建议及时关注用户反馈",
        f"{brand}相关讨论量近期呈上升趋势"
    ]

    # Mock mentions
    mock_mentions = [
        {
            "tweet_id": "1",
            "text": f"{brand} 的产品体验真的很棒，强烈推荐！",
            "author": "user1",
            "sentiment_score": 80,
            "sentiment_label": "positive",
            "engagement": 15
        },
        {
            "tweet_id": "2",
            "text": f"今天试用了{brand}，整体不错，但还有改进空间",
            "author": "user2",
            "sentiment_score": 40,
            "sentiment_label": "positive",
            "engagement": 12
        },
        {
            "tweet_id": "3",
            "text": f"为什么{brand}的服务这么慢？体验很差",
            "author": "user3",
            "sentiment_score": -60,
            "sentiment_label": "negative",
            "engagement": 8
        },
        {
            "tweet_id": "4",
            "text": f"{brand} 新功能上线了，大家快去试试",
            "author": "user4",
            "sentiment_score": 70,
            "sentiment_label": "positive",
            "engagement": 20
        },
        {
            "tweet_id": "5",
            "text": f"对{brand}的新功能不太满意",
            "author": "user5",
            "sentiment_score": -30,
            "sentiment_label": "negative",
            "engagement": 5
        }
    ]

    return {
        "mentions": mock_mentions,
        "stats": {
            "total_mentions": 5,
            "positive_count": 3,
            "negative_count": 2,
            "neutral_count": 0
        },
        "sentimentTrend": sentimentTrend,
        "influencers": influencers,
        "alerts": alerts,
        "hashtags": hashtags_list,
        "competitors": competitors_list
    }


@router.post("")
async def analyze_twitter(
    request: XAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """X平台舆情分析"""
    try:
        # 解析竞品和标签（兼容数组和空值）
        competitors_list = [c.strip() for c in request.competitors if c.strip()] if request.competitors else []
        hashtags_list = [h.strip() for h in request.hashtags if h.strip()] if request.hashtags else []

        provider = settings.X_ANALYSIS_PROVIDER.lower()
        logger.info(f"X Analysis Request - Provider: {provider}, Brand: {request.brand}, User: {current_user.email}")

        # 只支持 xai 提供者（真实 X API + xAI 分析）
        if provider != "xai":
            raise HTTPException(
                status_code=400,
                detail=f"不支持的 provider 配置: '{settings.X_ANALYSIS_PROVIDER}'。请将 X_ANALYSIS_PROVIDER 设置为 'xai' 以使用真实 X API 数据。"
            )

        # 使用真实 X API + xAI 分析
        result = await run_xai_analysis(request.brand, competitors_list, hashtags_list)

        # 构建原始数据用于历史记录
        raw_data = {
            "competitors": competitors_list,
            "hashtags": hashtags_list,
            "sentimentTrend": result.get("sentimentTrend", []),
            "influencers": result.get("influencers", []),
            "alerts": result.get("alerts", []),
            "summary": result.get("summary", ""),
            "topics": result.get("topics", []),
            "provider": provider
        }

        # 创建分析任务记录
        task = XTask(
            user_email=current_user.email,
            keyword=request.brand,
            status="completed",
            total_mentions=result["stats"]["total_mentions"],
            positive_count=result["stats"]["positive_count"],
            negative_count=result["stats"]["negative_count"],
            neutral_count=result["stats"]["neutral_count"],
            completed_at=datetime.utcnow(),
            analysis_summary=f"分析完成：总计{result['stats']['total_mentions']}条提及，"
                          f"正面{result['stats']['positive_count']}条，"
                          f"负面{result['stats']['negative_count']}条，"
                          f"中性{result['stats']['neutral_count']}条",
            raw_data=raw_data
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        # 保存搜索结果到数据库
        mentions = result.get("mentions", [])
        for mention in mentions:
            search_result = XSearchResult(
                task_id=task.id,
                tweet_id=mention.get("tweet_id", ""),
                text=mention.get("text", ""),
                author=mention.get("author", ""),
                sentiment_score=mention.get("sentiment_score", 0),
                sentiment_label=mention.get("sentiment_label", "neutral"),
                extra_data={
                    "engagement": mention.get("engagement", 0),
                    "hashtags": mention.get("hashtags", []),
                    "mentions": mention.get("mentions", [])
                }
            )
            db.add(search_result)
        db.commit()

        # 返回完整分析结果
        return {
            "task_id": task.id,
            "keyword": task.keyword,
            "status": task.status,
            "analysis_summary": task.analysis_summary,
            "mentions": [
                {
                    "text": m["text"],
                    "author": m["author"],
                    "engagement": m.get("engagement", 0),
                    "sentiment": "积极" if m["sentiment_label"] == "positive" else
                                "消极" if m["sentiment_label"] == "negative" else "中性"
                }
                for m in mentions
            ],
            "sentimentTrend": result.get("sentimentTrend", []),
            "influencers": result.get("influencers", []),
            "alerts": result.get("alerts", []),
            "summary": result.get("summary", ""),
            "topics": result.get("topics", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"X analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """获取分析历史"""
    try:
        tasks = db.query(XTask).filter(
            XTask.user_email == current_user.email
        ).order_by(XTask.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "tasks": [
                {
                    "id": task.id,
                    "keyword": task.keyword,
                    "status": task.status,
                    "created_at": task.created_at,
                    "completed_at": task.completed_at,
                    "progress": {
                        "total_mentions": task.total_mentions,
                        "positive_count": task.positive_count,
                        "negative_count": task.negative_count,
                        "neutral_count": task.neutral_count
                    }
                }
                for task in tasks
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{task_id}")
async def get_task_details(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取任务详情"""
    try:
        # 获取任务
        task = db.query(XTask).filter(
            XTask.id == task_id,
            XTask.user_email == current_user.email
        ).first()

        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")

        # 获取搜索结果（提及）
        search_results = db.query(XSearchResult).filter(
            XSearchResult.task_id == task_id
        ).all()

        # 解析 raw_data 获取额外信息
        raw_data = task.raw_data or {}
        competitors = raw_data.get("competitors", [])
        hashtags = raw_data.get("hashtags", [])
        alerts = raw_data.get("alerts", [])
        summary = raw_data.get("summary", "")
        topics = raw_data.get("topics", [])

        # 检查使用的是哪个provider
        provider = raw_data.get("provider", "mock")
        logger.info(f"Fetching task {task_id} details, provider: {provider}")

        return {
            "task_id": task.id,
            "keyword": task.keyword,
            "status": task.status,
            "created_at": task.created_at,
            "completed_at": task.completed_at,
            "analysis_summary": task.analysis_summary,
            "stats": {
                "total_mentions": task.total_mentions,
                "positive_count": task.positive_count,
                "negative_count": task.negative_count,
                "neutral_count": task.neutral_count
            },
            "mentions": [
                {
                    "text": result.text,
                    "author": result.author,
                    "engagement": result.extra_data.get("engagement", 0) if result.extra_data else 0,
                    "sentiment": "积极" if result.sentiment_label == "positive" else
                                "消极" if result.sentiment_label == "negative" else "中性"
                }
                for result in search_results
            ],
            "sentimentTrend": raw_data.get("sentimentTrend", []),
            "influencers": raw_data.get("influencers", []),
            "alerts": alerts,
            "competitors": competitors,
            "hashtags": hashtags,
            "summary": summary,
            "topics": topics
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
