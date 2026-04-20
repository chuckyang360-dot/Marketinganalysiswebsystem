from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CharacterAssetSchema(BaseModel):
    id: Optional[int] = None
    name: str
    role_type: str
    description: Optional[str] = None
    visual_prompt: Optional[str] = None
    image_url: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)


class SceneAssetSchema(BaseModel):
    id: Optional[int] = None
    name: str
    scene_type: str
    description: Optional[str] = None
    visual_prompt: Optional[str] = None
    image_url: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)


class ProductAssetSchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    visual_prompt: Optional[str] = None
    image_url: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)


class AssetSpecsBundleSchema(BaseModel):
    characters: List[CharacterAssetSchema] = Field(default_factory=list)
    scenes: List[SceneAssetSchema] = Field(default_factory=list)
    products: List[ProductAssetSchema] = Field(default_factory=list)


class GenerateAssetSpecsRequest(BaseModel):
    project_id: int


class GenerateAssetSpecsResponse(BaseModel):
    project_id: int
    assets: AssetSpecsBundleSchema


class GenerateAssetImagesRequest(BaseModel):
    project_id: int


class AssetImageBatchResponse(BaseModel):
    project_id: int
    characters_attempted: int = 0
    characters_succeeded: int = 0
    scenes_attempted: int = 0
    scenes_succeeded: int = 0
    products_attempted: int = 0
    products_succeeded: int = 0
    errors: List[Dict[str, Any]] = Field(default_factory=list)


class UpdateAssetRequest(BaseModel):
    project_id: int
    name: Optional[str] = None
    role_type: Optional[str] = None
    scene_type: Optional[str] = None
    description: Optional[str] = None
    visual_prompt: Optional[str] = None
    voice_style: Optional[str] = None
    reference_image_data_url: Optional[str] = None
    reference_image_name: Optional[str] = None
    product_usage: Optional[str] = None


class UpdateAssetResponse(BaseModel):
    project_id: int
    asset_type: str
    asset_id: int
    stale_marked_step_4: bool = True


class RegenerateOneAssetImageRequest(BaseModel):
    project_id: int
    asset_type: str
    asset_id: int


class RegenerateOneAssetImageResponse(BaseModel):
    project_id: int
    asset_type: str
    asset_id: int
    image_url: Optional[str] = None
    stale_marked_step_4: bool = True
