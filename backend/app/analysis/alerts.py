"""
Alerts Detection Module

Identifies risks and issues from mentions across all platforms.
"""

from typing import List
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
    Detect alerts from mentions.

    Args:
        mentions: List of Mention objects

    Returns:
            List of Alert objects
    """
    alerts = []

    # Detection rules
    rules = [
        {
            "type": "negative_spam",
            "pattern": "多次提及 + 短时间差",
            "level": AlertLevel.HIGH,
            "message": "检测到潜在的负面提及刷屏行为"
        },
        {
            "type": "brand_risk",
            "pattern": "大量负面评价",
            "level": AlertLevel.CRITICAL,
            "message": "品牌声誉受到严重威胁"
        },
        {
            "type": "complaint_spike",
            "pattern": "包含投诉或投诉关键词",
            "level": AlertLevel.HIGH,
            "message": "检测到用户投诉或监管风险"
        },
        {
            "type": "volume_surge",
            "pattern": "提及量突然激增",
            "level": AlertLevel.WARNING,
            "message": "提及量异常增长，需关注是否有公关事件"
        }
    ]

    for mention in mentions:
        for rule in rules:
            if _check_pattern(mention.text, rule["pattern"]):
                alert = AlertItem(
                    level=rule["level"],
                    message=rule["message"],
                    count=1,
                    affected_users=[mention.author_username] if mention.author_username else []
                )
                alerts.append(alert)

    return alerts


def _check_pattern(text: str, pattern: str) -> bool:
    """Check if text matches a pattern."""
    import re
    try:
        return bool(re.search(pattern, text, re.IGNORECASE))
    except re.error:
        return False
