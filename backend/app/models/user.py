from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import hashlib
import secrets


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # OAuth相关字段
    google_id = Column(String, unique=True, nullable=True)

    # 关联关系
    x_accounts = relationship("XAccount", back_populates="user")
    x_insights = relationship("XInsight", back_populates="user")

    def set_password(self, password: str):
        """设置密码哈希"""
        salt = secrets.token_hex(16)
        self.password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()

    def verify_password(self, password: str) -> bool:
        """验证密码"""
        salt = self.password_hash[:32]
        stored_hash = self.password_hash[32:]
        new_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return new_hash == stored_hash