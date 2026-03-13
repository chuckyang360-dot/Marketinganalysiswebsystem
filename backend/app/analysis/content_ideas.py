"""
Content Idea Generator Module

Generates actionable content ideas based on Reddit Agent (demand),
SEO Agent (supply), and Keyword Gap Agent (opportunities).

Purpose: Convert "demand + supply + gap" into "what content to create".
"""

from typing import List, Dict, Any
from pydantic import BaseModel
import re


class ContentIdea(BaseModel):
    """Single content idea."""
    title: str
    format: str
    reason: str
    target_keyword: str


class ContentIdeasResult(BaseModel):
    """Result of content idea generation."""
    content_ideas: List[ContentIdea]


# Content format templates
FORMATS = ["blog", "social post", "video script"]

# Keyword type classification keywords
PRODUCT_TOOL_KEYWORDS = [
    # Product names (common)
    "cursor", "copilot", "github copilot", "tabnine", "codeium", "replit",
    "claude", "gpt", "chatgpt", "gemini", "openai", "anthropic",
    "vscode", "visual studio", "intellij", "jetbrains", "sublime", "atom",
    # Generic tool indicators
    "assistant", "ide", "extension", "plugin", "tool", "platform", "app",
    # Tech products
    "shopify", "woocommerce", "magento", "bigcommerce",
    "aws", "azure", "gcp", "digitalocean", "heroku",
    # Development tools
    "docker", "kubernetes", "jenkins", "travis", "circleci",
    "react", "vue", "angular", "svelte", "next", "nuxt"
]

PAIN_POINT_KEYWORDS = [
    # Problem indicators
    "leak", "bug", "error", "crash", "slow", "broken", "fix", "problem", "issue",
    # Specific problems
    "memory leak", "memory management", "tracking number", "dropshipping problem",
    "404", "500", "timeout", "latency", "downtime",
    # Negative words
    "fail", "failure", "mistake", "confusing", "difficult", "complicated"
]

AUDIENCE_PERSONA_KEYWORDS = [
    # Experience level
    "junior", "senior", "beginner", "expert", "intermediate", "starter",
    # Roles
    "developer", "dev", "engineer", "designer", "manager", "founder",
    "startup", "business owner", "entrepreneur", "freelancer",
    "student", "learner", "user", "customer", "audience"
]

ACTION_HOW_TO_KEYWORDS = [
    # Action verbs
    "how to", "how do", "how can", "guide", "tutorial", "learn",
    "master", "setup", "install", "configure", "implement", "build",
    "create", "deploy", "optimize", "improve", "increase", "reduce"
]


def clean_generated_title(title: str, keyword: str = "") -> str:
    """
    Clean generated title to remove duplicate words and phrases.

    Args:
        title: Generated title string
        keyword: Original keyword for duplicate checking

    Returns:
        Cleaned title without duplicates

    Examples:
        "Top Copilot Alternative Alternatives" -> "Top Copilot Alternatives"
        "Best Shopify Seo Tips" (when keyword="shopify seo") -> "Best Shopify Seo Tips"
    """
    if not title:
        return ""

    # Get keyword words for duplicate checking
    keyword_lower = keyword.lower() if keyword else ""
    keyword_words = set(keyword_lower.split()) if keyword else set()

    # Special handling: if keyword contains "alternative" and title has "alternatives",
    # replace "alternatives" with "options" before deduplication
    if "alternative" in keyword_lower and "alternatives" in title.lower():
        title = re.sub(r'\balternatives\b', 'options', title, flags=re.IGNORECASE)

    # Special handling: if keyword contains "guide" and title has "guide",
    # remove the template word to avoid duplication
    if "guide" in keyword_lower and "guide" in title.lower():
        # Only remove "guide" if it appears as a separate word at the end or after colon
        title = re.sub(r'\sGuide:\s*', ': ', title, flags=re.IGNORECASE)
        title = re.sub(r'\s+Guide\s*$', '', title, flags=re.IGNORECASE)

    # Special handling: if keyword contains "tutorial" and title has "tutorial"
    if "tutorial" in keyword_lower and "tutorial" in title.lower():
        title = re.sub(r'\sTutorial:\s*', ': ', title, flags=re.IGNORECASE)
        title = re.sub(r'\s+Tutorial\s*$', '', title, flags=re.IGNORECASE)

    # Get all words for duplicate checking
    template_words = title.lower().split()

    # Only remove exact duplicate words
    seen_words = set()
    cleaned_words = []

    for word in template_words:
        # Remove punctuation from word for comparison
        clean_word = re.sub(r'[.,!?;:]', '', word).lower()

        # Skip if already seen (exact duplicate)
        if clean_word in seen_words:
            continue

        seen_words.add(clean_word)
        cleaned_words.append(word)

    # Reconstruct title preserving original case
    original_words = title.split()
    result_words = []
    seen_lower = set()

    for orig_word in original_words:
        lower_word = orig_word.lower().strip('.,!?;:')
        if lower_word in seen_lower:
            continue
        seen_lower.add(lower_word)
        result_words.append(orig_word)

    cleaned_title = ' '.join(result_words)

    # Fix multiple spaces
    cleaned_title = re.sub(r'\s+', ' ', cleaned_title).strip()

    return cleaned_title


