"""
统一API Layer - 负责所有外部API调用和工具管理
"""

import httpx
import asyncio
import backoff
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import os
from functools import wraps

class APILayer:
    """统一的API层，处理所有外部API调用"""

    def __init__(self):
        self.http_client = httpx.AsyncClient(
            timeout=30,
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
        )
        self.base_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'VibeMarketing/1.0'
        }

    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError, httpx.ConnectError),
        max_tries=3,
        jitter=backoff.full_jitter
    )
    async def make_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict] = None,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """统一的HTTP请求方法，包含重试和错误处理"""
        request_headers = self.base_headers.copy()
        if headers:
            request_headers.update(headers)

        response = await self.http_client.request(
            method=method,
            url=url,
            headers=request_headers,
            json=data,
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def close(self):
        """关闭HTTP客户端"""
        await self.http_client.aclose()


class XAIService:
    """X平台API服务"""

    def __init__(self, api_layer: APILayer):
        self.api_layer = api_layer
        self.api_key = os.getenv('XAI_API_KEY')

    async def search_tweets(
        self,
        keyword: str,
        limit: int = 100,
        start_time: Optional[datetime] = None
    ) -> List[Dict]:
        """搜索推文"""
        try:
            # 构建搜索URL
            search_url = f"https://api.x.ai/v1/search"

            # 构建查询参数
            params = {
                'q': keyword,
                'count': limit,
                'result_type': 'recent'
            }

            if start_time:
                params['since'] = start_time.isoformat()

            # 添加API密钥到头部
            headers = {'Authorization': f'Bearer {self.api_key}'}

            # 发送请求
            response = await self.api_layer.make_request(
                method='GET',
                url=search_url,
                headers=headers,
                params=params
            )

            # 解析响应
            tweets = []
            for item in response.get('data', []):
                tweet = {
                    'id': item.get('id'),
                    'text': item.get('text'),
                    'author': item.get('author', {}).get('username'),
                    'created_at': item.get('created_at'),
                    'public_metrics': item.get('public_metrics', {}),
                    'context_annotations': item.get('context_annotations', [])
                }
                tweets.append(tweet)

            return tweets

        except Exception as e:
            print(f"XAI API error: {str(e)}")
            return []

    async def analyze_sentiment(
        self,
        texts: List[str]
    ) -> List[Dict]:
        """批量分析情感"""
        try:
            sentiment_url = "https://api.x.ai/v1/sentiment"

            # 准备批量分析的数据
            batch_data = {
                'documents': [{'text': text} for text in texts]
            }

            headers = {'Authorization': f'Bearer {self.api_key}'}

            response = await self.api_layer.make_request(
                method='POST',
                url=sentiment_url,
                headers=headers,
                data=batch_data
            )

            # 解析情感分析结果
            results = []
            for result in response.get('results', []):
                sentiment = {
                    'label': result.get('label', 'neutral'),
                    'score': result.get('score', 0.0),
                    'confidence': result.get('confidence', 0.0)
                }
                results.append(sentiment)

            return results

        except Exception as e:
            print(f"XAI sentiment analysis error: {str(e)}")
            return [{'label': 'neutral', 'score': 0.0, 'confidence': 0.0}] * len(texts)


class RedditService:
    """Reddit API服务"""

    def __init__(self, api_layer: APILayer):
        self.api_layer = api_layer

    async def get_hot_posts(
        self,
        subreddit: str,
        limit: int = 100,
        time_filter: str = 'day'
    ) -> List[Dict]:
        """获取热门帖子"""
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json"

            params = {
                'limit': limit,
                't': time_filter
            }

            headers = {
                'User-Agent': 'VibeMarketing/1.0'
            }

            response = await self.api_layer.make_request(
                method='GET',
                url=url,
                headers=headers,
                params=params
            )

            # 解析响应
            posts = []
            for child in response.get('data', {}).get('children', []):
                post_data = child.get('data', {})
                post = {
                    'id': post_data.get('id'),
                    'title': post_data.get('title'),
                    'selftext': post_data.get('selftext', ''),
                    'author': post_data.get('author'),
                    'created_utc': post_data.get('created_utc'),
                    'score': post_data.get('score'),
                    'num_comments': post_data.get('num_comments'),
                    'url': post_data.get('url'),
                    'subreddit': post_data.get('subreddit'),
                    'permalink': f"https://reddit.com{post_data.get('permalink', '')}"
                }
                posts.append(post)

            return posts

        except Exception as e:
            print(f"Reddit API error: {str(e)}")
            return []


class SEOService:
    """SEO API服务"""

    def __init__(self, api_layer: APILayer):
        self.api_layer = api_layer

    async def analyze_keyword(
        self,
        keyword: str,
        country: str = 'us'
    ) -> Dict:
        """分析关键词"""
        try:
            # 这里可以使用SEMrush、Ahrefs等API
            # 由于API还在申请中，暂时返回模拟数据
            return {
                'keyword': keyword,
                'volume': 1000,
                'difficulty': 45,
                'cpc': 1.5,
                'trends': [
                    {'date': '2024-01-01', 'volume': 800},
                    {'date': '2024-01-02', 'volume': 1200},
                    {'date': '2024-01-03', 'volume': 1000}
                ]
            }

        except Exception as e:
            print(f"SEO API error: {str(e)}")
            return {}


class TaskManager:
    """任务管理器 - 负责协调任务执行"""

    def __init__(self):
        self.api_layer = APILayer()
        self.xai_service = XAIService(self.api_layer)
        self.reddit_service = RedditService(self.api_layer)
        self.seo_service = SEOService(self.api_layer)

    async def execute_x_analysis(
        self,
        keyword: str,
        user_email: str,
        task_id: str
    ) -> Dict:
        """执行X平台分析任务"""
        try:
            # 1. 搜索推文
            tweets = await self.xai_service.search_tweets(keyword, limit=100)

            if not tweets:
                return {
                    'status': 'failed',
                    'error': 'No tweets found',
                    'results': []
                }

            # 2. 提取文本进行情感分析
            texts = [tweet['text'] for tweet in tweets]
            sentiments = await self.xai_service.analyze_sentiment(texts)

            # 3. 汇总结果
            results = []
            positive_count = 0
            negative_count = 0
            neutral_count = 0

            for i, tweet in enumerate(tweets):
                result = {
                    'id': tweet['id'],
                    'text': tweet['text'],
                    'author': tweet['author'],
                    'created_at': tweet['created_at'],
                    'sentiment': sentiments[i],
                    'metrics': tweet['public_metrics']
                }
                results.append(result)

                # 统计情感
                label = sentiments[i]['label']
                if label == 'positive':
                    positive_count += 1
                elif label == 'negative':
                    negative_count += 1
                else:
                    neutral_count += 1

            # 4. 返回汇总结果
            return {
                'status': 'completed',
                'keyword': keyword,
                'total_mentions': len(tweets),
                'positive_count': positive_count,
                'negative_count': negative_count,
                'neutral_count': neutral_count,
                'results': results
            }

        except Exception as e:
            print(f"X analysis error: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e),
                'results': []
            }

    async def close(self):
        """关闭所有服务"""
        await self.api_layer.close()


# 创建全局任务管理器实例
task_manager = TaskManager()