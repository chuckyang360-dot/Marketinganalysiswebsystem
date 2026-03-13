"""
Topics Analysis Module

Extracts trending topics from mentions using n-gram extraction (2-gram, 3-gram).
"""

from typing import List, Set, Tuple
from collections import Counter
from ..providers.base import Mention
from pydantic import BaseModel
import re


class TopicItem(BaseModel):
    """Single topic item."""
    keyword: str
    count: int


class TopicResult(BaseModel):
    """Result of topic analysis."""
    topics: List[str]
    total_topics: int


# Extended stopwords for topic extraction
STOPWORDS = {
    # Pronouns and articles
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "had", "has", "have", "he", "her", "his", "i", "in", "is", "it", "its", "of", "on", "or", "she", "so", "that", "the", "their", "them", "there", "these", "they", "this", "those", "to", "was", "were", "will", "with",
    # Auxiliary verbs
    "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "shall", "should", "will", "would", "could", "can", "may", "might", "must", "ought",
    # Common stopwords
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "than", "too", "very", "just", "also", "now", "here", "how", "why", "when", "where", "which", "while", "about", "up", "out", "down", "off", "over", "under", "again", "further", "then", "once", "new", "into", "through", "during", "before", "after", "above", "below", "between",
    # Question/indeterminate words
    "anyone", "anything", "anywhere", "someone", "something", "somewhere", "everyone", "everything", "everywhere", "nobody", "nothing", "nowhere", "else", "anybody", "somebody", "everybody", "nobody",
    # Personal pronouns
    "you", "your", "yours", "yourself", "myself", "himself", "herself", "itself", "ourselves", "themselves", "ours", "mine", "hers", "theirs",
    # Demonstrative pronouns
    "what", "which", "who", "whom", "whose", "whichever", "whoever", "whatever",
    # Prepositions and conjunctions
    "since", "until", "because", "although", "though", "unless", "whether", "while", "whereas", "whereby",
    # Quantity and degree
    "many", "much", "few", "little", "less", "more", "most", "some", "any", "each", "every", "either", "neither", "both", "all", "none",
    # Adverbs
    "really", "actually", "basically", "simply", "probably", "possibly", "perhaps", "maybe", "certainly", "definitely", "absolutely",
    # Common adverbs
    "always", "never", "often", "usually", "sometimes", "rarely", "hardly", "scarcely", "barely", "just", "only", "even", "still", "already", "yet", "soon", "already",
    # Time-related
    "ago", "yesterday", "today", "tomorrow", "now", "later", "earlier", "recently", "currently", "previously",
    # Common verbs (generic)
    "say", "said", "says", "get", "got", "gets", "go", "goes", "went", "gone", "come", "comes", "came", "make", "made", "makes", "take", "took", "takes", "see", "saw", "seen", "sees", "know", "knew", "known", "knows", "think", "thought", "thinks", "want", "wants", "wanted",
    # Reddit/common social media words
    "post", "posted", "posting", "share", "shared", "sharing", "comment", "comments", "commenting", "reply", "replies", "replied",
    # Footer/legal text
    "rights", "reserved", "copyright", "terms", "conditions", "privacy", "policy", "user", "users", "agreement", "license", "content", "service", "accessibility", "reddit", "inc", "company", "corporation", "choices", "skip", "main", "navigation",
    # Reddit-specific terms
    "account", "karma", "upvote", "downvote", "award", "mod", "moderator", "subreddit", "flair", "inadequate",
    # Language/country names
    "portuguese", "portugues", "brasil", "brazil", "espanol", "españa", "espana", "deutsch", "deutschland", "english", "french", "francais", "italian", "italiano",
    # UI/automated text
    "performed", "automatically", "please", "contact", "click", "continue", "thread", "subscribe", "unsubscribe", "follow", "reply", "report",
    # UI icons/images
    "icon", "img", "image", "photo", "video", "audio", "svg", "png", "jpg", "jpeg", "gif", "webp",
    # Code/implementation words
    "fixed", "fixing", "broken", "working", "works", "worked", "running", "runs", "ran", "implement", "implemented", "implementing",
}

# Generic/meaningless words to filter out
GENERIC_WORDS = {
    "code", "coding", "tool", "tools", "thing", "things", "stuff", "something", "nothing", "anything", "everything",
    "use", "used", "using", "problem", "problems", "issue", "issues", "help", "need", "needs", "want", "wants",
    "way", "time", "day", "people", "find", "look", "try", "trying", "makes", "make",
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "first", "second", "third", "last", "next", "previous",
    "like", "love", "hate", "dont", "doesnt", "wont", "cant", "cannot",
    "pretty", "much", "many", "more", "most", "less", "least", "very", "quite",
    "good", "great", "nice", "best", "better", "bad", "worse", "new", "old", "same",
    "different", "other", "another", "just", "only", "also", "even", "still", "back", "now",
    "then", "later", "soon", "today", "work", "play", "show", "tell", "keep", "give", "ask",
    "really", "actually", "basically", "simple", "simply", "easy", "hard", "difficult",
}

