from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class XAccount(Base):
    """X平台账户监控"""
    __tablename__ = "x_accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关联用户
    user = relationship("User", back_populates="x_accounts")


class XMention(Base):
    """X平台提及记录"""
    __tablename__ = "x_mentions"

    id = Column(Integer, primary_key=True, index=True)
    x_account_id = Column(Integer, ForeignKey("x_accounts.id"), nullable=False)
    tweet_id = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    author_username = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sentiment_score = Column(Integer, default=0)  # 情感分数 -100到100
    sentiment_label = Column(String, default="neutral")  # positive, negative, neutral
    metadata = Column(JSON, nullable=True)  # 其他元数据

    # 关联X账户
    x_account = relationship("XAccount", back_populates="mentions")


class XTrend(Base):
    """X平台趋势话题"""
    __tablename__ = "x_trends"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    tweet_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata = Column(JSON, nullable=True)


class XInsight(Base):
    """X平台洞察报告"""
    __tablename__ = "x_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    mentions_count = Column(Integer, default=0)
    positive_count = Column(Integer, default=0)
    negative_count = Column(Integer, default=0)
    neutral_count = Column(Integer, default=0)
    avg_sentiment = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关联用户
    user = relationship("User", back_populates="x_insights")