def classify_keyword_type(keyword: str) -> str:
    """
    Classify keyword into one of predefined types.

    Args:
        keyword: The keyword string to classify

    Returns:
        Keyword type: "product/tool", "pain_point/problem",
                    "audience/persona", "action/how_to", or "generic"

    Examples:
        "cursor" -> "product/tool"
        "copilot alternative" -> "product/tool"
        "memory leak" -> "pain_point/problem"
        "junior dev" -> "audience/persona"
        "shopify seo" -> "generic"
        "tracking number" -> "pain_point/problem"
        "how to install" -> "action/how_to"
    """
    if not keyword:
        return "generic"

    keyword_lower = keyword.lower()

    # Check action/how_to first (patterns starting with action words)
    for action_word in ACTION_HOW_TO_KEYWORDS:
        if keyword_lower.startswith(action_word):
            return "action/how_to"

    # Check pain_point/problem
    for pain_word in PAIN_POINT_KEYWORDS:
        if pain_word in keyword_lower:
            return "pain_point/problem"

    # Check product/tool
    for product_word in PRODUCT_TOOL_KEYWORDS:
        if product_word in keyword_lower:
            return "product/tool"

    # Check audience/persona
    for audience_word in AUDIENCE_PERSONA_KEYWORDS:
        if audience_word in keyword_lower:
            return "audience/persona"

    # Default to generic
    return "generic"


# Type-specific title templates

# Product/Tool type templates
PRODUCT_TOOL_BLOG = [
    "{keyword} Review for Beginners",
    "{keyword} vs Popular Alternatives",
    "How {keyword} Can Improve Your Daily Workflow",
    "{keyword}: Complete Feature Guide",
    "Getting Started with {keyword}",
    "{keyword} Tips for Power Users",
    "Is {keyword} Worth It",
    "Top Extensions for {keyword}",
    "{keyword}: Pricing and Features",
    "How to Migrate from [Alternative] to {keyword}"
]

PRODUCT_TOOL_SOCIAL_PROFESSIONAL = [
    "My first impressions after using {keyword}",
    "{keyword} tip that saved me hours of work",
    "Why {keyword} is better than [competitor] for my workflow",
    "My productivity improved after switching to {keyword}",
    "Key {keyword} features most people miss",
    "{keyword} in 60 seconds: what you need to know",
    "Why everyone is talking about {keyword}",
    "Common mistake when using {keyword}",
    "Before you try {keyword} read this"
]

PRODUCT_TOOL_SOCIAL_VIDEO_SCRIPT = [
    "{keyword}: Honest Review and Demo",
    "A Day in the Life Using {keyword}",
    "Top {keyword} Alternatives You Should Know About",
    "{keyword}: Complete Tutorial for Beginners",
    "How {keyword} Changed My Development Workflow",
    "{keyword} vs [Competitor]: Which Should You Pick",
    "{keyword} Hidden Features You Are Probably Not Using",
    "Building a Project from Scratch Using {keyword}"
]

