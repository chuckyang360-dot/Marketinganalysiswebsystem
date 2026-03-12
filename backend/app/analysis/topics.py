"""
Topics Analysis Module

Extracts trending topics from mentions.
"""

from typing import List, Set
from ..providers.base import Mention
from pydantic import BaseModel


class TopicItem(BaseModel):
    """Single topic item."""
    keyword: str
    count: int


class TopicResult(BaseModel):
    """Result of topic analysis."""
    topics: List[str]
    total_topics: int


# 常用英文停用词 - 扩展版
STOPWORDS = {
    # 代词和冠词
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "had", "has", "have", "he", "her", "his", "i", "in", "is", "it", "its", "of", "on", "or", "she", "so", "that", "the", "their", "them", "there", "these", "they", "this", "those", "to", "was", "were", "will", "with",
    # 助动词
    "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "shall", "should", "will", "would", "could", "can", "may", "might", "must", "ought",
    # 其他常见停用词
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "than", "too", "very", "just", "also", "now", "here", "how", "why", "when", "where", "which", "while", "about", "up", "out", "down", "off", "over", "under", "again", "further", "then", "once", "new", "into", "through", "during", "before", "after", "above", "below", "between",
    # 人称代词扩展
    "you", "your", "yours", "yourself", "myself", "himself", "herself", "itself", "ourselves", "themselves", "ours", "mine", "hers", "theirs",
    # 指示代词
    "what", "which", "who", "whom", "whose", "whichever", "whoever", "whatever", "whatever",
    # 介词和连接词扩展
    "since", "until", "because", "although", "though", "unless", "whether", "while", "whereas", "whereby",
    # 数量和程度词
    "many", "much", "few", "little", "less", "more", "most", "some", "any", "each", "every", "either", "neither", "both", "all", "none",
    # 副词
    "really", "actually", "basically", "simply", "probably", "possibly", "perhaps", "maybe", "certainly", "definitely", "absolutely",
    # 常见副词
    "always", "never", "often", "usually", "sometimes", "rarely", "hardly", "scarcely", "barely", "just", "only", "even", "still", "already", "yet", "soon", "already",
    # 时间相关
    "ago", "yesterday", "today", "tomorrow", "now", "later", "earlier", "recently", "currently", "previously", "previously",
    # 常见动词
    "say", "said", "says", "get", "got", "gets", "go", "goes", "went", "gone", "come", "comes", "came", "make", "made", "makes", "take", "took", "takes", "see", "saw", "seen", "sees", "know", "knew", "known", "knows", "think", "thought", "thinks", "want", "wants", "wanted", "use", "uses", "used", "using",
    # 形容词
    "good", "bad", "nice", "great", "big", "small", "large", "little", "same", "different", "other", "another", "next", "last", "first", "second", "third",
    # 社交媒体特有停用词
    "reddit", "r/", "u/", "post", "comment", "thread", "link", "url", "http", "https", "www", "com", "net", "org", "edu", "gov",
    # 术语和平台词
    "ads", "ad", "advertisement", "spam", "bot", "nsfw", "edit", "update", "posted", "updated", "deleted", "removed",
    # 常见通用词
    "thing", "things", "stuff", "something", "nothing", "anything", "everything", "anything", "nothing",
    # 中文常见词（如果需要）
    "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这",
}


async def get_topics(mentions: List[Mention], top_n: int = 5) -> List[str]:
    """
    Extract trending topics from mentions.

    Args:
        mentions: List of Mention objects
        top_n: Number of top mentions to analyze
        limit: Maximum number of topics to return

    Returns:
            List of topic strings
    """
    if not mentions:
        return []

    # Extract keywords from mentions with filtering
    all_keywords = []
    for mention in mentions:
        words = mention.text.lower().split()
        # Filter out stopwords and short words
        for word in words:
            word = word.strip(".,!?;:\"'()[]{}")
            if word and len(word) >= 3 and word not in STOPWORDS:
                all_keywords.append(word)

    # Count keyword frequency
    keyword_counts = {}
    for keyword in all_keywords:
        keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1

    # Get top keywords
    sorted_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:top_n * 2]

    # Generate topic suggestions from top keywords
    topics = []
    seen_keywords = set()

    for keyword, count in sorted_keywords:
        if count >= 3 and keyword not in seen_keywords:
            # Skip words that are too generic
            generic_words = {
                "time", "way", "day", "people", "make", "get", "use", "need", "find", "look", "see", "go", "know", "think", "come",
                "post", "comment", "link", "reddit", "thread", "title", "text", "content", "page", "site", "web",
                "year", "month", "week", "hour", "minute", "second",
                "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
                "first", "second", "third", "last", "next", "previous",
                "like", "love", "hate", "dont", "doesnt", "wont", "cant",
                "really", "actually", "basically", "pretty", "very", "quite",
                "much", "many", "more", "most", "less", "least",
                "good", "great", "nice", "best", "better", "bad", "worse",
                "new", "old", "same", "different", "other", "another",
                "just", "only", "also", "even", "still", "already",
                "back", "now", "then", "later", "soon", "today",
                "want", "need", "try", "take", "give", "tell", "ask",
                "work", "play", "help", "show", "tell", "keep",
            }
            if keyword not in generic_words:
                topic = f"{keyword}: 被 {count} 次讨论"
                topics.append(topic)
                seen_keywords.add(keyword)

        if len(topics) >= top_n:
            break

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
