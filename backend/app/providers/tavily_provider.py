"""
Tavily Provider Module

Temporary search provider for Reddit/SEO recovery.
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

import httpx

from .base import BaseProvider, Mention, ProviderError, SearchResult
from ..config import settings

logger = logging.getLogger(__name__)


class TavilyProvider(BaseProvider):
    API_PATH = "/search"
    DEFAULT_TIMEOUT = 60.0

    def __init__(self):
        self.api_key = (settings.TAVILY_API_KEY or "").strip()
        self.api_url = (settings.TAVILY_API_URL or "https://api.tavily.com").rstrip("/")

    def get_platform_name(self) -> str:
        return "tavily"

    async def search_mentions(self, query: str, limit: int = 20) -> SearchResult:
        if not await self.validate_query(query):
            return SearchResult(mentions=[], total_count=0, has_more=False)
        if not self.api_key:
            raise ProviderError("TAVILY_API_KEY is not configured")

        endpoint = f"{self.api_url}{self.API_PATH}"
        payload = {"query": query, "max_results": limit}
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        logger.info("[TAVILY_SEARCH] query=%s limit=%s", query, limit)
        print(f"[TAVILY_SEARCH] query={query} limit={limit}")

        try:
            async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT, trust_env=False) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                logger.info("[TAVILY_RESPONSE_STATUS] %s", response.status_code)
                print(f"[TAVILY_RESPONSE_STATUS] {response.status_code}")

                if response.status_code != 200:
                    raise ProviderError(f"Tavily API returned {response.status_code}: {response.text}")

                data = response.json()
                results = data.get("results", []) if isinstance(data, dict) else []
                logger.info("[TAVILY_RESPONSE_SAMPLE] %s", results[:3])
                print(f"[TAVILY_RESPONSE_SAMPLE] {results[:3]}")

                mentions = []
                for idx, item in enumerate(results):
                    mention = self._map_result_to_mention(item, idx)
                    if mention:
                        mentions.append(mention)

                return SearchResult(
                    mentions=mentions,
                    total_count=len(mentions),
                    has_more=len(mentions) >= limit,
                )
        except httpx.TimeoutException:
            raise ProviderError("Tavily request timed out")
        except httpx.RequestError as e:
            raise ProviderError(f"Tavily network error: {e}")

    def _map_result_to_mention(self, item: Dict[str, Any], idx: int) -> Optional[Mention]:
        url = item.get("url", "") or ""
        title = item.get("title", "") or ""
        content = item.get("content", "") or ""
        text = (content or title).strip()
        if not text:
            return None

        published = item.get("published_date") or item.get("publishedDate") or item.get("date")
        timestamp = None
        if published:
            try:
                timestamp = datetime.fromisoformat(str(published).replace("Z", "+00:00"))
            except Exception:
                timestamp = None

        platform = "reddit" if "reddit.com" in url.lower() else "web"
        mention_id = item.get("id") or url or f"tavily-{idx}"

        return Mention(
            id=str(mention_id),
            platform=platform,
            author=item.get("author", "") or "",
            author_username=item.get("author", "") or "",
            author_display_name=item.get("author", "") or "",
            text=text,
            url=url,
            timestamp=timestamp or datetime.utcnow(),
            likes=0,
            comments=0,
            shares=0,
            followers=0,
            sentiment="neutral",
            sentiment_score=0.0,
            influencer_tier="unknown",
            platform_metadata={
                "tavily_result": item,
                "title": title,
                "publishedDate": published,
                "score": item.get("score"),
                "source_provider": "tavily",
            },
            raw=item,
        )


tavily_provider = TavilyProvider()
"""
Tavily Provider Module