# System/technical field words to filter out
SYSTEM_WORDS = {
    "utc", "score", "id", "token", "class", "style", "href", "onclick", "onload", "onerror",
    "target", "rel", "type", "width", "height", "alt", "src", "srcset", "sizes", "data", "referrerpolicy",
    "loading", "decoding", "created", "updated", "deleted", "removed", "edited", "permalink", "num_comments",
    "author", "subreddit", "url", "title", "text", "content", "self", "this", "that", "these", "those",
}

# Contraction words
CONTRACTIONS = {
    "it's", "don't", "doesn't", "won't", "can't", "couldn't", "wouldn't", "shouldn't", "aren't",
    "isn't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", "i'm", "you're", "we're",
    "they're", "i've", "you've", "we've", "they've", "i'll", "you'll", "we'll", "they'll",
    "i'd", "you'd", "we'd", "they'd", "let's", "that's", "who's", "what's", "where's", "when's",
    # Individual parts of contractions
    "not", "cant", "dont", "wont", "isnt", "arent", "wasnt", "werent", "couldnt", "wouldnt", "shouldnt", "havent", "hasnt", "hadnt",
}


def extract_ngrams(text: str, n: int = 2) -> List[str]:
    """
    Extract n-grams from text.

    Args:
        text: Input text
        n: Size of n-gram (2 for bigram, 3 for trigram)

    Returns:
        List of n-gram phrases
    """
    words = text.lower().split()

    if len(words) < n:
        return []

    ngrams = []
    for i in range(len(words) - n + 1):
        # Join n consecutive words with underscore
        ngram = "_".join(words[i:i + n])
        ngrams.append(ngram)

    return ngrams


def is_valid_phrase(phrase: str) -> bool:
    """
    Check if a phrase is valid for topic extraction.

    Args:
        phrase: Phrase to validate

    Returns:
        True if valid, False otherwise
    """
    # Split to check individual words first (before product check to prevent "the_devvit" type issues)
    words = phrase.replace("_", " ").split()

    # Characters to strip from words
    strip_chars = ".,!?;:\"'()[]{}:-+/*=<>"

    # Filter out phrases with stopwords
    for word in words:
        word = word.strip(strip_chars)
        if word.lower() in STOPWORDS:
            return False

    # Filter out phrases with system words
    for word in words:
        if word.lower().strip(strip_chars) in SYSTEM_WORDS:
            return False

    # Filter out phrases with generic words
    for word in words:
        if word.lower().strip(strip_chars) in GENERIC_WORDS:
            return False

    # Filter out phrases with contractions
    for word in words:
        if word.lower().strip(strip_chars) in CONTRACTIONS:
            return False

    # Filter out phrases with very short words (< 3)
    for word in words:
        word = word.strip(strip_chars)
        if len(word) < 3:
            return False

    # Check if this is a known product - always allow (after basic validation)
    phrase_lower = phrase.lower().replace("_", " ")
    for product in KNOWN_PRODUCTS:
        if phrase_lower == product or product in phrase_lower:
            return True

    # Filter out date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
    if re.match(r'\d{4}-\d{2}-\d{2}', phrase) or re.match(r'\d{2}/\d{2}/\d{4}', phrase):
        return False

    # Filter out time patterns (HH:MM, HH:MM:SS)
    if re.match(r'\d{1,2}:\d{2}(:\d{2})?', phrase):
        return False

    # Filter out version patterns (e.g., "3.1 Pro", "2.0 Beta", etc.)
    phrase_lower = phrase.lower().replace("_", " ")
    # Only filter if the phrase has a version indicator like "pro", "beta", etc.
    if re.match(r'.*(\d+\.\d+|v\d+)\s+(pro|beta|alpha|rc|release|version)\b', phrase_lower):
        return False

    # Filter out footer/copyright patterns
    if re.match(r'.*(rights? reserved|copyright|privacy policy|terms of use|user agreement|all rights reserved).*', phrase, re.IGNORECASE):
        return False

    # Filter out language/country selection patterns (e.g., "(Brasil)", "(USA)", etc.)
    if re.match(r'.*\([^)]*(brasil|brazil|usa|uk|espana|deutsch|francais|italiano|english|china|japan|korea|india)[^)]*\).*', phrase, re.IGNORECASE):
        return False

    # Filter out UI icon/image patterns
    if re.match(r'.*(icon|img|image|photo|video|svg|png|jpg|jpeg|gif|webp).*', phrase, re.IGNORECASE):
        return False

    # Filter out subreddit path patterns (e.g., "r/Blackboxai", "r/ChatGPT", etc.)
    if re.match(r'.*[rR]/\w+.*', phrase):
        return False

    # Filter out UI/automated text patterns
    if re.match(r'.*(performed automatically|please contact|click here|subscribe now|report this|reply thread).*', phrase, re.IGNORECASE):
        return False

    # Filter out phrases with pure numbers or mostly numbers
    cleaned_phrase = phrase.replace("_", "").replace("-", "").replace(":", "")
    if re.match(r'^[\d_]+$', cleaned_phrase):
        return False

    # Filter out phrases with too many symbols
    symbol_count = sum(1 for c in phrase if c in ".,!?;:\"'()[]{}:-+/*=<>")
    if symbol_count > len(phrase) / 2:
        return False

    return True


