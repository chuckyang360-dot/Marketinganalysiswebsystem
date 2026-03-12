"""
SEO Adapter Module

This module converts SEO data to unified Mention format.
It does NOT inherit from BaseProvider - it's a pure adapter that receives a provider via dependency injection.

Architecture:
- Provider Layer: Data fetching (ExaProvider)
- Adapter Layer: Data normalization
- Services Layer: Business logic coordination
"""

from typing import List, Optional
from datetime import datetime
from ..providers.base import Mention
from ..config import settings


class SEOAdapter:
    """
    Adapter for SEO platform.

    Responsibilities:
    - Normalize SEO data to unified Mention format
    - Receive provider via dependency injection (not inheritance)
    """

    def __init__(self, provider):
        """Initialize SEO adapter with injected provider."""
        self.provider = provider

    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> List[Mention]:
        """
        Search for mentions using provider and normalize to Mention format.

        Args:
            query: Search query string
            limit: Maximum number of results to return

        Returns:
            List of Mention objects
        """
        # Use provider to search raw data
        search_result = await self.provider.search_mentions(query, limit)

        # Provider already returns List[Mention], just return as-is
        return search_result.mentions[:limit]


# Factory function for dependency injection
def create_seo_adapter(provider) -> SEOAdapter:
    """
    Factory function to create SEOAdapter with provider.
    This decouples the adapter from the provider implementation.
    """
    return SEOAdapter(provider)
