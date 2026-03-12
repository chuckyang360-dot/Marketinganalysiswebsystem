"""
Base Provider Module

Abstract base class for all social media data providers.
Defines the unified interface that all providers must implement.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from ..models import Mention


class ProviderError(Exception):
    """Base exception for provider errors."""
    pass


class BaseProvider(ABC):
    """
    Abstract base class for social media data providers.

    All platform-specific providers (X, Reddit, etc.) must inherit from this class
    and implement the search_mentions method.
    """

    @abstractmethod
    async def search_mentions(
        self,
        query: str,
        limit: int = 20
    ) -> List[Mention]:
        """
        Search for mentions on the platform.

        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 20)

        Returns:
            List of Mention objects with standardized data

        Raises:
            ProviderError: If the search fails
        """
        pass

    @abstractmethod
    def get_platform_name(self) -> str:
        """Return the platform identifier (e.g., 'x', 'reddit')."""
        pass

    async def validate_query(self, query: str) -> bool:
        """
        Validate the search query before making API calls.
        Override in provider-specific implementations for custom validation.

        Args:
            query: The search query to validate

        Returns:
            True if valid, False otherwise
        """
        return bool(query and query.strip())
