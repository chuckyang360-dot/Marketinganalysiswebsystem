import {
  ASSETS_PLACEHOLDER_CHAR,
  resolveAssetImageUrl,
} from './assetsPageAdapters';
import { resolvePublicMediaUrl } from './shortDramaMedia';
import type { Step4SegmentItem, Step4Shot, Step4VideoStatus, Step4VideoStatusMap } from '../types/shortDrama';
import type {
  PipelineAssetsBundleDto,
  PipelineSummaryDto,
  SegmentScriptPipelineRowDto,
} from '../types/shortDramaApi';

const SEGMENT_COLORS = ['#B45309', '#DC2626', '#047857', '#334155', '#9333EA', '#0F766E'];

export type StepFourAssetLibraryVm = {
  characters: { name: string; role: string; img: string }[];
  scenes: { name: string; type: string }[];
  products: { name: string; type: string }[];
};

export function pipelineAssetsToStepFourLibraryVm(
  assets: PipelineAssetsBundleDto | null | undefined,
): StepFourAssetLibraryVm {
  if (!assets) return { characters: [], scenes: [], products: [] };

  const characters = assets.characters.map((c) => {
    const { src } = resolveAssetImageUrl(c.image_url, ASSETS_PLACEHOLDER_CHAR);
    return { name: c.name, role: c.role_type?.trim() || '角色', img: src };
  });

  const scenes = assets.scenes.map((s) => ({
    name: s.name,
    type: s.scene_type?.trim() || '场景',
  }));

  const products = assets.products.map((p) => ({
    name: p.name,
    type: '产品',
  }));

  return { characters, scenes, products };
}

function segmentRowVideoUrl(row: SegmentScriptPipelineRowDto): string | null {
  const top = row.video_url;
  const vr = row.video_render;
  const nested =
    vr && typeof vr === 'object' && 'video_url' in vr ? (vr as { video_url?: unknown }).video_url : undefined;
  const raw = top ?? (typeof nested === 'string' ? nested : null);
  return raw?.trim() || null;
}