# Pain Point/Problem type templates
PAIN_POINT_BLOG = [
    "How to Fix {keyword}: Complete Troubleshooting Guide",
    "{keyword}: Common Causes and Proven Solutions",
    "Dealing with {keyword}: What Works and What Does Not",
    "The Ultimate Guide to Resolving {keyword}",
    "{keyword}: Prevention Detection and Resolution",
    "I Finally Solved {keyword}",
    "{keyword} Explained: Why It Happens and How to Fix It",
    "Best Practices for Avoiding {keyword} in Your Projects",
    "{keyword}: A Developer Survival Guide"
]

PAIN_POINT_SOCIAL_PROFESSIONAL = [
    "How I solved {keyword}: what worked for me",
    "Quick fix for {keyword} that actually works",
    "Most common {keyword} mistake and how to avoid it",
    "Stop struggling with {keyword} try this instead",
    "The {keyword} issue nobody explains properly",
    "How {keyword} was costing me time and money",
    "You are probably doing {keyword} wrong",
    "From stuck to solved: my journey with {keyword}",
    "{keyword} fix that works most of the time"
]

PAIN_POINT_SOCIAL_VIDEO_SCRIPT = [
    "{keyword}: Complete Troubleshooting Guide for Beginners",
    "How I Finally Fixed {keyword}: The Full Story",
    "Top {keyword} Solutions: Which One Actually Works",
    "{keyword}: Root Cause Analysis and Fixes",
    "Step by Step: Resolving {keyword} Once and for All",
    "Common {keyword} Issues and Their Easiest Fixes",
    "I Tried 5 Methods to Fix {keyword}",
    "{keyword}: Prevention Strategies That Actually Work"
]

# Audience/Persona type templates
AUDIENCE_BLOG = [
    "Complete {keyword} Guide: Everything You Need to Know",
    "{keyword}: From Zero to Hero Learning Path",
    "Resources Every {keyword} Should Know About",
    "{keyword}: Career Path Skills and Opportunities",
    "The {keyword} Survival Kit",
    "{keyword}: Mistakes to Avoid and Best Practices to Follow",
    "How to Advance from {keyword} to Next Level",
    "{keyword}: Tools Technologies and Learning Resources",
    "A Day in the Life of a {keyword}",
    "{keyword}: Interview Questions Answers and Tips"
]

AUDIENCE_SOCIAL_PROFESSIONAL = [
    "For {keyword}s: the roadmap I wish I had starting out",
    "{keyword} tip that accelerated my career",
    "From {keyword} to senior: what actually changed",
    "Common {keyword} career mistakes to avoid",
    "Quick advice every {keyword} needs to hear",
    "{keyword} resource that changed everything for me",
    "The {keyword} struggle nobody talks about",
    "My {keyword} journey: from clueless to confident",
    "Dear {keyword}s: what I wish someone told me"
]

AUDIENCE_SOCIAL_VIDEO_SCRIPT = [
    "The {keyword} Roadmap: From Beginner to Expert",
    "{keyword}: Career Advice That Actually Works",
    "Tools Every {keyword} Should Master",
    "How I Went from {keyword} to Landing My Dream Job",
    "{keyword}: Common Career Mistakes and How to Avoid Them",
    "A Day in the Life of a {keyword}",
    "{keyword}: Skills Portfolio and Career Growth",
    "What I Learned After Years Working as a {keyword}",
    "{keyword}: The Truth About Breaking In"
]

# Action/How-To type templates
ACTION_HOW_TO_BLOG = [
    "How to {keyword}: Complete Step by Step Guide",
    "{keyword} Explained Simply for Everyone",
    "Best Practices for {keyword}",
    "{keyword}: From Beginner to Advanced",
    "The Modern Guide to {keyword}",
    "{keyword}: Tips Tricks and Common Pitfalls",
    "Mastering {keyword}: Everything You Need to Know",
    "{keyword}: A Practical Handbook",
    "How to {keyword} Like a Pro",
    "{keyword}: The Ultimate Reference Guide"
]

