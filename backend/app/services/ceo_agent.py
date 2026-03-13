"""
CEO Agent Service

This module orchestrates the GlobalPulse AI marketing analysis system.
It coordinates Reddit, SEO, Gap Analysis, and Content Idea agents into a unified workflow.

Architecture:
- CEO Agent orchestrates the full analysis pipeline
- Calls Reddit Agent for demand-side analysis
- Calls SEO Agent for supply-side analysis
- Calls Gap Analysis Agent for opportunity identification
- Calls Content Ideas Agent for actionable content suggestions
"""

from typing import List, Dict, Any
import logging
import re
from .reddit_agent import reddit_agent
from .seo_agent import seo_agent
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
    CEO Agent (MVP)

    Purpose: Orchestrate the full marketing analysis workflow.

    Responsibilities:
    - Coordinate calls to Reddit, SEO, Gap, and Content Idea agents
    - Provide unified entry point for the entire analysis pipeline
    - Return structured output with all analysis results

    Workflow:
    1. Call Reddit Agent with query
    2. Call SEO Agent with query
    3. Extract topics from both results
    4. Call Gap Analysis Agent with topics
    5. Call Content Ideas Agent with topics and opportunities
    """

    def __init__(self):
        """Initialize CEO agent with sub-agents."""
        self.reddit_agent = reddit_agent
        self.seo_agent = seo_agent

    async def _call_reddit_agent(self, query: str, limit: int = 20) -> Dict[str, Any]:
        """
        Call Reddit Agent for demand-side analysis.

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            Reddit analysis result
        """
        logger.info(f"[CEO_AGENT] Step 1: Calling Reddit Agent with query: '{query}'")
        print(f"[CEO_AGENT] Step 1: Calling Reddit Agent with query: '{query}'")

        result = await self.reddit_agent.run_analysis(
            keywords=[query],
            subreddits=None,
            limit=limit
        )

        logger.info(f"[CEO_AGENT] Step 1: Reddit Agent returned {len(result.get('mentions', []))} mentions")
        print(f"[CEO_AGENT] Step 1: Reddit Agent returned {len(result.get('mentions', []))} mentions")

        return result

    async def _call_seo_agent(self, query: str, limit: int = 20) -> Dict[str, Any]:
        """
        Call SEO Agent for supply-side analysis.

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            SEO analysis result
        """
        logger.info(f"[CEO_AGENT] Step 2: Calling SEO Agent with query: '{query}'")
        print(f"[CEO_AGENT] Step 2: Calling SEO Agent with query: '{query}'")

        result = await self.seo_agent.run_analysis(
            keywords=[query],
            site_url=None,
            limit=limit
        )

        logger.info(f"[CEO_AGENT] Step 2: SEO Agent returned {len(result.get('mentions', []))} mentions")
        print(f"[CEO_AGENT] Step 2: SEO Agent returned {len(result.get('mentions', []))} mentions")

        return result

    async def _extract_topics(self, reddit_result: Dict, seo_result: Dict) -> tuple:
        """
        Extract topics from Reddit and SEO analysis results.

        Args:
            reddit_result: Reddit agent result
            seo_result: SEO agent result

        Returns:
            Tuple of (reddit_topics, seo_topics)
        """
        reddit_topics = reddit_result.get("topics", [])
        seo_topics = seo_result.get("topics", [])

        logger.info(f"[CEO_AGENT] Step 3: Extracted Reddit topics: {reddit_topics}")
        print(f"[CEO_AGENT] Step 3: Extracted Reddit topics: {reddit_topics}")

        logger.info(f"[CEO_AGENT] Step 3: Extracted SEO topics: {seo_topics}")
        print(f"[CEO_AGENT] Step 3: Extracted SEO topics: {seo_topics}")

        return reddit_topics, seo_topics

    async def _call_gap_analysis(self, reddit_topics: List[str], seo_topics: List[str]) -> Dict[str, Any]:
        """
        Call Gap Analysis Agent to identify opportunities.

        Args:
            reddit_topics: Topics from Reddit Agent (demand side)
            seo_topics: Topics from SEO Agent (supply side)

        Returns:
            Gap analysis result with formatted opportunities
        """
        logger.info(f"[CEO_AGENT] Step 4: Calling Gap Analysis with reddit_topics and seo_topics")
        print(f"[CEO_AGENT] Step 4: Calling Gap Analysis with reddit_topics and seo_topics")

        gap_result = analyze_keyword_gap(
            reddit_topics=reddit_topics,
            seo_topics=seo_topics
        )

        # Format keywords in opportunities for display
        opportunities = gap_result.get("opportunities", [])
        formatted_opportunities = [
            {
                **opp,
                "keyword": format_display_keyword(opp.get("keyword", ""))
            }
            for opp in opportunities
        ]
        gap_result["opportunities"] = formatted_opportunities

        logger.info(f"[CEO_AGENT] Step 4: Gap Analysis returned {len(formatted_opportunities)} opportunities")
        print(f"[CEO_AGENT] Step 4: Gap Analysis returned {len(formatted_opportunities)} opportunities")

        return gap_result

    async def _call_content_ideas_agent(
        self,
        reddit_topics: List[str],
        seo_topics: List[str],
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Call Content Ideas Agent to generate content suggestions.

        Args:
            reddit_topics: Topics from Reddit Agent (demand side)
            seo_topics: Topics from SEO Agent (supply side)
            opportunities: Opportunities from Gap Analysis (formatted)

        Returns:
            List of content ideas (flattened)
        """
        logger.info(f"[CEO_AGENT] Step 5: Calling Content Ideas Agent with {len(opportunities)} opportunities")
        print(f"[CEO_AGENT] Step 5: Calling Content Ideas Agent with {len(opportunities)} opportunities")

        ideas_result = generate_content_ideas(
            reddit_topics=reddit_topics,
            seo_topics=seo_topics,
            opportunities=opportunities
        )

        # Extract content_ideas list (flatten structure)
        content_ideas = ideas_result.get("content_ideas", [])

        # Apply format_display_keyword to target_keyword in each idea
        for idea in content_ideas:
            idea["target_keyword"] = format_display_keyword(idea.get("target_keyword", ""))

        logger.info(f"[CEO_AGENT] Step 5: Content Ideas Agent returned {len(content_ideas)} ideas")
        print(f"[CEO_AGENT] Step 5: Content Ideas Agent returned {len(content_ideas)} ideas")

        return content_ideas

    async def run_full_analysis(
        self,
        query: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Run the full analysis pipeline with all agents.

        Args:
            query: Search query string
            limit: Maximum results per agent

        Returns:
            Dictionary with unified analysis structure:
            - query: Original query
            - reddit_analysis: Reddit agent result
            - seo_analysis: SEO agent result
            - gap_analysis: Gap analysis result
            - content_ideas: Content ideas result
        """
        # Log input
        logger.info(f"[CEO_AGENT] Starting full analysis pipeline with query: '{query}'")
        print(f"[CEO_AGENT] Starting full analysis pipeline with query: '{query}'")

        # Step 1: Call Reddit Agent
        reddit_result = await self._call_reddit_agent(query, limit)

        # Step 2: Call SEO Agent
        seo_result = await self._call_seo_agent(query, limit)

        # Step 3: Extract topics from both results
        reddit_topics, seo_topics = await self._extract_topics(reddit_result, seo_result)

        # Step 4: Call Gap Analysis Agent
        gap_result = await self._call_gap_analysis(reddit_topics, seo_topics)

        # Step 5: Call Content Ideas Agent
        content_ideas_result = await self._call_content_ideas_agent(
            reddit_topics=reddit_topics,
            seo_topics=seo_topics,
            opportunities=gap_result.get("opportunities", [])
        )

        # Build unified result
        result = {
            "query": query,
            "reddit_analysis": {
                "summary": reddit_result.get("summary", ""),
                "sentiment": reddit_result.get("sentiment", {"positive": 0, "negative": 0, "neutral": 0}),
                "topics": reddit_topics,
                "alerts": reddit_result.get("alerts", []),
                "mentions": reddit_result.get("mentions", [])
            },
            "seo_analysis": {
                "summary": seo_result.get("summary", ""),
                "sentiment": seo_result.get("sentiment", {"positive": 0, "negative": 0, "neutral": 0}),
                "topics": seo_topics,
                "alerts": seo_result.get("alerts", []),
                "mentions": seo_result.get("mentions", [])
            },
            "gap_analysis": gap_result,
            "content_ideas": content_ideas_result
        }

        logger.info(f"[CEO_AGENT] Full analysis complete for query: '{query}'")
        print(f"[CEO_AGENT] Full analysis complete for query: '{query}'")

        return result


# Singleton instance for easy import
ceo_agent = CEOAgent()
