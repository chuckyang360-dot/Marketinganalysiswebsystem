"""
Keyword Gap Analysis Module

Compares Reddit Agent (demand side) and SEO Agent (supply side) topics
to identify keyword opportunities where demand > supply.

Purpose: Find content opportunities by analyzing the gap between
what users are discussing (Reddit) and what content exists (SEO).
"""

from typing import List, Dict, Any
from collections import Counter
from pydantic import BaseModel
import re


class KeywordOpportunity(BaseModel):
    """Single keyword opportunity."""
    keyword: str
    demand: int
    supply: int
    gap_score: float


class GapAnalysisResult(BaseModel):
    """Result of gap analysis."""
    opportunities: List[KeywordOpportunity]
    reddit_topics: List[str]
    seo_topics: List[str]


def normalize_topic(topic: str) -> str:
    """
    Normalize topic string for matching.

    - Convert to lowercase
    - Strip leading/trailing whitespace
    - Merge multiple spaces into one
    - Remove common punctuation
    - Preserve word/phrase semantics

    Args:
        topic: Raw topic string

    Returns:
        Normalized topic string

    Examples:
        "Shopify SEO" -> "shopify seo"
        "Shopify Seo" -> "shopify seo"
        " Cursor IDE " -> "cursor ide"
        "Copilot Alternative!" -> "copilot alternative"
    """
    if not topic:
        return ""

    # Strip leading/trailing whitespace
    normalized = topic.strip()

    # Convert to lowercase
    normalized = normalized.lower()

    # Remove common punctuation (preserve spaces and hyphens in words)
    # Remove: !, ?, ., ,, ", ', (, ), [, ], {, }, :, ;, *, /, +, =, <, >, |
    normalized = re.sub(r'[!?,.\'"()\[\]{}:;/*+=<>|]', '', normalized)

    # Replace multiple spaces with single space
    normalized = re.sub(r'\s+', ' ', normalized)

    # Strip again (in case punctuation left leading/trailing spaces)
    normalized = normalized.strip()

    return normalized


