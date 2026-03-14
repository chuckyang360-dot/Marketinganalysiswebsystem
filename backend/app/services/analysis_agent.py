import httpx
import logging
from typing import List, Dict, Set, Tuple
from datetime import datetime
from difflib import SequenceMatcher
from ..config import settings
from ..schemas import (
    EvidenceItem,
    EvidenceSource,
    EvidenceMetrics,
    EvidenceAnalysis,
    EvidenceMetadata,
    AnalyzeResponse,
    Topic,
    KeyInsight,
    SentimentSummary,
    EmergingPattern,
    RecommendedAngle,
    AnalysisMeta,
)

logger = logging.getLogger(__name__)


def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity between two text strings using SequenceMatcher.
    Returns a value between 0.0 (no similarity) and 1.0 (identical).
    """
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


def deduplicate_evidence(items: List[EvidenceItem], similarity_threshold: float = 0.85) -> List[EvidenceItem]:
    """
    Deduplicate evidence items based on content similarity.

    Keeps the item with higher engagement score among near-duplicates.
    """
    if not items or len(items) <= 1:
        return items

    # First, calculate engagement scores for all items
    items_with_score = [(item, calculate_engagement_score(item)) for item in items]

    # Sort by engagement score (highest first) so we keep the best
    items_with_score.sort(key=lambda x: x[1], reverse=True)

    deduplicated = []
    used_indices = set()

    for i, (item1, score1) in enumerate(items_with_score):
        if i in used_indices:
            continue

        # Add this item to deduplicated list
        deduplicated.append(item1)
        used_indices.add(i)

        # Check for similar items (with lower engagement)
        for j, (item2, score2) in enumerate(items_with_score[i+1:], start=i+1):
            if j in used_indices:
                continue

            # Compare content similarity
            content1 = item1.content or ""
            content2 = item2.content or ""

            # Also compare titles if available
            title1 = item1.title or ""
            title2 = item2.title or ""

            # Check if either content or titles are similar
            content_sim = calculate_text_similarity(content1, content2) if content1 and content2 else 0.0
            title_sim = calculate_text_similarity(title1, title2) if title1 and title2 else 0.0

            # Consider duplicates if either content OR titles are similar above threshold
            if content_sim >= similarity_threshold or title_sim >= similarity_threshold:
                used_indices.add(j)
                logger.debug(f"Deduplicated: item {j} is {max(content_sim, title_sim):.2f} similar to item {i}")

    logger.info(f"Deduplicated {len(items)} items to {len(deduplicated)} items (threshold: {similarity_threshold})")
    return deduplicated


def calculate_engagement_score(item: EvidenceItem) -> float:
    """
    Calculate engagement score for sorting evidence items.
    Uses interaction signals only (likes, comments, reposts, shares, upvotes).
    """
    # Priority: Use system-calculated engagement_rate if available
    if item.analysis and item.analysis.engagement_rate is not None:
        return item.analysis.engagement_rate

    # Fallback: Sum of interaction signals
    metrics = item.metrics or EvidenceMetrics()
    likes = metrics.likes or 0
    comments = metrics.comments or 0
    reposts = metrics.reposts or 0
    shares = metrics.shares or 0
    upvotes = metrics.upvotes or 0

    return float(likes + comments + reposts + shares + upvotes)


def build_evidence_summary(items: List[EvidenceItem]) -> str:
    """
    Build evidence summary for Grok prompt context.
    """
    summary_lines = []
    for idx, item in enumerate(items):
        platform = item.platform.upper()
        author = item.author or "Unknown"
        content = (item.content or "")[:200]
        metrics = item.metrics or EvidenceMetrics()
        likes = metrics.likes or 0
        comments = metrics.comments or 0
        views = metrics.views or 0
        sentiment = item.analysis.sentiment if item.analysis else "neutral"

        summary = f"[{idx + 1}] {platform} - {author}\n"
        summary += f"Content: {content}\n"
        summary += f"Engagement: {likes} likes, {comments} comments, {views} views\n"
        summary += f"Sentiment: {sentiment}\n"

        # Add platform-specific info (safe attribute access)
        if item.source:
            # Reddit-specific fields
            if hasattr(item.source, 'subreddit') and item.source.subreddit:
                summary += f"Subreddit: {item.source.subreddit}\n"
            # SEO-specific fields
            if hasattr(item.source, 'domain_authority') and item.source.domain_authority:
                summary += f"Domain Authority: {item.source.domain_authority}\n"

        summary_lines.append(summary)

    return "\n---\n".join(summary_lines)


def generate_analysis_prompt(items: List[EvidenceItem], query: str = None) -> str:
    """
    Generate Grok analysis prompt focused on user discussions, not product features.
    """
    evidence_summary = build_evidence_summary(items)
    item_count = len(items)
    platforms = list(set(item.platform for item in items))

    return f"""You are a marketing intelligence analyst.

