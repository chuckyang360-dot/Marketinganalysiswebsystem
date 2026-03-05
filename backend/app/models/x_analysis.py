from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from ..database import Base


class XTask(Base):
    """X分析任务"""
    __tablename__ = "x_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False)  # 关联用户邮箱
    keyword = Column(String, nullable=False)  # 分析关键词
    status = Column(String, default="pending")  # pending, running, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # 分析结果
    total_mentions = Column(Integer, default=0)
    positive_count = Column(Integer, default=0)
    negative_count = Column(Integer, default=0)
    neutral_count = Column(Integer, default=0)

    # 存储原始数据
    raw_data = Column(JSON, nullable=True)  # 存储从agent获取的原始数据
    analysis_summary = Column(Text, nullable=True)  # 分析摘要


class XSearchResult(Base):
    """X搜索结果"""
    __tablename__ = "x_search_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, nullable=False)  # 关联任务
    tweet_id = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 情感分析
    sentiment_score = Column(Integer, default=0)  # -100 到 100
    sentiment_label = Column(String, default="neutral")  # positive, negative, neutral

    # 元数据
    metadata = Column(JSON, nullable=True)  # 其他相关信息