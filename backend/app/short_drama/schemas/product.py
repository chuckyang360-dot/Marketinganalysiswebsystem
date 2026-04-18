from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductInputSchema(BaseModel):
    """Raw product material for parsing (text + optional image URLs)."""

    title: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    bullet_points: Optional[List[str]] = None
    price_hint: Optional[str] = None
    audience: Optional[str] = None
    selling_points: Optional[List[str]] = None
    image_urls: Optional[List[str]] = Field(
        default=None, description="Remote image URLs or placeholders"
    )
    extra: Optional[Dict[str, Any]] = None


class ProductContextSchema(BaseModel):
    """Normalized product context stored as normalized_context_json (Phase 2 shape)."""

    model_config = ConfigDict(extra="ignore")

    product_name: str
    category: str = ""
    brand_name: str = ""
    visual_features: List[str] = Field(default_factory=list)
    core_features: List[str] = Field(default_factory=list)
    selling_points: List[str] = Field(default_factory=list)
    target_users: str = ""
    usage_scenarios: List[str] = Field(default_factory=list)
    brand_tone: str = ""
    constraints: List[str] = Field(default_factory=list)
    notes_for_story: str = ""
    meta: Dict[str, Any] = Field(default_factory=dict)


class ParseProductRequest(BaseModel):
    project_id: int
    input: ProductInputSchema


class ParseProductResponse(BaseModel):
    record_id: int
    project_id: int
    version: int
    raw_inputs: Dict[str, Any]
    product_context: ProductContextSchema
    created_at: Optional[datetime] = None
