"""
Alerts Detection Module

Identifies risks and issues from mentions across all platforms.
Uses keyword-based detection with configurable thresholds.
"""

from typing import List, Dict
from collections import defaultdict, Counter
from ..providers.base import Mention
from pydantic import BaseModel


class AlertLevel:
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"


class AlertItem(BaseModel):
    """Single alert item."""
    level: str
    message: str
    count: int
    affected_users: List[str]


class AlertResult(BaseModel):
    """Result of alerts analysis."""
    alerts: List[AlertItem]
    total_alerts: int


async def detect_alerts(mentions: List[Mention]) -> List[AlertItem]:
    """
    Detect alerts from mentions using keyword-based analysis.

    Args:
        mentions: List of Mention objects

    Returns:
        List of Alert objects
    """
    if not mentions:
        return []

    alerts = []
    # Track users involved in alerts
    alert_users = defaultdict(set)

    # Define detection patterns
    detection_patterns = {
        AlertLevel.CRITICAL: [
            ("scam", ["scam", "fraud", "fake", "phishing", "cheat", "诈骗", "欺诈", "假"]),
            ("hate_speech", ["hate", "racist", "offensive", "歧视", "仇恨"]),
            ("legal_risk", ["lawsuit", "illegal", "regulation", "compliance", "诉讼", "违法", "合规"]),
        ],
        AlertLevel.HIGH: [
            ("complaint", ["complaint", "bug", "broken", "error", "crash", "投诉", "故障", "错误", "崩溃"]),
            ("negative_surge", ["hate", "terrible", "worst", "awful", "讨厌", "糟糕", "垃圾"]),
            ("security", ["hack", "breach", "leak", "vulnerability", "黑客", "泄露", "漏洞"]),
        ],
        AlertLevel.WARNING: [
            ("concern", ["concern", "worried", "uncertain", "confused", "担心", "不确定", "困惑"]),
            ("price_issue", ["expensive", "overpriced", "too costly", "昂贵", "贵", "价格高"]),
            ("service_issue", ["slow", "delay", "wait", "unresponsive", "慢", "延迟", "等待", "无响应"]),
        ],
    }

    # Analyze each mention
    for mention in mentions:
        text = mention.text.lower()
        author = mention.author_username or mention.author or "unknown"

        # Check each pattern level
        for level, patterns in detection_patterns.items():
            for alert_type, keywords in patterns:
                if any(keyword in text for keyword in keywords):
                    alert_users[(level, alert_type)].add(author)

    # Generate alert messages
    alert_messages = {
        (AlertLevel.CRITICAL, "scam"): "检测到潜在的欺诈或虚假信息风险",
        (AlertLevel.CRITICAL, "hate_speech"): "检测到仇恨言论或不当内容",
        (AlertLevel.CRITICAL, "legal_risk"): "检测到潜在的法律或合规风险",
        (AlertLevel.HIGH, "complaint"): "检测到大量用户投诉或功能问题",
        (AlertLevel.HIGH, "negative_surge"): "检测到强烈的负面情绪",
        (AlertLevel.HIGH, "security"): "检测到潜在的安全问题",
        (AlertLevel.WARNING, "concern"): "检测到用户普遍存在疑虑",
        (AlertLevel.WARNING, "price_issue"): "检测到关于价格的负面反馈",
        (AlertLevel.WARNING, "service_issue"): "检测到服务质量问题",
    }

    # Create alerts from detected patterns
    for (level, alert_type), users in alert_users.items():
        count = len(users)
        if count > 0:  # Only create alert if there are affected users
            message = alert_messages.get((level, alert_type), f"检测到 {alert_type} 相关问题")
            alerts.append(
                AlertItem(
                    level=level,
                    message=message,
                    count=count,
                    affected_users=list(users)[:5]  # Limit to first 5 users
                )
            )

    # Sort alerts by severity
    severity_order = {AlertLevel.CRITICAL: 0, AlertLevel.HIGH: 1, AlertLevel.WARNING: 2, AlertLevel.INFO: 3}
    alerts.sort(key=lambda x: severity_order.get(x.level, 99))

    return alerts[:10]  # Limit to top 10 alerts


def _check_pattern(text: str, pattern: str) -> bool:
    """
    Check if text matches a pattern using regex.

    Deprecated: Kept for backward compatibility but no longer used.
    """
    import re
    try:
        return bool(re.search(pattern, text, re.IGNORECASE))
    except re.error:
        return False
