from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func

from ...database import Base


class CharacterAsset(Base):
    __tablename__ = "short_drama_character_assets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("short_drama_projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    role_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    visual_prompt = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    meta_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SceneAsset(Base):
    __tablename__ = "short_drama_scene_assets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("short_drama_projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    scene_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    visual_prompt = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    meta_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProductAsset(Base):
    __tablename__ = "short_drama_product_assets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("short_drama_projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    visual_prompt = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    meta_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