ACTION_HOW_TO_SOCIAL_PROFESSIONAL = [
    "How to {keyword} in 3 simple steps",
    "{keyword} tip most people do not know about",
    "{keyword} technique that changed my workflow",
    "Stop doing {keyword} this way do this instead",
    "The {keyword} hack that saves me hours",
    "Quick guide to {keyword} for beginners",
    "{keyword}: here is what actually works",
    "Nobody explains {keyword} this simply thread",
    "{keyword} in 60 seconds: essential steps"
]

ACTION_HOW_TO_SOCIAL_VIDEO_SCRIPT = [
    "How to {keyword}: Complete Beginner Tutorial",
    "{keyword}: Step by Step Implementation Guide",
    "Master {keyword} in This One Video",
    "{keyword}: From Zero to Hero",
    "The Easiest Way to {keyword}",
    "{keyword}: Advanced Techniques and Best Practices",
    "Building [Project] Using {keyword}",
    "{keyword}: Common Mistakes and How to Avoid Them",
    "{keyword}: The Complete Guide"
]

# Generic type templates
GENERIC_BLOG = [
    "{keyword}: Complete Guide",
    "Everything You Need to Know About {keyword}",
    "{keyword}: What You Need to Know",
    "The Ultimate Guide to {keyword}",
    "{keyword}: Comprehensive Overview",
    "{keyword}: Trends Insights and Best Practices",
    "Understanding {keyword}: A Deep Dive",
    "{keyword}: Analysis Comparison and Recommendations",
    "{keyword}: Past Present and Future"
]

GENERIC_SOCIAL_PROFESSIONAL = [
    "Here is everything you need to know about {keyword}",
    "{keyword}: quick rundown of what is important",
    "Why {keyword} is trending right now",
    "My honest opinion on {keyword}",
    "Quick {keyword} summary: key points",
    "{keyword}: here is what everyone is missing",
    "Thread on {keyword}: complete picture",
    "{keyword} explained simply in 60 seconds",
    "My take on {keyword} after deep research"
]

GENERIC_SOCIAL_VIDEO_SCRIPT = [
    "{keyword}: Complete Guide",
    "Everything You Need to Know About {keyword}",
    "{keyword}: Full Overview",
    "The Ultimate Guide to {keyword}",
    "{keyword}: A Complete Overview",
    "{keyword}: Trends Analysis and Insights",
    "Understanding {keyword}: A Deep Dive",
    "{keyword}: Analysis and Recommendations"
]

# Type-specific reason templates
PRODUCT_TOOL_REASONS = [
    "High demand from Reddit discussions with limited SEO content",
    "Users frequently ask about {keyword} but few comprehensive guides exist",
    "Trending topic on Reddit with low supply side content"
]

PAIN_POINT_REASONS = [
    "Users frequently mention this issue indicating demand for troubleshooting content",
    "Discussions show strong need for solutions to this problem",
    "High Reddit engagement indicates users need help resolving this issue",
    "Multiple threads asking for guidance on resolving this problem"
]

AUDIENCE_REASONS = [
    "This audience has clear learning needs and limited tailored content",
    "Discussions show strong interest from this user group",
    "Many questions from this persona indicate unmet content needs",
    "Career discussions from this group lack comprehensive resources"
]

ACTION_HOW_TO_REASONS = [
    "Users want step by step guidance for this action",
    "Demand exists for practical instructional content",
    "Beginners need clear guidance on this specific action",
    "Users search for tutorials on this topic but find limited results"
]

GENERIC_REASONS = [
    "This topic appears frequently and deserves broader explanatory content",
    "Existing content coverage is limited relative to user interest",
    "High engagement indicates market need for comprehensive coverage",
    "Users discuss this topic but lack authoritative resources"
]


