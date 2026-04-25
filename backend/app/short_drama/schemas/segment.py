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
    manual_video_prompt: str = ""
    product_refs: List[str] = Field(default_factory=list)
    manual_character_refs: List[str] = Field(default_factory=list)
    manual_scene_ref: str = ""
    manual_product_refs: List[str] = Field(default_factory=list)
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


class UpdateSegmentShotRequest(BaseModel):
    project_id: int
    segment_title: Optional[str] = None
    segment_goal: Optional[str] = None
    duration_limit: Optional[float] = None
    action_description: Optional[str] = None
    dialogue: Optional[str] = None
    voiceover: Optional[str] = None
    emotion: Optional[str] = None
    video_prompt: Optional[str] = None
    must_show: Optional[List[str]] = None
    must_avoid: Optional[List[str]] = None
    duration_seconds: Optional[float] = None
    manual_character_refs: Optional[List[str]] = None
    manual_scene_ref: Optional[str] = None
    manual_product_refs: Optional[List[str]] = None
    manual_video_prompt: Optional[str] = None


class UpdateSegmentShotResponse(BaseModel):
    project_id: int
    segment_id: str
    shot_id: str
    segment: Dict[str, Any]
    shot: Dict[str, Any]
    needs_regeneration: bool = True
