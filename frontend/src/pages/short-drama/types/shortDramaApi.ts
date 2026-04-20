/** Short Drama REST API shapes (aligned with backend Pydantic schemas; JSON field names). */

export type ShortDramaProjectDto = {
  id: number;
  user_id: number;
  project_name: string;
  status: string;
  duration?: string | null;
  format?: string | null;
  style?: string | null;
  visual_style?: string | null;
  aspect_ratio?: string | null;
  last_active_step?: 'step_1' | 'step_2' | 'step_3' | 'step_4' | 'overview' | null;
  step_status?: Record<string, string>;
  overall_status?: 'draft' | 'stale' | 'generating' | 'completed' | null;
  final_video_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateShortDramaProjectResponseDto = {
  project: ShortDramaProjectDto;
};

export type ShortDramaProjectListResponseDto = {
  projects: ShortDramaProjectDto[];
};

export type ProjectEntryRedirectResponseDto = {
  project_id: number;
  redirect_to: string;
  reason: 'completed_overview' | 'last_active_step' | 'default_step_1';
};

export type TouchProjectStepBody = {
  step: 'step_1' | 'step_2' | 'step_3' | 'step_4' | 'overview';
  save_intent?: 'save_draft' | 'before_exit';
};

export type ProductInputPayload = {
  title?: string | null;
  brand?: string | null;
  description?: string | null;
  bullet_points?: string[] | null;
  price_hint?: string | null;
  audience?: string | null;
  selling_points?: string[] | null;
  image_urls?: string[] | null;
  extra?: Record<string, unknown> | null;
};

export type ProductContextDto = {
  product_name: string;
  category?: string;
  brand_name?: string;
  visual_features?: string[];
  core_features?: string[];
  selling_points?: string[];
  target_users?: string;
  usage_scenarios?: string[];
  brand_tone?: string;
  constraints?: string[];
  notes_for_story?: string;
  meta?: Record<string, unknown>;
};

export type ParseProductResponseDto = {
  record_id: number;
  project_id: number;
  version: number;
  raw_inputs: Record<string, unknown>;
  product_context: ProductContextDto;
  created_at?: string | null;
};

export type SegmentPlanItemDto = {
  segment_id?: string;
  goal?: string;
  duration_seconds?: number;
  story_beat?: string;
  summary?: string;
  product_exposure_mode?: string;
};

export type StoryBlueprintDto = {
  title?: string;
  format?: string;
  style?: string;
  premise?: string;
  hook?: string;
  core_conflict?: string;
  twist?: string;
  resolution?: string;
  segment_plan?: SegmentPlanItemDto[];
  meta?: Record<string, unknown>;
};

export type GenerateStoryResponseDto = {
  record_id: number;
  project_id: number;
  version: number;
  blueprint: StoryBlueprintDto;
  approved?: boolean;
  created_at?: string | null;
};

export type PipelineStoryBlueprintWrapper = {
  id?: number;
  version?: number;
  approved?: boolean;
  blueprint?: StoryBlueprintDto;
  created_at?: string | null;
};

/** GET /pipeline 中 assets 行（与后端 read_models 一致） */
export type PipelineCharacterAssetDto = {
  id: number;
  name: string;
  role_type: string;
  description: string;
  visual_prompt: string;
  image_url: string | null;
  meta: Record<string, unknown>;
};

export type PipelineSceneAssetDto = {
  id: number;
  name: string;
  scene_type: string;
  description: string;
  visual_prompt: string;
  image_url: string | null;
  meta: Record<string, unknown>;
};

export type PipelineProductAssetDto = {
  id: number;
  name: string;
  description: string;
  visual_prompt: string;
  image_url: string | null;
  meta: Record<string, unknown>;
};

export type PipelineAssetsBundleDto = {
  characters: PipelineCharacterAssetDto[];
  scenes: PipelineSceneAssetDto[];
  products: PipelineProductAssetDto[];
};

/** GET /pipeline 中的 product_context 块（与 project.py 一致：raw_inputs + normalized） */
export type PipelineProductContextBlockDto = {
  id?: number;
  version?: number;
  raw_inputs?: Record<string, unknown> | null;
  normalized?: ProductContextDto | Record<string, unknown> | null;
  created_at?: string | null;
};

/** GET /pipeline 中单条 segment_scripts（与 project.py seg_payload 一致） */
export type SegmentScriptPipelineRowDto = {
  id: number;
  segment_id: string;
  version?: number;
  script: Record<string, unknown>;
  video_url?: string | null;
  video_render?: Record<string, unknown> | null;
  created_at?: string | null;
  render_status?: string | null;
  render_job_id?: number | null;
  render_error?: string | null;
};

export type PipelineSummaryDto = {
  project: ShortDramaProjectDto;
  product_context?: PipelineProductContextBlockDto | null;
  story_blueprint?: PipelineStoryBlueprintWrapper | null;
  assets?: PipelineAssetsBundleDto | null;
  segment_scripts?: SegmentScriptPipelineRowDto[];
  final_video_url?: string | null;
  /** 后端推导：片段渲染中 / 待合成最终成片 / 最终合成中 / 完成 / 失败 */
  current_video_stage?: string | null;
  has_all_segment_videos?: boolean;
  has_final_video?: boolean;
  final_render_status?: string | null;
  final_render_error?: string | null;
  final_render_job_id?: number | null;
  image_url_filled?: number;
  asset_rows_total?: number;
};

export type VideoBatchSummaryResponseDto = {
  project_id: number;
  segments_attempted: number;
  segments_succeeded: number;
  errors: Record<string, unknown>[];
};

export type SingleSegmentVideoResponseDto = {
  project_id: number;
  segment_id: string;
  ok: boolean;
  status: string;
  progress: number;
  video_url?: string | null;
  render_job_id?: number | null;
  error?: string | null;
};

export type RenderJobStatusResponseDto = {
  job_id: number;
  project_id: number;
  segment_id: string;
  status: string;
  progress: number;
  video_url?: string | null;
  error?: string | null;
  request_id?: string | null;
};

export type MergeVideoResponseDto = {
  project_id: number;
  final_video_url: string;
};

/** POST /segment/generate */
export type GenerateSegmentScriptsResponseDto = {
  project_id: number;
  segments: unknown[];
  record_ids: number[];
};

export type GenerateAssetSpecsResponseDto = {
  project_id: number;
  assets: PipelineAssetsBundleDto;
};

/** POST /assets/images/generate */
export type AssetImageBatchResponseDto = {
  project_id: number;
  characters_attempted: number;
  characters_succeeded: number;
  scenes_attempted: number;
  scenes_succeeded: number;
  products_attempted: number;
  products_succeeded: number;
  errors: Record<string, unknown>[];
};

export type UpdateAssetBody = {
  project_id: number;
  name?: string;
  role_type?: string;
  scene_type?: string;
  description?: string;
  visual_prompt?: string;
  voice_style?: string;
  reference_image_data_url?: string;
  reference_image_name?: string;
  product_usage?: string;
};

export type UpdateAssetResponseDto = {
  project_id: number;
  asset_type: string;
  asset_id: number;
  stale_marked_step_4: boolean;
};

export type RegenerateOneAssetImageBody = {
  project_id: number;
  asset_type: 'character' | 'scene' | 'product';
  asset_id: number;
};

export type RegenerateOneAssetImageResponseDto = {
  project_id: number;
  asset_type: string;
  asset_id: number;
  image_url?: string | null;
  stale_marked_step_4: boolean;
};