Minimal web search provider for Reddit/SEO recovery path.
"""

from datetime import datetime
from typing import Any, Dict, Optional
import logging

import httpx

from .base import BaseProvider, Mention, ProviderError, SearchResult
from ..config import settings

logger = logging.getLogger(__name__)


class TavilyProvider(BaseProvider):
    """Provider for Tavily Search API."""

    DEFAULT_TIMEOUT = 60.0

    def __init__(self):
        if not settings.TAVILY_API_KEY:
            raise ValueError(
                "TAVILY_API_KEY environment variable is required. "
                "Please set it in your .env file."
            )

        self.api_key = settings.TAVILY_API_KEY
        self.api_url = f"{settings.TAVILY_API_URL.rstrip('/')}/search"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def get_platform_name(self) -> str:
        return "tavily"

    async def search_mentions(self, query: str, limit: int = 20) -> SearchResult:
        print(f"[TAVILY_SEARCH] query={query} limit={limit}")
        logger.info(f"[TAVILY_SEARCH] query={query} limit={limit}")

        if not await self.validate_query(query):
            return SearchResult(mentions=[], total_count=0, has_more=False)

        payload = {
            "query": query,
            "max_results": limit,
        }

        try:
            async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT, trust_env=False) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                )

            print(f"[TAVILY_RESPONSE_STATUS] {response.status_code}")
            logger.info(f"[TAVILY_RESPONSE_STATUS] {response.status_code}")

            if response.status_code != 200:
                raise ProviderError(
                    f"Tavily API returned status {response.status_code}: {response.text}"
                )

            data = response.json()
            results = data.get("results", []) or []
            sample = results[:3]
            print(f"[TAVILY_RESPONSE_SAMPLE] {sample}")
            logger.info(f"[TAVILY_RESPONSE_SAMPLE] {sample}")

            mentions = []
            for result in results[:limit]:
                mention = self._map_result_to_mention(result)
                if mention:
                    mentions.append(mention)

            return SearchResult(
                mentions=mentions,
                total_count=len(mentions),
                has_more=len(results) > len(mentions),
            )

        except httpx.TimeoutException as e:
            raise ProviderError(f"Tavily API request timed out: {e}") from e
        except httpx.RequestError as e:
            raise ProviderError(f"Network error connecting to Tavily API: {e}") from e
        except ValueError as e:
            raise ProviderError(f"Invalid Tavily response format: {e}") from e

    def _detect_platform(self, url: str) -> str:
        lower_url = (url or "").lower()
        if "reddit.com" in lower_url:
            return "reddit"
        return "web"

    def _map_result_to_mention(self, result: Dict[str, Any]) -> Optional[Mention]:
        url = result.get("url", "") or ""
        title = result.get("title", "") or ""
        content = result.get("content", "") or ""
        text = content or title

        if not (url or text):
            return None

        raw_time = result.get("published_date")
        timestamp = None
        if raw_time:
            try:
                timestamp = datetime.fromisoformat(str(raw_time).replace("Z", "+00:00"))
            except Exception:
                timestamp = None
        if not timestamp:
            timestamp = datetime.utcnow()

        mention_id = url or str(hash(f"{title}-{text[:100]}"))

        return Mention(
            id=mention_id,
            platform=self._detect_platform(url),
            author="",
            author_username="",
            author_display_name="",
            text=text,
            url=url,
            timestamp=timestamp,
            likes=0,
            comments=0,
            shares=0,
            followers=0,
            sentiment="neutral",
            sentiment_score=0.0,
            influencer_tier="unknown",
            platform_metadata={
                "title": title,
                "score": result.get("score"),
                "source_provider": "tavily",
            },
            raw=result,
        )


tavily_provider = TavilyProvider()
"""
Tavily Provider Module

Temporary search provider for Reddit/SEO recovery.
"""

import httpx
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from .base import BaseProvider, Mention, ProviderError, SearchResult
from ..config import settings

logger = logging.getLogger(__name__)


class TavilyProvider(BaseProvider):
    API_PATH = "/search"
    DEFAULT_TIMEOUT = 60.0

    def __init__(self):
        self.api_key = (settings.TAVILY_API_KEY or "").strip()
        self.api_url = (settings.TAVILY_API_URL or "https://api.tavily.com").rstrip("/")

    def get_platform_name(self) -> str:
        return "tavily"

    async def search_mentions(self, query: str, limit: int = 20) -> SearchResult:
        if not await self.validate_query(query):
            return SearchResult(mentions=[], total_count=0, has_more=False)
        if not self.api_key:
            raise ProviderError("TAVILY_API_KEY is not configured")

        endpoint = f"{self.api_url}{self.API_PATH}"
        payload = {"query": query, "max_results": limit}
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        logger.info("[TAVILY_SEARCH] query=%s limit=%s", query, limit)
        print(f"[TAVILY_SEARCH] query={query} limit={limit}")

        try:
            async with httpx.AsyncClient(timeout=self.DEFAULT_TIMEOUT, trust_env=False) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                logger.info("[TAVILY_RESPONSE_STATUS] %s", response.status_code)
                print(f"[TAVILY_RESPONSE_STATUS] {response.status_code}")

                if response.status_code != 200:
                    raise ProviderError(f"Tavily API returned {response.status_code}: {response.text}")

                data = response.json()
                results = data.get("results", []) if isinstance(data, dict) else []
                logger.info("[TAVILY_RESPONSE_SAMPLE] %s", results[:3])
                print(f"[TAVILY_RESPONSE_SAMPLE] {results[:3]}")

                mentions = []
                for idx, item in enumerate(results):
                    mention = self._map_result_to_mention(item, idx)
                    if mention:
                        mentions.append(mention)

                return SearchResult(
                    mentions=mentions,
                    total_count=len(mentions),
                    has_more=len(mentions) >= limit,
                )
        except httpx.TimeoutException:
            raise ProviderError("Tavily request timed out")
        except httpx.RequestError as e:
            raise ProviderError(f"Tavily network error: {e}")

    def _map_result_to_mention(self, item: Dict[str, Any], idx: int) -> Optional[Mention]:
        url = item.get("url", "") or ""
        title = item.get("title", "") or ""
        content = item.get("content", "") or ""
        text = (content or title).strip()
        if not text:
            return None

        published = (
            item.get("published_date")
            or item.get("publishedDate")
            or item.get("date")
        )
        timestamp = None
        if published:
            try:
                timestamp = datetime.fromisoformat(str(published).replace("Z", "+00:00"))
            except Exception:
                timestamp = None

        platform = "reddit" if "reddit.com" in url.lower() else "seo"
        mention_id = item.get("id") or url or f"tavily-{idx}"

        return Mention(
            id=str(mention_id),
            platform=platform,
            author=item.get("author", "") or "",
            author_username=item.get("author", "") or "",
            author_display_name=item.get("author", "") or "",
            text=text,
            url=url,
            timestamp=timestamp,
            likes=0,
            comments=0,
            shares=0,
            followers=0,
            sentiment="neutral",
            sentiment_score=0.0,
            influencer_tier="unknown",
            platform_metadata={
                "tavily_result": item,
                "title": title,
                "publishedDate": published,
                "score": item.get("score"),
            },
            raw=item,
        )


tavily_provider = TavilyProvider()
