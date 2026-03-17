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
    # Chinese stopwords (Chinese words to filter)
    "还是", "年", "约为", "可以", "会", "没有", "有", "在", "这", "那", "这个", "那个", "的", "了", "和", "与", "或", "但是", "而且", "因为", "所以", "如果", "那么", "对于", "关于", "以及", "并且",
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

    # Filter out phrases with very short words (< 2) - relaxed from < 3 to < 2
    for word in words:
        word = word.strip(strip_chars)
        if len(word) < 2:
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

    # Filter out fragmented number patterns with comma/semicolon at end
    # E.g., "约为 ,000；", "000；" (broken salary figures)
    # Only filter if the phrase ends with punctuation + number
    phrase_stripped = phrase.replace("_", " ").strip()
    if re.match(r'.*[，;]\s*\d+[，;.。；]?$', phrase_stripped):
        return False

    # Filter out phone number fragments (e.g., "+65 6601")
    if re.match(r'^\+\d+\s+\d+', phrase_stripped):
        return False

    # Filter out phrases starting with year + Chinese comma (year fragments)
    # E.g., "2034 年，电子商务", "年，电子商务"
    if re.match(r'^\d+\s*年[，]', phrase_stripped) or re.match(r'^年[，]', phrase_stripped):
        return False

    # Filter out phrases with only Chinese fillers + punctuation + number
    # E.g., "平均年薪约为 ,000；" (broken salary figure)
    if re.match(r'.*约为.*[,，].*\d+[，;.。；]?$', phrase_stripped):
        return False

    # Filter out sentence fragments starting with Chinese connecting words
    # E.g., "及软件公司", "而且在生成式" (starting mid-sentence)
    if re.match(r'^(及|而且|但是|因此|所以|另外|同时|如果|或者)', phrase_stripped):
        return False

    # Filter out long sentence fragments with punctuation in the middle
    # E.g., "AI 从硅谷席卷全球的这两年，软件产业也最先被" (full sentence fragment)
    if phrase_stripped.count('，') > 1 or phrase_stripped.count(',') > 1:
        return False

    # Filter out phrases with apostrophe fragments (broken contractions)
    # E.g., "Here'S", "Don'T", "Player'S Choice", "Tiktok Shop'S", "Tony Hawk'S"
    # Check in both phrase format (with underscores) and stripped format (with spaces)
    if "'" in phrase:
        # Check for apostrophe followed by capital letter (indicates broken contraction)
        # This pattern catches: "Player'S_Choice", "Shop'S", "Hawk'S"
        if re.search(r"[A-Za-z]+'[A-Z]", phrase):  # With underscores
            return False
        if re.search(r"[A-Za-z]+'[A-Z]", phrase_stripped):  # With spaces
            return False
        # Also filter phrases ending with 's (apostrophe + s)
        if phrase.lower().endswith("_'s"):
            return False
        if phrase_stripped.lower().endswith("'s"):
            return False

    # Filter out patterns that are just symbols (no alphanumeric content)
    # E.g., "—— ——", "----"
    if not re.search(r'[a-zA-Z0-9\u4e00-\u9fff]', phrase):
        return False

    # Filter out number + direction fragments (e.g., "3223 North", "4152 East")
    # These are typically location coordinates, not topics
    if re.match(r'^\d+\s+(North|South|East|West|Northeast|Southeast|Northwest|Southwest)(\s|$)', phrase_stripped, re.IGNORECASE):
        return False

    # Filter out direction + geographic name fragments (e.g., "North Ocean", "South Pacific")
    if re.match(r'^(North|South|East|West)\s+(Ocean|Pacific|Atlantic|Indian|Sea|Lake|Coast|Shore|Region|Area|Stream|Gulf)$', phrase_stripped, re.IGNORECASE):
        return False

    # Filter out fragmented platform/brand names - ONLY single words
    # E.g., single "Tik", "Tok" words are fragments, but "Tiktok Shop" is valid
    words = phrase_stripped.lower().split()
    if len(words) == 1:
        word = words[0]
        if word in ['tik', 'tok']:
            return False
    # Also filter 2-word phrases that are just fragments like "Tik Tok"
    elif len(words) == 2:
        if sorted(words) == sorted(['tik', 'tok']):
            return False
        if sorted(words) == sorted(['tok', 'shop']):
            return False

    # Filter out navigation and UI words (single words)
    # But only if the phrase is ONLY these words (not part of valid topic)
    if len(words) == 1:
        word = words[0]
        if word.lower() in ['shop', 'seller', 'center', 'shipping', 'benefits', 'program', 'read', 'level', 'free', 'offer']:
            return False
    # Filter phrases that are navigation words repeated (e.g., "Free Shipping Free", "Level Free Level")
    if len(words) > 1:
        nav_words = {'shop', 'seller', 'center', 'shipping', 'benefits', 'program', 'read', 'level', 'free', 'offer'}
        # If more than half the words are navigation words, reject
        nav_count = sum(1 for w in words if w.lower() in nav_words)
        if nav_count > len(words) / 2:
            return False

    # Filter out question fragments (ending with ?)
    if phrase_stripped.endswith('?'):
        return False

    # Filter out URL fragments and navigation words
    # E.g., "If You'Re", "Shop Seller", "Seller Center", "Car China.Com."
    if re.match(r'^(If You|If You\'|You\'|Shop Seller|Seller Center|Sign Up|Log In|View Plans|Back To|Skip To|Go To)', phrase_stripped, re.IGNORECASE):
        return False

    # Filter out domain fragments and URL-like patterns
    # E.g., "Car China.Com.", "China.Com. Retrieved"
    if re.match(r'.*\.(com|org|net|io|co|ai|app|site)\.*', phrase_stripped, re.IGNORECASE):
        return False

    # Filter out product structure fields and table headers (NEW)
    # E.g., "Name Description", "Description Condition", "Condition Notes", "Sold Cib", "Cover Art"
    # Match single words starting with these terms
    if re.match(r'^(Name|Description|Condition|Notes|Cover|Sold|Cib|Games|Art|Acceptable|Included|Greatest|Hits|Misc)\b', phrase_stripped, re.IGNORECASE):
        return False

    # Filter out generic navigation/template phrases (NEW)
    # E.g., "Top Posts", "Our Tiktok", "If You're", "Shop Seller"
    generic_nav_patterns = [
        r'^top\s+posts$',
        r'^our\s+tiktok',
        r'^if\s+you\'re',
        r'^shop\s+seller$',
        r'^sold\s+cib$',
        r'^cover\s+art$',
        r'^name\s+description$',
        r'^description\s+condition$',
        r'^condition\s+notes$',
        r'^cib\s+acceptable$',
        r'^games\s+name$',
        r'^greatest\s+hits$',
        r'^misc\s*\(\s*games\s*\)',
    ]
    for pattern in generic_nav_patterns:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out patterns with parentheses containing noise
    if re.search(r'\([^)]*\)', phrase_stripped):
        return False

    # Filter out game-related content and user names (NEW)
    # E.g., "Super Mario", "Dave Mirra", "Mirra Freestyle", "Xiaomi 15", "Xiaomi 17"
    game_user_patterns = [
        r'^super\s+(mario|marioland|smash|bros|kart|world)\b',
        r'^mario\s+(kart|world|bros|party|golf)\b',
        r'^dave\s+mirra',
        r'^mirra\s+freestyle',
        r'^\w+\s+\d+\s*$',  # Product numbers like "Xiaomi 15", "Xiaomi 17"
    ]
    for pattern in game_user_patterns:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out platform fragments and product accessories (NEW)
    # E.g., "Club Nintendo", "Nintendo Insert", "Mi Tv", "Galaxy Watch", "Smoke Damage"
    platform_fragments = [
        r'^club\s+(nintendo|sony|xbox|playstation)\b',
        r'^(nintendo|sony|xbox|playstation)\s+insert\b',
        r'^(mi|xiaomi|poco|su7)\s+(tv|watch|band|pad|pro|ultra|max)\b',
        r'^\w+\s+insert\b',
        r'^smoke\s+damage\b',
    ]
    for pattern in platform_fragments:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out sports/games content and product accessories (NEW)
    # E.g., "Poor Smoke", "Freestyle Bmx", "Nba Live", "Player's Choice", "X7 Pro", "Tv Box"
    sports_game_patterns = [
        r'^poor\s+(smoke|damage|shot|putt|golf|tennis|basketball)\b',
        r'^\w+\s+(bmx|skate|snowboard|surf|ski)\b',
        r'^(nba|nfl|mlb|nhl|fifa|uefa)\s+(live|game|score|news)\b',
        r'^players\s+(choice|rank|stats|card)\b',
        r'^(freestyle|pro\s+|ultra\s+|max\s+)\s+(bmx|skate|skateboard|snowboard|surf|ski)\b',
        r'^(mi|xiaomi|poco|su7)\s+(pro|ultra|max|box|band|case|cover|screen)\b',
        r'^(tv|box)\s+\w+\b',
    ]
    for pattern in sports_game_patterns:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out platform-specific phrases (NEW)
    # E.g., "Join Our", "Our Discord", "Shop-Level Free", "3D", "Discord"
    platform_patterns = [
        r'^(Join|Our)\s+(Our|Server|Group|Chat|Discord|Community|Club|Channel)\b',
        r'^(Discord|Telegram|Slack)\s+\w+\b',
        r'^\w+\s+(Discord|Telegram|Slack|Group|Channel)\b',
        r'^Shop[\s\-]*(Level|Level\s*\-*\s*Free|Center|Affiliate|Global|Agency|Live|Seller)\b',
        r'^Our\s+\$\w+\b',  # "Our $100K+" type patterns
        r'^My\s+(Shop|Tiktok|Store|Market|Discord|Channel|Group)\b',
        r'^Your\s+(Shop|Tiktok|Store|Market|Discord)\b',
        r'^Player[\'’]?\s+Choice\b',
        r'^\w+\s+3D\b',
    ]
    for pattern in platform_patterns:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out generic phrases with "Sell" prefix (NEW)
    # E.g., "Sell My", "Sell Your", "Sell My Car"
    if re.match(r'^(Sell|Sell\s+(My|Your|Our|This))\b', phrase_stripped, re.IGNORECASE):
        return False
    # Also filter "Sell My" at the end (e.g., "Car China.Com Sell My")
    if phrase_stripped.lower().endswith('sell my'):
        return False

    # Filter out username-like patterns (mixed case + numbers)
    # E.g., "Chapulintacos13 3Mo", "WonderWhyhow", "Chapulintacos13", "Noalvin 1d"
    # Check both phrase (underscores) and phrase_stripped (spaces)
    if re.search(r'\d+', phrase) or re.search(r'\d+', phrase_stripped):
        # Pattern: "Chapulintacos13_3Mo" - ends with short abbreviation after number
        if re.match(r'^[a-zA-Z]+\d+_[A-Z][a-z]+$', phrase):
            return False
        # Pattern: "Noalvin_1d" - word + number + short abbreviation (username pattern)
        if re.match(r'^[a-zA-Z]+\d+_[a-z]+$', phrase):
            return False
        # Pattern: "Poor_Case_1d" etc - general word + number + short word
        if re.match(r'^[a-zA-Z]+\d+_[a-z]+$', phrase):
            return False
        # Check if this looks like a username (mix of numbers and capital letters in non-standard places)
        words = phrase_stripped.split()
        # Pattern: "Chapulintacos13 3Mo" - ends with short abbreviation
        if len(words) == 2 and re.search(r'\d+', words[0]) and len(words[1]) <= 4:
            return False
        # Pattern: Both words have numbers (username with numbers)
        if len(words) == 2 and re.search(r'\d+', words[0]) and re.search(r'\d+', words[1]):
            return False
        # Pattern: Single word with number + capital (e.g., "Chapulintacos13")
        if len(words) == 1 and re.search(r'\d+[A-Z]', words[0]):
            return False
        # Check for patterns like "WonderWhyhow" (multiple consecutive capital letters in non-standard places)
        if re.search(r'[a-z][A-Z]{3,}[a-z]', phrase_stripped):
            return False

    # Filter out generic time/month phrases
    # E.g., "Month Tiktok", "Average Speed"
    generic_time_patterns = [
        r'^Month\s+\w+\b',
        r'^Average\s+\w+\b',
        r'^Daily\s+\w+\b',
        r'^Weekly\s+\w+\b',
        r'^Monthly\s+\w+\b',
        r'^Yearly\s+\w+\b',
        r'^Speed\s*$',
    ]
    for pattern in generic_time_patterns:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out UI/automated text patterns (NEW)
    # E.g., "Promoted Developers", "My Car", "Shop Growth"
    ui_patterns = [
        r'^Promoted\s+\w+',
        r'^My\s+(Car|Shop|Store|Tiktok|App|Account)',
        r'^Shop\s+Growth\b',
        r'^Growth\s+System\b',
        r'^System\s+We\b',
        r'^Chinese\s+Xiaomi\b',
        r'^Chinese\s+\w+$',
        r'^Discuss\s+\w+$',
        r'^Codex\s+\w+$',
        r'^Developers\s+\w+$',
        r'^Sd\s+Card\b',
        r'^Micro\s+Sd\b',
        r'^Expand\s+\w+$',
        r'^Poor\s+Case\b',
        r'^Player\'s\s+Choice\b',
    ]
    for pattern in ui_patterns:
        if re.match(pattern, phrase_stripped, re.IGNORECASE):
            return False

    # Filter out repeated patterns (e.g., "Su7 Xiaomi Su7")
    words = phrase_stripped.lower().split()
    if len(words) >= 3 and len(set(words)) < len(words):
        return False

    # Filter out phrases with too many symbols or starting/ending with symbols
    symbol_count = sum(1 for c in phrase if c in ".,!?;:\"'()[]{}:-+/*=<>")
    if symbol_count > len(phrase) / 2:
        return False
    # Filter phrases that start with symbol (e.g., '"xiaomi_su7', '(something')
    if phrase and phrase[0] in ".,!?;:\"'()[]{}:-+/*=<>":
        return False
    # Filter phrases that have symbols at non-standard positions
    # E.g., "2025)._"xiaomi" has symbols in the middle that look like noise
    if re.search(r'^[^a-zA-Z_]+[a-zA-Z_]+', phrase):
        return False
    # Filter phrases ending with symbols (e.g., "Tiktok Shop,", "Xiaomi Su7.")
    if phrase_stripped and phrase_stripped[-1] in ".,!?;:\"'()[]{}:-+/*=<>":
        return False

    # Filter out phrases with emoji or non-ASCII characters
    if re.search(r'[^\x00-\x7F]+', phrase):
        return False

    # Filter out Chinese text with only filler words
    # E.g., "还是", "年，电子商务" (year + topic fragment)
    chinese_chars = sum(1 for c in phrase if '\u4e00' <= c <= '\u9fff')
    if chinese_chars > 0 and chinese_chars == len(phrase.replace("_", " ").strip()):
        # If phrase is only Chinese characters and very short (< 3 chars), filter out
        if chinese_chars < 3:
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
    # Split by underscore and capitalize each word properly
    words = phrase.split("_")
    formatted = " ".join([w.capitalize() for w in words])
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
                    # Also filter words that start with symbols (e.g., '"Xiaomi')
                    if word and word[0] in ".,!?;:\"'()[]{}:-+/*=<>":
                        continue
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

    # Clean up topics - remove low quality and noise topics
    cleaned_topics = clean_topics(topics[:top_n])

    logger.info(f"[TOPICS] Final topics: {cleaned_topics}")
    print(f"[TOPICS] Final topics: {cleaned_topics}")

    return cleaned_topics


def clean_topics(topics: List[str]) -> List[str]:
    """
    Clean up topics by removing low-quality and noise topics.

    Args:
        topics: List of topic strings

    Returns:
        List of cleaned topic strings
    """
    # Only filter obvious noise: question fragments
    # Topics have already passed is_valid_phrase, so we keep most of them
    cleaned = []
    for topic in topics:
        # Filter out question fragments (ending with ?)
        if topic.endswith('?'):
            continue
        cleaned.append(topic)

    # If cleaning removes too many topics, return original list
    # This preserves valid topics from over-filtering
    if len(cleaned) < len(topics) / 2:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"[TOPICS] clean_topics filtered too aggressively ({len(cleaned)}/{len(topics)}). Using original topics.")
        return topics

    return cleaned


async def analyze_topic_trends(
    mentions: List[Mention]
) -> dict:
    """Analyze topic trends over time from mentions."""
    # MVP: Simple implementation
    return {
        "trends": [],
        "insights": "需要更多数据来分析趋势"
    }
