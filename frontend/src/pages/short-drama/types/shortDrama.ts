/** Front-end draft types for Short Drama module (mock phase; not API-aligned). */

export type DurationOption = '30s' | '45s' | '60s';

export type ProjectFormat = 'single_ad' | 'series';

export type PlotStyle = 'twist' | 'conflict' | 'suspense' | 'comedy' | 'emotion';

export type VisualStyle = 'cinematic' | 'animation' | '3d' | 'premium_ad';

export type AspectRatioOption = '9:16' | '16:9';

export interface ShortDramaProjectDraft {
  projectName: string;
  duration: DurationOption;
  format: ProjectFormat;
  plotStyles: PlotStyle[];
  visualStyle: VisualStyle;
  aspectRatio: AspectRatioOption;
}

export interface ProductInputDraft {
  productName: string;
  category: string;
  brandName: string;
  targetMarkets: string[];
  targetUser: string;
  sellingPoints: string[];
  useScene: string;
  brandTone: string;
  extraNotes: string;
}

export type ParseStatus = 'idle' | 'parsing' | 'ready' | 'error';

export interface ProductPreviewSummary {
  summary: string;
  sellingPoints: string[];
  sceneKeywords: string[];
  styleKeywords: string[];
  status: ParseStatus;
  /** 当 status === 'error' 时展示 */
  errorMessage?: string;
}

export interface CapabilityCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Framer-style muted accent (hex), used for icon + tags */
  accentColor: string;
  tags: string[];
}

export interface WorkflowStepItem {
  id: string;
  num: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

export interface AudienceItem {
  id: string;
  title: string;
  description: string;
  /** Remix Icon class, e.g. ri-global-line */
  icon: string;
  accentColor: string;
  examples: string[];
}

/** AI 剧情蓝图（Story Blueprint 页） */
export interface StoryBlueprint {
  title: string;
  premise: string;
  hook: string;
  coreConflict: string;
  twist: string;
  resolution: string;
}

export interface SegmentPlanItem {
  id: number;
  /** 段落名，如 Hook / Conflict */
  title: string;
  /** 展示用副标题，如 Segment 1 */
  segmentLabel: string;
  duration: string;
  goal: string;
  productExposureMode: string;
  summary: string;
  accentColor: string;
  /** 轻量 tag，如 B2B 广告节奏 */
  tags?: string[];
}

export type AssetsTabId = 'characters' | 'scenes' | 'productAssets';

export interface MockCharacterAsset {
  id: string;
  name: string;
  roleType: string;
  description: string;
  /** 占位：本轮用纯色/渐变块，预留字段便于下轮接图 */
  imagePlaceholder: 'portrait' | 'square';
  voiceStyle?: string;
  traitTags?: string[];
}

export interface MockSceneAsset {
  id: string;
  name: string;
  sceneType: string;
  description: string;
  imagePlaceholder: 'landscape' | 'square';
}

export interface MockProductAsset {
  id: string;
  name: string;
  description: string;
  /** 镜头定位 / 在成片中的使用方式 */
  shotUse: string;
  imagePlaceholder: 'landscape' | 'square';
}

/** Assets 页：与 Framer 卡片字段对齐的视图模型（由 pipeline 适配） */
export type AssetsPageCharacterVm = {
  id: number;
  name: string;
  role: string;
  desc: string;
  tags: string[];
  voice: string;
  img: string | null;
  hasRealImage: boolean;
  visualPrompt: string;
};

export type AssetsPageSceneVm = {
  id: number;
  name: string;
  type: string;
  desc: string;
  img: string | null;
  hasRealImage: boolean;
  visualPrompt: string;
};

export type AssetsPageProductVm = {
  id: number;
  name: string;
  placement: string;
  cameraHint: string;
  desc: string;
  img: string | null;
  hasRealImage: boolean;
};

export type AssetsPageViewModel = {
  characters: AssetsPageCharacterVm[];
  scenes: AssetsPageSceneVm[];
  products: AssetsPageProductVm[];
};

/** 剧本大纲页侧栏：项目参数行 */
export interface StoryBlueprintSettingRow {
  label: string;
  value: string;
}

/** 剧本大纲页：全局叙事设定 */
export interface StoryBlueprintGlobalField {
  label: string;
  value: string;
}

/** 剧本大纲页：结构分析小块 */
export interface StoryBlueprintAnalysisItem {
  label: string;
  value: string;
  icon: string;
  color: string;
}

/** Framer step4：片段与镜头（片段视频页） */
export interface Step4Shot {
  id: number;
  desc: string;
  action: string;
  dialogue: string;
  emotion: string;
  duration: string;
  /** 结构化槽位（新数据或 pipeline 推断）；旧数据可能部分为空 */
  sceneDescription?: string;
  subjectDescription?: string;
  cameraDescription?: string;
  imagePrompt?: string;
  videoPrompt?: string;
}

export interface Step4SegmentItem {
  id: number;
  name: string;
  duration: string;
  goal: string;
  characters: string[];
  scene: string;
  placement: string;
  color: string;
  isNew?: boolean;
  shots: Step4Shot[];
  /** 后端 segment_id（如 seg_1），用于单段视频生成 */
  backendSegmentId?: string;
  /** pipeline 返回的相对或绝对地址，展示前需经 utils/shortDramaMedia.resolvePublicMediaUrl */
  videoUrl?: string | null;
}

export interface Step4RenderProgress {
  phase: string;
  phaseLabel: string;
  percent: number;
  currentShot: number;
  totalShots: number;
  totalFrames: number;
}

export type Step4VideoStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';
export type Step4VideoStatusMap = Record<number, Step4VideoStatus>;
export type Step4RenderProgressMap = Record<number, Step4RenderProgress>;
