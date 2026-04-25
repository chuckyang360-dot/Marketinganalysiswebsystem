from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ShotSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    shot_id: str = ""
    shot_type: str = ""
    scene_ref: str = ""
    character_refs: List[str] = Field(default_factory=list)
    visual_description: str = ""
    scene_description: str = ""
    subject_description: str = ""
    action_description: str = ""
    camera_description: str = ""
    dialogue: str = ""
    narration: str = ""
    emotion: str = ""
    duration_seconds: float = 0.0
    image_prompt: str = ""
    video_prompt: str = ""
    product_refs: List[str] = Field(default_factory=list)
    must_show: List[str] = Field(default_factory=list)
    must_avoid: List[str] = Field(default_factory=list)
    source_segment_id: str = ""
    source_selling_point: str = ""
    source_visual_constraints: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("duration_seconds", mode="before")
    @classmethod
    def _coerce_duration(cls, v: Any) -> float:
        if v is None or v == "":
            return 0.0
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0


class SegmentScriptSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    segment_id: str
    title: str = ""
    duration_limit: float = 0.0
    goal: str = ""
    shots: List[ShotSchema] = Field(default_factory=list)
    meta: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("duration_limit", mode="before")
    @classmethod
    def _coerce_limit(cls, v: Any) -> float:
        if v is None or v == "":
            return 0.0
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0


class GenerateSegmentsRequest(BaseModel):
    project_id: int


class GenerateSegmentsResponse(BaseModel):
    project_id: int
    segments: List[SegmentScriptSchema]
    record_ids: List[int] = Field(default_factory=list)