Your task is to analyze real discussions from social media and web sources.

Focus ONLY on:

1. What users are actually talking about
2. Problems, complaints, or unmet needs
3. Emerging trends or repeated discussions
4. Content opportunities based on discussions

Important rules:

- Do NOT summarize product features.
- Do NOT describe the platform itself.
- Focus on user conversations and behavior.
- Identify discussion themes, not product modules.

Query:
{query or "N/A"}

Evidence:
{evidence_summary}

CRITICAL CONSTRAINTS:

1. Topics must be phrased as real discussion themes or user concerns, not abstract analyst labels.
   - BAD: "AI coordination in crisis management"
   - GOOD: "Users want AI tools that can quickly detect negative trends"
   - BAD: "Social media monitoring effectiveness"
   - GOOD: "People are wondering if social monitoring actually catches brand mentions"

2. Key insights must describe user needs, complaints, behaviors, or unmet demand — not marketing recommendations.
   - BAD: "Capitalizes on positive discussions to build credibility"
   - GOOD: "Users share stories about how AI tools detected PR issues in real-time"
   - BAD: "Positions as helpful while showcasing improvements"
   - GOOD: "Users ask if accuracy improvements are actually being made"

3. Recommended angles must be specific content ideas, not generic strategy labels.
   - BAD: "Real-user stories of AI saving PR crises"
   - GOOD: "Write a detailed case study: how a digital marketer used AI tools to detect and respond to a PR crisis"
   - BAD: "Tips for improving sentiment analysis accuracy"
   - GOOD: "Create a before/after comparison: show how sentiment analysis was wrong, then show the corrected version"

4. Stay close to the wording and meaning of the evidence whenever possible.
   - If users say "SEO keeps crashing", use "SEO keeps crashing" not "Technical reliability issues"
   - If users complain about "sentiment misclassification", use that exact phrase

Return JSON with:

{{
  "topics": [
    {{
      "name": "discussion theme or user concern (use natural language, NOT analyst jargon)",
      "frequency": number,
      "platforms": ["x", "reddit", "seo", "youtube", "instagram"]
    }}
  ],
  "key_insights": [
    {{
      "category": "opportunity" | "risk" | "trend" | "gap",
      "title": "concise title",
      "description": "Describe what users say/need/complain about, NOT marketing recommendations",
      "supporting_evidence": number,
      "platforms": ["x", "reddit", "seo", "youtube", "instagram"]
    }}
  ],
  "sentiment_summary": {{
    "positive": number,
    "negative": number,
    "neutral": number,
    "mixed": number,
    "dominant": "positive" | "negative" | "neutral" | "mixed" | null
  }},
  "emerging_patterns": [
    {{
      "pattern": "description of recurring user behavior or discussion pattern",
      "evidence_count": number,
      "confidence": "high" | "medium" | "low",
      "platforms": ["x", "reddit", "seo", "youtube", "instagram"],
      "timeframe": "recent" | "ongoing" | "seasonal"
    }}
  ],
  "recommended_angles": [
    {{
      "angle": "specific, actionable content idea (what to actually create)",
      "rationale": "why this content would resonate",
      "target_audience": "who to target",
      "content_type": "post" | "video" | "story" | "article",
      "platforms": ["x", "reddit", "seo", "youtube", "instagram"]
    }}
  ]
}}