def format_topic(phrase: str) -> str:
    """
    Format phrase for display.

    Args:
        phrase: Phrase with underscores

    Returns:
        Formatted phrase with spaces
    """
    formatted = phrase.replace("_", " ").title()
    # Fix common acronyms
    formatted = formatted.replace("Cli", "CLI")
    formatted = formatted.replace("Api", "API")
    formatted = formatted.replace("Sdk", "SDK")
    formatted = formatted.replace("Ux", "UX")
    formatted = formatted.replace("Ui", "UI")
    formatted = formatted.replace("Llm", "LLM")
    formatted = formatted.replace("Ai", "AI")
    return formatted


# Known product names/patterns to preserve and boost
KNOWN_PRODUCTS = {
    "github_copilot", "copilot", "cursor", "vscode", "visual_studio_code", "visual_studio",
    "chatgpt", "claude", "anthropic", "gemini", "gpt", "openai", "open_code", "antigravity_ai",
    "tabnine", "codeium", "replit", "replit_ai", "amazon_codewhisperer",
    "sourcegraph_cody", "cody", "blackbox_ai", "magic_dev", "devvit",
    "claude_opus", "claude_sonnet", "claude_haiku", "claude_3", "claude_3_5", "claude_4",
    "gpt_4", "gpt_3_5", "gpt_o1",
}


async def get_topics(mentions: List[Mention], top_n: int = 5) -> List[str]:
    """
    Extract trending topics from mentions using n-gram extraction.

    Args:
        mentions: List of Mention objects
        top_n: Number of top topics to return

    Returns:
        List of topic strings
    """
    import logging
    logger = logging.getLogger(__name__)

    if not mentions:
        logger.info("[TOPICS] No mentions provided")
        return []

    # Extract all text from mentions
    all_text = " ".join([mention.text or "" for mention in mentions])

    if not all_text.strip():
        logger.info("[TOPICS] No text content")
        return []

    # Debug: Show sample text
    logger.info(f"[TOPICS] Text sample (first 500 chars): {all_text[:500]}")
    print(f"[TOPICS] Text sample (first 500 chars): {all_text[:500]}")

    # Extract bigrams and trigrams
    bigrams = extract_ngrams(all_text, n=2)
    trigrams = extract_ngrams(all_text, n=3)

    # Combine and filter phrases
    all_phrases = bigrams + trigrams

    # Filter valid phrases
    valid_phrases = [phrase for phrase in all_phrases if is_valid_phrase(phrase)]

    # Count phrase frequency
    phrase_counts = Counter(valid_phrases)

    # Sort by frequency
    sorted_phrases = sorted(phrase_counts.items(), key=lambda x: x[1], reverse=True)

    # Debug: Show top 20 phrases (before filtering)
    logger.info(f"[TOPICS] Top 20 raw phrases: {sorted_phrases[:20]}")
    print(f"[TOPICS] Top 20 raw phrases (with underscores): {sorted_phrases[:20]}")

    # Extract top phrases as topics
    topics = []
    seen_phrases = set()

    for phrase, count in sorted_phrases:
        # Lower threshold for phrases, especially known products
        threshold = 1 if any(product in phrase.lower().replace("_", " ") for product in KNOWN_PRODUCTS) else 2
        if count >= threshold and phrase not in seen_phrases:
            formatted = format_topic(phrase)
            topics.append(formatted)
            seen_phrases.add(phrase)

        if len(topics) >= top_n:
            break

    # If we don't have enough phrases, supplement with high-value single words
    if len(topics) < top_n:
        words = all_text.lower().split()

        # Filter and count words
        valid_words = []
        for word in words:
            word = word.strip(".,!?;:\"'()[]{}")
            if word and len(word) >= 3:
                # Check if word is valid (not in stopwords, etc.)
                if (word not in STOPWORDS and
                    word.lower() not in SYSTEM_WORDS and
                    word.lower() not in GENERIC_WORDS and
                    word.lower() not in CONTRACTIONS):
                    valid_words.append(word)

        word_counts = Counter(valid_words)

        # Add top words to topics
        for word, count in sorted(word_counts.items(), key=lambda x: x[1], reverse=True):
            word_lower = word.lower()

            # Skip words already in topics (as part of phrases)
            if any(word_lower in topic.lower() for topic in topics):
                continue

            # Only include words that appear at least 3 times
            if count >= 3:
                topics.append(word.title())

            if len(topics) >= top_n:
                break

    logger.info(f"[TOPICS] Final topics: {topics}")
    print(f"[TOPICS] Final topics: {topics}")

    return topics[:top_n]


async def analyze_topic_trends(
    mentions: List[Mention]
) -> dict:
    """Analyze topic trends over time from mentions."""
    # MVP: Simple implementation
    return {
        "trends": [],
        "insights": "需要更多数据来分析趋势"
    }