def analyze_keyword_gap(
    reddit_topics: List[str],
    seo_topics: List[str]
) -> Dict[str, Any]:
    """
    Analyze keyword gap between Reddit (demand) and SEO (supply).

    Args:
        reddit_topics: List of topics from Reddit Agent (demand side)
        seo_topics: List of topics from SEO Agent (supply side)

    Returns:
        Dictionary with opportunities list, sorted by gap_score
    """
    # Normalize reddit_topics
    normalized_reddit_topics = [normalize_topic(t) for t in reddit_topics if t]

    # Normalize seo_topics
    normalized_seo_topics = [normalize_topic(t) for t in seo_topics if t]

    # Count demand from normalized reddit_topics
    demand_counts = Counter(normalized_reddit_topics)

    # Count supply from normalized seo_topics
    supply_counts = Counter(normalized_seo_topics)

    # Get all unique keywords
    all_keywords = set(normalized_reddit_topics) | set(normalized_seo_topics)

    # Calculate gap scores
    opportunities = []

    # Define junk words to filter out from opportunities
    junk_words = {
        'cover art', 'name description', 'description condition', 'condition notes',
        'top posts', 'sold cib', 'our tiktok', 'if you\'re', 'shop seller',
        'sold_cib', 'name_description', 'description_condition', 'condition_notes',
        'cib acceptable', 'games name', 'name description condition', 'description condition notes',
        'games name', 'cib_acceptable', 'name_description_condition', 'description_condition_notes',
        'greatest hits', 'misc games', 'included name', 'greatest', 'hits', 'misc',
        'included', 'name', 'description', 'condition', 'notes', 'games', 'acceptable', 'art',
        'super mario', 'mario kart', 'mario world', 'mario bros', 'mario party', 'mario golf',
        'dave mirra', 'mirra freestyle', 'xiaomi 15', 'xiaomi 17', 'poco x7', 'su7 ultra',
        'super_mario', 'dave_mirra', 'mirra_freestyle', 'xiaomi_15', 'xiaomi_17', 'poco_x7', 'su7_ultra',
        'club nintendo', 'nintendo insert', 'mi tv', 'galaxy watch', 'smoke damage',
        'club_nintendo', 'nintendo_insert', 'mi_tv', 'galaxy_watch', 'smoke_damage',
        'poor smoke', 'freestyle bmx', 'nba live', 'players choice', 'x7 pro', 'tv box',
        'poor_smoke', 'freestyle_bmx', 'nba_live', 'players_choice', 'x7_pro', 'tv_box',
        'players choice', 'my shop', 'shop live', 'shop-level free', 'my_tiktok',
        'players_choice', 'my_shop', 'shop_live', 'shop_level_free',
        # New junk patterns
        'join our', 'join our discord', 'discord server', 'our discord', 'our $100k',
        'join_our', 'discord_server', 'our_discord', 'our_100k', 'our_$100k',
        'shop level', 'shop level free', 'my shop', 'my tiktok', 'your shop',
        'shop_level', 'shop_level_free', 'my_shop', 'my_tiktok', 'your_shop',
        "player's choice", 'players choice', 'top posts',
        'players_choice', "player's_choice", 'top_posts',
        # Additional junk patterns
        'month tiktok', 'shop growth', 'growth system', 'average speed',
        'month_tiktok', 'shop_growth', 'growth_system', 'average_speed',
        'redmi note', 'galaxy watch', 'su7 ultra', 'su7 xiaomi',
        'redmi_note', 'galaxy_watch', 'su7_ultra',
        'sell my', 'sell_my',
        'system we', 'system_we', 'shop_growth', 'growth_system',
        'chinese xiaomi', 'chinese_xiaomi',
        'ev marketplace', 'ev_marketplace', 'lease deals', 'lease_deals',
        'car china.com', 'car_china.com', 'car_china',
        'promoted developers', 'promoted_developers',
        'pro note', 'pro_note', 'my car', 'my_car',
        'discuss tts', 'discuss_tts', 'star wars', 'star_wars',
        'noalvin 1d', 'noalvin_1d', 'codex', 'developers codex',
        'developers_codex', 'sd card', 'sd_card',
        'micro sd', 'micro_sd', 'poor case', 'poor_case',
        'star wars', 'star_wars',
    }

    for keyword in all_keywords:
        demand = demand_counts.get(keyword, 0)
        supply = supply_counts.get(keyword, 0)

        # Only include keywords with demand > 0 (meaningful opportunities)
        if demand == 0:
            continue

        # Skip junk words (NEW) - check both with and without underscores
        keyword_lower = keyword.lower().replace('_', ' ')
        if keyword_lower in junk_words:
            continue

        # Skip patterns that look like sentence fragments (e.g., "system we", "growth system")
        # These are typically fragments from longer sentences
        fragment_words = {'system', 'growth', 'month', 'shop', 'average', 'speed', 'we', 'the', 'and', 'for', 'with'}
        words = keyword_lower.split()
        if len(words) >= 2 and words[-1] in fragment_words:
            continue
        if len(words) >= 2 and words[0] in fragment_words:
            continue

        # Skip patterns with apostrophe fragments (e.g., "player's choice" when it's "player's")
        if re.search(r"\w+'\s+[a-z]", keyword_lower):
            continue
        if keyword_lower.endswith("'s"):
            continue

        # Skip generic time/month phrases
        if re.match(r'^(month|average|daily|weekly|monthly|yearly)\s+\w+', keyword_lower):
            continue

        # Skip username-like patterns (numbers + mixed case)
        if re.search(r'\d+.*[a-z].*\d+', keyword_lower):
            # Only skip if it looks like a username (short and contains numbers)
            words = keyword_lower.split()
            if len(words) <= 2 and any(re.search(r'\d+', w) for w in words):
                continue

        # Skip repeated patterns (e.g., "su7 xiaomi su7")
        words = keyword_lower.split()
        if len(words) >= 3 and len(set(words)) < len(words):
            continue

        # Skip username-like patterns (e.g., "chapulintacos13 3mo")
        # Check for mixed case + numbers that look like usernames
        if len(words) == 2:
            # First word has number, second word is short abbreviation (likely month)
            if re.search(r'\d+', words[0]) and len(words[1]) <= 3 and words[1][0].isupper():
                continue
            # Both words have numbers (username with numbers)
            if re.search(r'\d+', words[0]) and re.search(r'\d+', words[1]):
                continue

        # Skip low-quality keywords (NEW)
        # - Single generic words
        # - Product structure fields
        # - Web navigation words
        if len(keyword_lower.split(' ')) == 1:
            # Skip single generic words that are clearly not topics
            generic_single_words = {'name', 'description', 'condition', 'notes', 'cover', 'sold', 'cib', 'art', 'top', 'posts', 'games', 'acceptable', 'greatest', 'hits', 'misc', 'included', 'case', 'poor', 'micro', 'sd'}
            if keyword_lower in generic_single_words:
                continue

        # Calculate gap score: demand / (supply + 1)
        gap_score = demand / (supply + 1)

        opportunities.append(KeywordOpportunity(
            keyword=keyword,
            demand=demand,
            supply=supply,
            gap_score=round(gap_score, 2)
        ))

    # Sort by gap_score (highest first), then by demand (highest first)
    opportunities.sort(
        key=lambda x: (-x.gap_score, -x.demand)
    )

    # Return top 10 opportunities
    top_opportunities = opportunities[:10]

    return {
        "reddit_topics": reddit_topics,
        "seo_topics": seo_topics,
        "opportunities": [
            {
                "keyword": opp.keyword,
                "demand": opp.demand,
                "supply": opp.supply,
                "gap_score": opp.gap_score
            }
            for opp in top_opportunities
        ]
    }