Return VALID JSON ONLY.
No markdown.
No explanation outside JSON."""


async def call_grok_analysis(prompt: str) -> Dict:
    """
    Call Grok API for evidence analysis.
    """
    logger.info("=" * 80)
    logger.info("GROK API ANALYSIS - STARTING")
    logger.info("=" * 80)

    # Check if API key is configured
    if not settings.XAI_API_KEY:
        logger.warning("XAI_API_KEY not configured - using fallback analysis")
        raise ValueError("XAI_API_KEY not configured")

    logger.info(f"✓ XAI_API_KEY configured (length: {len(settings.XAI_API_KEY)})")
    logger.info(f"✓ XAI_API_URL: {settings.XAI_API_URL}")
    logger.info(f"✓ XAI_MODEL: {settings.XAI_MODEL or 'grok-beta (default)'}")

    headers = {
        "Authorization": f"Bearer {settings.XAI_API_KEY}",
        "Content-Type": "application/json",
    }

    # Use model from settings or default to grok-beta
    model_name = settings.XAI_MODEL or "grok-beta"

    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful marketing intelligence analyst. Always respond with valid JSON only.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    logger.info(f"📤 Sending Grok request with model: {model_name}")
    logger.info(f"📤 Prompt length: {len(prompt)} characters")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.XAI_API_URL}/chat/completions",
                headers=headers,
                json=payload,
            )

            logger.info(f"📥 Grok response status: {response.status_code}")

            if response.status_code != 200:
                logger.error(f"❌ Grok API error: {response.status_code} - {response.text}")
                raise ValueError(f"Grok API error: {response.status_code}")

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            if not content:
                logger.error("❌ No content in Grok response")
                raise ValueError("No content in Grok response")

            logger.info(f"📥 Response content length: {len(content)} characters")

            # Try to parse JSON from response
            try:
                import json
                parsed = json.loads(content)
                logger.info(f"✓ JSON parsed successfully")

                # Log summary of parsed data
                logger.info(f"✓ Topics found: {len(parsed.get('topics', []))}")
                logger.info(f"✓ Key insights: {len(parsed.get('key_insights', []))}")
                logger.info(f"✓ Sentiment summary: {parsed.get('sentiment_summary', {})}")
                logger.info(f"✓ Emerging patterns: {len(parsed.get('emerging_patterns', []))}")
                logger.info(f"✓ Recommended angles: {len(parsed.get('recommended_angles', []))}")
                logger.info("=" * 80)

                return parsed
            except json.JSONDecodeError:
                # Try to extract JSON from markdown
                logger.warning("⚠ Direct JSON parse failed, attempting to extract from markdown")
                import re
                json_match = re.search(r"\{[\s\S]*\}", content)
                if json_match:
                    extracted = json.loads(json_match.group(0))
                    logger.info(f"✓ JSON extracted from markdown successfully")
                    logger.info(f"✓ Topics found: {len(extracted.get('topics', []))}")
                    logger.info("=" * 80)
                    return extracted
                logger.error("❌ Failed to parse Grok response as JSON")
                logger.error(f"❌ Content preview: {content[:500]}...")
                raise ValueError("Failed to parse Grok response as JSON")

    except httpx.TimeoutException:
        logger.error("❌ Grok API request timed out")
        raise ValueError("Request to Grok API timed out")
    except httpx.RequestError as e:
        logger.error(f"❌ Error connecting to Grok API: {e}")
        raise ValueError(f"Error connecting to Grok API: {e}")


def perform_basic_analysis(items: List[EvidenceItem], query: str = None) -> AnalyzeResponse:
    """
    Perform basic analysis without AI (fallback when Grok is unavailable).

    This provides limited functionality:
    - Sentiment counting from pre-analyzed evidence
    - Basic topic extraction from title first words
    - NO semantic understanding of content
    - NO pattern detection
    - NO actionable recommendations

    For full insights, configure XAI_API_KEY and enable Grok API access.
    """
    logger.info("=" * 80)
    logger.info("FALLBACK ANALYSIS - BASIC MODE")
    logger.info("=" * 80)
    logger.info(f"Processing {len(items)} items in fallback mode")
    """
    Perform basic analysis without AI (fallback when Grok is unavailable).

    This provides limited functionality:
    - Sentiment counting from pre-analyzed evidence
    - Basic topic extraction from title first words
    - NO semantic understanding of content
    - NO pattern detection
    - NO actionable recommendations

    For full insights, configure XAI_API_KEY and enable Grok API access.
    """
    # Count sentiment
    sentiment_counts = {
        "positive": 0,
        "negative": 0,
        "neutral": 0,
        "mixed": 0,
    }

    # Extract topics from titles (basic extraction - first word of title)
    topic_map: Dict[str, Dict] = {}

    for item in items:
        # Sentiment counting
        if item.analysis and item.analysis.sentiment:
            sentiment = item.analysis.sentiment
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1

        # Topic extraction from titles (very basic - first word)
        if item.title and len(item.title) > 0:
            key = item.title.split(" ")[0].strip(":").strip()
            if key and len(key) > 1:  # Skip single characters and empty
                if key not in topic_map:
                    topic_map[key] = {"count": 0, "platforms": set()}
                topic_map[key]["count"] += 1
                topic_map[key]["platforms"].add(item.platform)

    # Determine dominant sentiment
    dominant = None
    max_count = 0
    for sentiment, count in sentiment_counts.items():
        if count > max_count:
            max_count = count
            dominant = sentiment

    # Build topics (limited basic extraction)
    topics = [
        Topic(
            name=name,
            frequency=data["count"],
            platforms=list(data["platforms"]),
            sentiment=None,
        )
        for name, data in sorted(topic_map.items(), key=lambda x: x[1]["count"], reverse=True)[:5]
    ]

    # Build basic insight with clear limitation indication
    platforms_covered = list(set(item.platform for item in items))

    return AnalyzeResponse(
        topics=topics,
        key_insights=[
            KeyInsight(
                category="opportunity",
                title="FALLBACK ANALYSIS - Limited Insights Available",
                description=f"[LIMITED MODE] AI analysis unavailable. Only basic metrics are shown.\n\n"
                           f"Analyzed {len(items)} evidence items across {', '.join(platforms_covered)}.\n\n"
                           f"WHAT'S AVAILABLE:\n"
                           f"- Sentiment counts from pre-analyzed evidence\n"
                           f"- Basic topic extraction (first words of titles)\n\n"
                           f"WHAT'S MISSING (requires Grok API):\n"
                           f"- Semantic topic grouping\n"
                           f"- Pattern detection (trends, risks, gaps)\n"
                           f"- Actionable content recommendations\n"
                           f"- Evidence-backed insights\n\n"
                           f"Configure XAI_API_KEY to enable full AI-powered analysis.",
                supporting_evidence=len(items),
                platforms=platforms_covered,
            )
        ],
        sentiment_summary=SentimentSummary(
            positive=sentiment_counts["positive"],
            negative=sentiment_counts["negative"],
            neutral=sentiment_counts["neutral"],
            mixed=sentiment_counts["mixed"],
            dominant=dominant,
        ),
        emerging_patterns=[],
        recommended_angles=[],
        meta=AnalysisMeta(
            total_evidence_analyzed=len(items),
            platforms_covered=platforms_covered,
            analysis_timestamp=datetime.utcnow().isoformat(),
        ),
    )


async def analyze_evidence(
    evidence: List[EvidenceItem],
    max_items: int = 10,
    query: str = None,
) -> AnalyzeResponse:
    """
    Main Analysis Agent function.

    Transforms raw evidence into structured insights using Grok API.

    Process:
    1. Deduplicate near-duplicate evidence items
    2. Sort by engagement score
    3. Select top N items
    4. Call Grok API or fallback to basic analysis
    """
    logger.info("=" * 80)
    logger.info("EVIDENCE ANALYSIS - STARTING")
    logger.info("=" * 80)
    logger.info(f"Input evidence items: {len(evidence)}")
    logger.info(f"Max items for analysis: {max_items}")
    logger.info(f"Query: {query or 'N/A'}")

    if not evidence or len(evidence) == 0:
        logger.warning("No evidence provided, returning empty response")
        return AnalyzeResponse(
            topics=[],
            key_insights=[],
            sentiment_summary=SentimentSummary(
                positive=0, negative=0, neutral=0, dominant=None
            ),
            emerging_patterns=[],
            recommended_angles=[],
            meta=AnalysisMeta(
                total_evidence_analyzed=0,
                platforms_covered=[],
                analysis_timestamp=datetime.utcnow().isoformat(),
            ),
        )

    # Step 1: Deduplicate evidence before analysis
    logger.info("Step 1: Deduplicating evidence...")
    deduplicated = deduplicate_evidence(evidence, similarity_threshold=0.85)
    logger.info(f"  Original: {len(evidence)} items")
    logger.info(f"  After deduplication: {len(deduplicated)} items")

    # Step 2: Sort by engagement and limit to top N
    logger.info("Step 2: Sorting by engagement and selecting top N...")
    items_with_score = [(item, calculate_engagement_score(item)) for item in deduplicated]
    items_with_score.sort(key=lambda x: x[1], reverse=True)
    top_items = [item for item, _ in items_with_score[:max_items]]

    platforms_covered = list(set(item.platform for item in top_items))
    logger.info(f"  Top items selected: {len(top_items)}")
    logger.info(f"  Platforms covered: {', '.join(platforms_covered)}")

    # Step 3: Try Grok analysis first
    logger.info("Step 3: Attempting Grok API analysis...")
    try:
        prompt = generate_analysis_prompt(top_items, query)
        analysis_result = await call_grok_analysis(prompt)

        # Convert dict result to Pydantic models
        logger.info("Converting Grok response to Pydantic models...")
        topics = [
            Topic(**topic) if isinstance(topic, dict) else topic
            for topic in analysis_result.get("topics", [])
        ]
        key_insights = [
            KeyInsight(**insight) if isinstance(insight, dict) else insight
            for insight in analysis_result.get("key_insights", [])
        ]
        # Handle sentiment_summary - ALWAYS compute from evidence for accuracy
        # We ignore Grok's sentiment_summary and calculate from actual evidence to ensure accuracy
        logger.info("Computing sentiment summary from evidence (ignoring Grok's sentiment_summary)...")

        # Compute sentiment counts from evidence
        sentiment_counts = {
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "mixed": 0,
        }
        for item in top_items:
            if item.analysis and item.analysis.sentiment:
                s = item.analysis.sentiment
                if s in sentiment_counts:
                    sentiment_counts[s] += 1

        # Determine dominant sentiment
        dominant = None
        max_count = 0
        for sentiment, count in sentiment_counts.items():
            if count > max_count:
                max_count = count
                dominant = sentiment

        sentiment_summary = SentimentSummary(
            positive=sentiment_counts["positive"],
            negative=sentiment_counts["negative"],
            neutral=sentiment_counts["neutral"],
            mixed=sentiment_counts["mixed"],
            dominant=dominant,
        )
        logger.info(f"Computed sentiment from evidence: {sentiment_counts}")
        emerging_patterns = [
            EmergingPattern(**pattern) if isinstance(pattern, dict) else pattern
            for pattern in analysis_result.get("emerging_patterns", [])
        ]
        recommended_angles = [
            RecommendedAngle(**angle) if isinstance(angle, dict) else angle
            for angle in analysis_result.get("recommended_angles", [])
        ]

        logger.info(f"✓ Analysis complete using Grok API")
        logger.info(f"  Topics: {len(topics)}")
        logger.info(f"  Key insights: {len(key_insights)}")
        logger.info(f"  Emerging patterns: {len(emerging_patterns)}")
        logger.info(f"  Recommended angles: {len(recommended_angles)}")
        logger.info("=" * 80)

        return AnalyzeResponse(
            topics=topics,
            key_insights=key_insights,
            sentiment_summary=sentiment_summary,
            emerging_patterns=emerging_patterns,
            recommended_angles=recommended_angles,
            meta=AnalysisMeta(
                total_evidence_analyzed=len(top_items),
                platforms_covered=platforms_covered,
                analysis_timestamp=datetime.utcnow().isoformat(),
            ),
        )

    except ValueError as e:
        logger.error(f"❌ Grok analysis failed: {e}")
        logger.info("Falling back to basic analysis...")
        # Fallback to basic analysis
        return perform_basic_analysis(top_items, query)

    except Exception as e:
        logger.error(f"❌ Unexpected error in analysis: {e}")
        import traceback
        logger.error(traceback.format_exc())
        logger.info("Falling back to basic analysis...")
        # Fallback to basic analysis
        return perform_basic_analysis(top_items, query)
