from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SegmentPlanItemSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    segment_id: str = ""
    goal: str = ""
    duration_seconds: float = 0.0
    story_beat: str = ""
    summary: str = ""
    product_exposure_mode: str = ""

    @field_validator("duration_seconds", mode="before")
    @classmethod
    def _coerce_duration(cls, v: Any) -> float:
        if v is None or v == "":
            return 0.0
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0


class StoryBlueprintSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = ""
    format: str = ""
    style: str = ""
    premise: str = ""
    hook: str = ""
    core_conflict: str = ""
    twist: str = ""
    resolution: str = ""
    segment_plan: List[SegmentPlanItemSchema] = Field(default_factory=list)
    meta: Dict[str, Any] = Field(default_factory=dict)


class GenerateStoryRequest(BaseModel):
    project_id: int


class GenerateStoryResponse(BaseModel):
    record_id: int
    project_id: int
    version: int
    blueprint: StoryBlueprintSchema
    approved: bool = False
    created_at: Optional[datetime] = None