function sortSegmentRows(rows: SegmentScriptPipelineRowDto[]): SegmentScriptPipelineRowDto[] {
  return [...rows].sort((a, b) => {
    const na = parseInt(String(a.segment_id).replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(String(b.segment_id).replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });
}

const EMPTY_SHOT_PLACEHOLDER: Step4Shot[] = [
  {
    id: 1,
    desc: '—',
    action: '',
    dialogue: '',
    emotion: '',
    duration: '—',
  },
];

function scriptShotsToStep4Shots(script: Record<string, unknown>): Step4Shot[] {
  const shots = script.shots;
  if (!Array.isArray(shots) || shots.length === 0) return EMPTY_SHOT_PLACEHOLDER.map((s) => ({ ...s }));

  return shots.map((raw, i) => {
    const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const dur = s.duration_seconds;
    let durationStr = '—';
    if (typeof dur === 'number' && Number.isFinite(dur)) durationStr = `${dur}s`;
    else if (typeof dur === 'string' && dur.trim()) durationStr = dur.trim();

    const desc =
      (typeof s.visual_description === 'string' && s.visual_description.trim()) ||
      (typeof s.action_description === 'string' && s.action_description.trim()) ||
      `镜头 ${i + 1}`;

    const sceneDescription =
      typeof s.scene_description === 'string' && s.scene_description.trim()
        ? s.scene_description.trim()
        : undefined;
    const subjectDescription =
      typeof s.subject_description === 'string' && s.subject_description.trim()
        ? s.subject_description.trim()
        : undefined;
    const cameraDescription =
      typeof s.camera_description === 'string' && s.camera_description.trim()
        ? s.camera_description.trim()
        : undefined;
    const imagePrompt =
      typeof s.image_prompt === 'string' && s.image_prompt.trim() ? s.image_prompt.trim() : undefined;
    const videoPrompt =
      typeof s.video_prompt === 'string' && s.video_prompt.trim() ? s.video_prompt.trim() : undefined;

    return {
      id: i + 1,
      desc,
      action: typeof s.action_description === 'string' ? s.action_description : '',
      dialogue:
        (typeof s.dialogue === 'string' && s.dialogue) ||
        (typeof s.narration === 'string' && s.narration) ||
        '',
      emotion: typeof s.emotion === 'string' ? s.emotion : '',
      duration: durationStr,
      sceneDescription,
      subjectDescription,
      cameraDescription,
      imagePrompt,
      videoPrompt,
    };
  });
}

/** 仅从 pipeline 行构建片段 VM，不使用任何商品/剧情 mock 兜底 */
export function segmentScriptDtoToStepSegmentViewModel(
  row: SegmentScriptPipelineRowDto,
  index: number,
): Step4SegmentItem {
  const script = row.script && typeof row.script === 'object' ? row.script : {};
  const uiId = index + 1;
  const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

  const title =
    (typeof script.title === 'string' && script.title.trim()) || `片段 ${uiId}`;
  const goal = (typeof script.goal === 'string' && script.goal.trim()) || '—';
  const durLimit = script.duration_limit;
  let duration = '—';
  if (typeof durLimit === 'number' && durLimit > 0) duration = `${durLimit}s`;
  else if (typeof durLimit === 'string' && durLimit.trim()) duration = durLimit.trim();

  const shots = scriptShotsToStep4Shots(script);

  return {
    id: uiId,
    name: title,
    duration,
    goal,
    characters: [],
    scene: '—',
    placement: '—',
    color,
    isNew: false,
    shots,
    backendSegmentId: row.segment_id,
    videoUrl: segmentRowVideoUrl(row),
  };
}

export function finalVideoAvailabilityFromPipeline(pipeline: PipelineSummaryDto | null): {
  hasFinal: boolean;
  url: string | null;
} {
  if (!pipeline) return { hasFinal: false, url: null };
  const u = resolvePublicMediaUrl(pipeline.final_video_url);
  return { hasFinal: !!u, url: u };
}

export function stepFourVideoStatusFromSegments(segments: Step4SegmentItem[]): Step4VideoStatusMap {
  const m: Step4VideoStatusMap = {};
  for (const s of segments) {
    const has = !!resolvePublicMediaUrl(s.videoUrl);
    m[s.id] = has ? 'completed' : 'idle';
  }
  return m;
}

export type StepFourPipelineViewModel = {
  coreSegments: Step4SegmentItem[];
  videoStatusFromPipeline: Step4VideoStatusMap;
  canMergeAll: boolean;
  projectStatus: string;
  currentVideoStage?: string | null;
  hasAllSegmentVideos?: boolean;
  hasFinalVideo?: boolean;
  finalRenderStatus?: string | null;
  finalRenderError?: string | null;
  finalVideoUrl?: string | null;
};

/** 无 segment_scripts 时返回空 coreSegments，禁止用假片段冒充真实数据 */
export function pipelineToStepFourViewModel(pipeline: PipelineSummaryDto | null): StepFourPipelineViewModel {
  const rowsRaw = pipeline?.segment_scripts;
  const rows: SegmentScriptPipelineRowDto[] = Array.isArray(rowsRaw)
    ? rowsRaw.filter((r): r is SegmentScriptPipelineRowDto => r != null && typeof r === 'object' && 'segment_id' in r)
    : [];

  if (rows.length === 0) {
    return {
      coreSegments: [],
      videoStatusFromPipeline: {},
      canMergeAll: false,
      projectStatus: pipeline?.project?.status ?? '',
      currentVideoStage: pipeline?.current_video_stage,
      hasAllSegmentVideos: pipeline?.has_all_segment_videos,
      hasFinalVideo: pipeline?.has_final_video,
      finalRenderStatus: pipeline?.final_render_status,
      finalRenderError: pipeline?.final_render_error,
      finalVideoUrl: pipeline?.final_video_url,
    };
  }

  const sorted = sortSegmentRows(rows);
  const coreSegments = sorted.map((row, index) => segmentScriptDtoToStepSegmentViewModel(row, index));

  const videoStatusFromPipeline = stepFourVideoStatusFromSegments(coreSegments);
  for (let i = 0; i < sorted.length; i += 1) {
    const row = sorted[i];
    const uiSegId = coreSegments[i]?.id;
    if (!uiSegId) continue;
    const st = String(row.render_status || '').toLowerCase();
    if ((coreSegments[i].videoUrl || '').trim()) {
      videoStatusFromPipeline[uiSegId] = 'completed';
      continue;
    }
    if (st === 'failed') videoStatusFromPipeline[uiSegId] = 'failed';
    else if (st === 'running') videoStatusFromPipeline[uiSegId] = 'running';
    else if (st === 'queued' || st === 'pending') videoStatusFromPipeline[uiSegId] = 'queued';
  }
  const allUrlsLocal =
    coreSegments.length > 0 && coreSegments.every((s) => !!resolvePublicMediaUrl(s.videoUrl));
  const canMergeAll =
    pipeline?.has_all_segment_videos === true || allUrlsLocal;

  return {
    coreSegments,
    videoStatusFromPipeline,
    canMergeAll,
    projectStatus: pipeline?.project?.status ?? '',
    currentVideoStage: pipeline?.current_video_stage,
    hasAllSegmentVideos: pipeline?.has_all_segment_videos ?? allUrlsLocal,
    hasFinalVideo: pipeline?.has_final_video,
    finalRenderStatus: pipeline?.final_render_status,
    finalRenderError: pipeline?.final_render_error,
    finalVideoUrl: pipeline?.final_video_url,
  };
}

export function mergeVideoStatus(
  base: Step4VideoStatusMap,
  overrides: Partial<Record<number, Step4VideoStatus>>,
): Step4VideoStatusMap {
  const out: Step4VideoStatusMap = { ...base };
  for (const [key, val] of Object.entries(overrides)) {
    if (val !== undefined) out[Number(key)] = val;
  }
  return out;
}

/** True when segment videos were produced by dev mock (ffmpeg testsrc / legacy mock), not real provider output. */
export function pipelineUsesMockTestPatternVideo(pipeline: PipelineSummaryDto | null | undefined): boolean {
  const rows = pipeline?.segment_scripts;
  if (!Array.isArray(rows) || rows.length === 0) return false;
  for (const row of rows) {
    const vr = row.video_render;
    if (!vr || typeof vr !== 'object') continue;
    const o = vr as Record<string, unknown>;
    if (o.provider === 'mock') return true;
    const model = o.model;
    if (model === 'mock-ffmpeg' || model === 'mock-embedded-fallback') return true;
    const meta = o.meta;
    if (meta && typeof meta === 'object') {
      const m = (meta as Record<string, unknown>).model;
      if (m === 'mock-ffmpeg' || m === 'mock-embedded-fallback') return true;
    }
  }
  return false;
}
