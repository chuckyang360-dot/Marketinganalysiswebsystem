import {
  getAssetThumbnailUrl,
} from './assetsPageAdapters';
import { resolvePublicMediaUrl } from './shortDramaMedia';
import type { Step4SegmentItem, Step4Shot, Step4VideoStatus, Step4VideoStatusMap } from '../types/shortDrama';
import type {
  PipelineAssetsBundleDto,
  PipelineSummaryDto,
  SegmentScriptPipelineRowDto,
} from '../types/shortDramaApi';

const SEGMENT_COLORS = ['#B45309', '#DC2626', '#047857', '#334155', '#9333EA', '#0F766E'];

function workflowDisplayName(name: string): string {
  const raw = String(name || '').trim();
  if (!raw) return raw;
  const map: Record<string, string> = {
    bedroom: '卧室',
    'home gym': '家庭健身房',
    kitchen: '厨房',
    office: '办公室',
    street: '街道',
    park: '公园',
    'young male lead': '年轻男主',
  };
  return map[raw.toLowerCase()] || raw;
}

export type StepFourAssetLibraryVm = {
  characters: {
    id: number;
    name: string;
    role: string;
    desc: string;
    img: string | null;
    visualPrompt: string;
    imageSource: string;
    voice: string;
    meta: Record<string, unknown>;
  }[];
  scenes: {
    id: number;
    name: string;
    type: string;
    desc: string;
    img: string | null;
    visualPrompt: string;
    imageSource: string;
    sceneForm?: string | null;
    meta: Record<string, unknown>;
  }[];
  products: {
    id: number;
    name: string;
    type: string;
    desc: string;
    img: string | null;
    visualPrompt: string;
    imageSource: string;
    meta: Record<string, unknown>;
  }[];
};

function metaRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function pickString(meta: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = meta[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function stringifyLine(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(stringifyLine).filter(Boolean).join('\n');
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const speaker = typeof row.speaker === 'string'
      ? row.speaker.trim()
      : typeof row.role === 'string'
        ? row.role.trim()
        : typeof row.character === 'string'
          ? row.character.trim()
          : '';
    const text = stringifyLine(row.text ?? row.line ?? row.dialogue ?? row.content);
    if (speaker && text) return `${speaker}：${text}`;
    return text;
  }
  return '';
}

function imageSourceLabel(img: string | null, anchorId?: number | null): string {
  if (!img) return '未生成图片';
  return anchorId ? `视觉锚点 #${anchorId}` : '资产库图片';
}

export function pipelineAssetsToStepFourLibraryVm(
  assets: PipelineAssetsBundleDto | null | undefined,
): StepFourAssetLibraryVm {
  if (!assets) return { characters: [], scenes: [], products: [] };

  const characters = assets.characters.map((c) => {
    const meta = metaRecord(c.meta);
    return {
      id: c.id,
      name: workflowDisplayName(c.name),
      role: c.role_type?.trim() || '角色',
      desc: (c.description ?? '').trim(),
      img: getAssetThumbnailUrl(c),
      visualPrompt: (c.visual_prompt ?? '').trim(),
      imageSource: imageSourceLabel(getAssetThumbnailUrl(c), c.visual_anchor_image_id),
      voice: pickString(meta, ['voice_style', 'voiceStyle', 'voice']) || '未指定',
      meta,
    };
  });

  const scenes = assets.scenes.map((s) => ({
    id: s.id,
    name: workflowDisplayName(s.name),
    type: s.scene_type?.trim() || '场景',
    desc: (s.description ?? '').trim(),
    img: getAssetThumbnailUrl(s),
    visualPrompt: (s.visual_prompt ?? '').trim(),
    imageSource: imageSourceLabel(getAssetThumbnailUrl(s), s.visual_anchor_image_id),
    sceneForm: s.scene_form,
    meta: metaRecord(s.meta),
  }));

  const products = assets.products.map((p) => {
    const meta = metaRecord(p.meta);
    return {
      id: p.id,
      name: workflowDisplayName(p.name),
      type: p.product_role?.trim() || pickString(meta, ['product_type', 'productType', 'type']) || '产品',
      desc: (p.description ?? '').trim(),
      img: getAssetThumbnailUrl(p),
      visualPrompt: (p.visual_prompt ?? '').trim(),
      imageSource: imageSourceLabel(getAssetThumbnailUrl(p), p.visual_anchor_image_id),
      meta,
    };
  });

  return { characters, scenes, products };
}

export function resolveStepFourVideoLanguage(pipeline: PipelineSummaryDto | null | undefined): string | null {
  const rows = pipeline?.segment_scripts ?? [];
  for (const row of rows) {
    const script = row.script && typeof row.script === 'object' ? (row.script as Record<string, unknown>) : {};
    const meta = script.meta && typeof script.meta === 'object' ? (script.meta as Record<string, unknown>) : {};
    const lp = meta.language_policy && typeof meta.language_policy === 'object'
      ? (meta.language_policy as Record<string, unknown>)
      : {};
    const v = lp.video_language;
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
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
    backendShotId: 'shot_1',
    desc: '—',
    action: '',
    dialogue: '',
    emotion: '',
    duration: '—',
    durationSeconds: 0,
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
    const stringArray = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : undefined);
    const sourceVisualConstraints =
      s.source_visual_constraints && typeof s.source_visual_constraints === 'object' && !Array.isArray(s.source_visual_constraints)
        ? (s.source_visual_constraints as Record<string, unknown>)
        : undefined;
    const dialogue = stringifyLine(s.dialogue);
    const voiceover = stringifyLine(s.voiceover) || stringifyLine(s.narration);
    const legacyDialogue =
      stringifyLine(s.spoken_line) ||
      stringifyLine(s.caption) ||
      stringifyLine(s.dialogue_lines) ||
      stringifyLine(s.lines) ||
      stringifyLine(s.script);
    const displayDialogue = dialogue || voiceover || legacyDialogue;

    return {
      id: i + 1,
      backendShotId:
        (typeof s.shot_id === 'string' && s.shot_id.trim()) ||
        (typeof s.shot_id === 'number' ? String(s.shot_id) : '') ||
        `shot_${i + 1}`,
      desc,
      action: typeof s.action_description === 'string' ? s.action_description : '',
      dialogue: displayDialogue,
      voiceover,
      dialogueSource: dialogue ? 'dialogue' : voiceover ? 'voiceover' : undefined,
      emotion: typeof s.emotion === 'string' ? s.emotion : '',
      duration: durationStr,
      durationSeconds:
        typeof dur === 'number' && Number.isFinite(dur)
          ? dur
          : typeof dur === 'string' && Number.isFinite(Number(dur))
            ? Number(dur)
            : 0,
      sceneDescription,
      subjectDescription,
      cameraDescription,
      imagePrompt,
      videoPrompt,
      manualVideoPrompt:
        typeof s.manual_video_prompt === 'string' && s.manual_video_prompt.trim()
          ? s.manual_video_prompt.trim()
          : undefined,
      characterRefs: stringArray(s.character_refs),
      manualCharacterRefs: stringArray(s.manual_character_refs),
      sceneRef: typeof s.scene_ref === 'string' && s.scene_ref.trim() ? s.scene_ref.trim() : undefined,
      manualSceneRef:
        typeof s.manual_scene_ref === 'string' && s.manual_scene_ref.trim() ? s.manual_scene_ref.trim() : undefined,
      productRefs: stringArray(s.product_refs),
      manualProductRefs: stringArray(s.manual_product_refs),
      mustShow: stringArray(s.must_show),
      mustAvoid: stringArray(s.must_avoid),
      sourceSegmentId: typeof s.source_segment_id === 'string' ? s.source_segment_id : undefined,
      sourceSellingPoint: typeof s.source_selling_point === 'string' ? s.source_selling_point : undefined,
      sourceVisualConstraints,
      executionInput:
        s.execution_input && typeof s.execution_input === 'object' && !Array.isArray(s.execution_input)
          ? (s.execution_input as Record<string, unknown>)
          : undefined,
      promptBudget:
        s.prompt_budget && typeof s.prompt_budget === 'object' && !Array.isArray(s.prompt_budget)
          ? (s.prompt_budget as Record<string, unknown>)
          : undefined,
      providerError: typeof s.provider_error === 'string' ? s.provider_error : undefined,
      providerResponse:
        s.provider_response && typeof s.provider_response === 'object' && !Array.isArray(s.provider_response)
          ? (s.provider_response as Record<string, unknown>)
          : undefined,
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
    backendRecordId: row.id,
    name: title,
    duration,
    durationLimit:
      typeof durLimit === 'number' && Number.isFinite(durLimit)
        ? durLimit
        : typeof durLimit === 'string' && Number.isFinite(Number(durLimit))
          ? Number(durLimit)
          : 0,
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