def get_title_templates(keyword_type: str, content_format: str) -> List[str]:
    """
    Get appropriate title templates based on keyword type and content format.

    Args:
        keyword_type: The classified keyword type
        content_format: The content format (blog social post or video script)

    Returns:
        List of title templates for given type and format
    """
    templates_map = {
        "product/tool": {
            "blog": PRODUCT_TOOL_BLOG,
            "social post": PRODUCT_TOOL_SOCIAL_PROFESSIONAL,
            "video script": PRODUCT_TOOL_SOCIAL_VIDEO_SCRIPT
        },
        "pain_point/problem": {
            "blog": PAIN_POINT_BLOG,
            "social post": PAIN_POINT_SOCIAL_PROFESSIONAL,
            "video script": PAIN_POINT_SOCIAL_VIDEO_SCRIPT
        },
        "audience/persona": {
            "blog": AUDIENCE_BLOG,
            "social post": AUDIENCE_SOCIAL_PROFESSIONAL,
            "video script": AUDIENCE_SOCIAL_VIDEO_SCRIPT
        },
        "action/how_to": {
            "blog": ACTION_HOW_TO_BLOG,
            "social post": ACTION_HOW_TO_SOCIAL_PROFESSIONAL,
            "video script": ACTION_HOW_TO_SOCIAL_VIDEO_SCRIPT
        },
        "generic": {
            "blog": GENERIC_BLOG,
            "social post": GENERIC_SOCIAL_PROFESSIONAL,
            "video script": GENERIC_SOCIAL_VIDEO_SCRIPT
        }
    }

    return templates_map.get(keyword_type, {}).get(content_format, GENERIC_BLOG)


def get_reason_templates(keyword_type: str) -> List[str]:
    """
    Get reason templates based on keyword type.

    Args:
        keyword_type: The classified keyword type

    Returns:
        List of reason templates for given type
    """
    reason_map = {
        "product/tool": PRODUCT_TOOL_REASONS,
        "pain_point/problem": PAIN_POINT_REASONS,
        "audience/persona": AUDIENCE_REASONS,
        "action/how_to": ACTION_HOW_TO_REASONS,
        "generic": GENERIC_REASONS
    }

    return reason_map.get(keyword_type, GENERIC_REASONS)


def generate_content_ideas(
    reddit_topics: List[str],
    seo_topics: List[str],
    opportunities: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate actionable content ideas based on gap analysis.

    Args:
        reddit_topics: List of topics from Reddit Agent (demand side)
        seo_topics: List of topics from SEO Agent (supply side)
        opportunities: List of opportunity dictionaries from gap analysis

    Returns:
        Dictionary with content_ideas list, sorted by gap_score
    """
    # Sort opportunities by gap_score (highest first)
    sorted_opportunities = sorted(
        opportunities,
        key=lambda x: x.get("gap_score", 0),
        reverse=True
    )

    # Generate 1-2 content ideas per opportunity
    content_ideas = []

    for opportunity in sorted_opportunities[:10]:  # Take top 10 opportunities
        keyword = opportunity.get("keyword", "")
        gap_score = opportunity.get("gap_score", 0)
        demand = opportunity.get("demand", 0)

        if not keyword:
            continue

        # Classify keyword type
        keyword_type = classify_keyword_type(keyword)

        # Get type-specific reason templates
        reason_templates = get_reason_templates(keyword_type)

        # Generate 1-2 ideas per keyword based on gap_score
        num_ideas = 2 if gap_score > 1.0 else 1

        for i in range(num_ideas):
            # Select format (cycle through formats)
            format_type = FORMATS[(i + len(content_ideas)) % len(FORMATS)]

            # Get appropriate title templates based on keyword type and format
            templates = get_title_templates(keyword_type, format_type)

            # Select template from list
            template = templates[len(content_ideas) % len(templates)]

            # Generate title
            title = template.format(keyword=keyword.title())

            # Clean title to remove duplicates (pass keyword for context)
            title = clean_generated_title(title, keyword)

            # Select reason template from type-specific list
            reason_template = reason_templates[len(content_ideas) % len(reason_templates)]
            reason = reason_template.format(keyword=keyword.title())

            content_ideas.append(ContentIdea(
                title=title,
                format=format_type,
                reason=reason,
                target_keyword=keyword
            ))

            # Stop if we have 10 ideas total
            if len(content_ideas) >= 10:
                break

        # Stop if we have 10 ideas total
        if len(content_ideas) >= 10:
            break

    return {
        "content_ideas": [
            {
                "title": idea.title,
                "format": idea.format,
                "reason": idea.reason,
                "target_keyword": idea.target_keyword
            }
            for idea in content_ideas[:10]
        ]
    }
