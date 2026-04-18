import type {
  PipelineSummaryDto,
  SegmentPlanItemDto,
  StoryBlueprintDto,
} from '../types/shortDramaApi';
import type {
  StoryBlueprintAnalysisItem,
  StoryBlueprintGlobalField,
  StoryBlueprintSettingRow,
} from '../types/shortDrama';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** pipeline.product_context.normalized */
export function getPipelineProductNormalized(
  pipeline: PipelineSummaryDto | null | undefined,
): Record<string, unknown> | null {
  const pc = pipeline?.product_context;
  const root = asRecord(pc);
  if (!root) return null;
  return asRecord(root['normalized']);
}

export function getPipelineStoryMeta(
  pipeline: PipelineSummaryDto | null | undefined,
): Record<string, unknown> | null {
  const bp = pipeline?.story_blueprint?.blueprint;
  const meta = asRecord(bp)?.['meta'];
  return asRecord(meta);
}

function formatStyleField(style: string | null | undefined): string {
  if (!style?.trim()) return '—';
  const s = style.trim();
  if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean).join(' · ');
  return s;
}

function extractMarket(
  normalized: Record<string, unknown> | null,
  pipeline: PipelineSummaryDto | null | undefined,
): string {
  if (normalized) {
    const tm = normalized['target_market'] ?? normalized['targetMarkets'];
    if (typeof tm === 'string' && tm.trim()) return tm.trim();
    if (Array.isArray(tm) && tm.length) return tm.map(String).join('、');
    const tu = normalized['target_users'];
    if (typeof tu === 'string' && tu.trim()) return tu.trim();
  }
  const raw = asRecord(pipeline?.product_context)?.['raw_inputs'] as Record<string, unknown> | undefined;
  const aud = raw?.['audience'];
  if (typeof aud === 'string' && aud.trim()) return aud.trim();
  const extra = asRecord(raw?.['extra']);
  const mk = extra?.['target_markets'] ?? extra?.['targetMarkets'];
  if (Array.isArray(mk) && mk.length) return mk.map(String).join('、');
  const meta = getPipelineStoryMeta(pipeline);
  const mm = meta?.['target_market'] ?? meta?.['market'];
  if (typeof mm === 'string' && mm.trim()) return mm.trim();
  return 'N/A';
}

function segmentPlanFromBlueprint(blueprint: StoryBlueprintDto | null | undefined): SegmentPlanItemDto[] {
  return blueprint?.segment_plan ?? [];
}

/** 叙事节奏标签：段数（左栏「叙事节奏」与右栏「叙事节奏」共用） */
export function deriveNarrativePaceLabel(planLen: number): string {
  if (planLen <= 2) return '慢';
  if (planLen === 3) return '标准';
  return '紧凑';
}

function deriveHookStrengthLabel(hook: string | undefined): string {
  const len = (hook ?? '').trim().length;
  if (len > 80) return '强';
  if (len > 40) return '中';
  return '弱';
}

function deriveAdDensityLabel(plan: SegmentPlanItemDto[]): string {
  if (plan.length === 0) return '低';
  const withExposure = plan.filter((p) => (p.product_exposure_mode ?? '').trim().length > 2);
  const ratio = withExposure.length / plan.length;
  if (withExposure.length >= 2 || ratio >= 0.5) return '高';
  if (withExposure.length === 1) return '中';
  return '低';
}

function deriveEmotionArcLabel(blueprint: StoryBlueprintDto | null | undefined): string {
  const c = (blueprint?.core_conflict ?? '').trim();
  const t = (blueprint?.twist ?? '').trim();
  if (c.length > 8 && t.length > 8) return '起伏明显';
  const premise = (blueprint?.premise ?? '').trim();
  const res = (blueprint?.resolution ?? '').trim();
  if (premise.length > 8 && res.length > 8 && c.length < 4 && t.length < 4) return '平滑';
  if (c.length > 8 || t.length > 8) return '单一转折';
  return '弱';
}

function deriveProtagonistHint(
  normalized: Record<string, unknown> | null,
  blueprint: StoryBlueprintDto | null | undefined,
): string {
  const tu = normalized?.['target_users'];
  if (typeof tu === 'string' && tu.trim()) return tu.trim().slice(0, 120);
  const notes = normalized?.['notes_for_story'];
  if (typeof notes === 'string' && notes.trim()) return notes.trim().slice(0, 120);
  const pn = normalized?.['product_name'];
  const premise = (blueprint?.premise ?? '').trim();
  if (premise.length > 10) {
    const head = premise.split(/[。！？\n]/)[0]?.trim() ?? premise.slice(0, 80);
    const prefix = typeof pn === 'string' && pn.trim() ? `${pn.trim()} · ` : '';
    return `${prefix}${head}`.slice(0, 120);
  }
  if (typeof pn === 'string' && pn.trim()) return `${pn.trim()}（受众与角色细节未解析）`;
  return '未定义';
}

function deriveCoreEmotionHint(blueprint: StoryBlueprintDto | null | undefined): string {
  const hook = blueprint?.hook ?? '';
  const conflict = blueprint?.core_conflict ?? '';
  const resolution = blueprint?.resolution ?? '';
  const blob = `${hook} ${conflict} ${resolution}`;
  const low = /孤独|迷茫|焦虑|失落|压抑|挫折|怀疑/.test(blob);
  const high = /自信|温暖|希望|惊喜|升华|释然|坚定/.test(blob);
  if (low && high) return '低谷 → 上扬';
  if (/冲突|对立|质疑|挣扎/.test(blob)) return '对立推进';
  if (high) return '正向情绪主导';
  if (low) return '压抑基调';
  return '情绪驱动';
}

function derivePovHint(blueprint: StoryBlueprintDto | null | undefined): string {
  const h = (blueprint?.hook ?? '').trim();
  if (/^(我|「我|‘我)/.test(h) || /\b我\b/.test(h.slice(0, 20))) return '第一人称倾向';
  return '第三人称';
}

function buildVerdict(params: {
  pace: string;
  hook: string;
  density: string;
  arc: string;
}): { title: string; body: string } {
  const chunks: string[] = [];
  if (params.pace === '紧凑') chunks.push('分段紧凑');
  else if (params.pace === '标准') chunks.push('节奏标准');
  else chunks.push('分段偏少、节奏偏慢');

  if (params.hook === '强') chunks.push('Hook 信息足');
  else if (params.hook === '中') chunks.push('Hook 中等');
  else chunks.push('Hook 偏短，可加强开头');

  if (params.density === '高') chunks.push('产品露出密度高');
  else if (params.density === '中') chunks.push('产品露出适中');
  else chunks.push('产品露出偏少');

  if (params.arc === '起伏明显') chunks.push('冲突与反转并存');
  else if (params.arc === '平滑') chunks.push('叙事较线性');
  else chunks.push('戏剧张力一般');

  const body = `${chunks.join('；')}。请结合投放目标微调各段时长与露出方式。`;
  return { title: '结构评估', body };
}

/**
 * 左侧：项目设置 + 全局设定（真实 pipeline + 可推导字段）
 */
export function buildStoryBlueprintLeftRailsFromPipeline(
  pipeline: PipelineSummaryDto | null | undefined,
): { settings: StoryBlueprintSettingRow[]; globalFields: StoryBlueprintGlobalField[] } {
  const p = pipeline?.project;
  const normalized = getPipelineProductNormalized(pipeline);
  const blueprint = pipeline?.story_blueprint?.blueprint ?? undefined;
  const plan = segmentPlanFromBlueprint(blueprint);
  const paceGlobal = deriveNarrativePaceLabel(plan.length);

  const settings: StoryBlueprintSettingRow[] = [
    { label: '时长', value: p?.duration?.trim() || '—' },
    { label: '形式', value: p?.format?.trim() || '—' },
    { label: '风格', value: formatStyleField(p?.style ?? null) },
    { label: '视觉', value: p?.visual_style?.trim() || '—' },
    { label: '比例', value: p?.aspect_ratio?.trim() || '—' },
    { label: '市场', value: extractMarket(normalized, pipeline) },
  ];

  const globalFields: StoryBlueprintGlobalField[] = [
    { label: '主角', value: deriveProtagonistHint(normalized, blueprint) },
    { label: '核心情绪', value: deriveCoreEmotionHint(blueprint) },
    { label: 'POV', value: derivePovHint(blueprint) },
    { label: '叙事节奏', value: paceGlobal },
  ];

  return { settings, globalFields };
}

/**
 * 右侧：结构分析 + 评估文案（由当前 blueprint 派生）
 */
export function deriveStoryStructureAnalysis(
  blueprint: StoryBlueprintDto | null | undefined,
): { items: StoryBlueprintAnalysisItem[]; verdictTitle: string; verdictBody: string } {
  if (!blueprint || Object.keys(blueprint).length === 0) {
    return {
      items: [
        { label: '叙事节奏', value: '—', icon: 'ri-pulse-line', color: '#B45309' },
        { label: '情绪弧线', value: '—', icon: 'ri-emotion-line', color: '#DC2626' },
        { label: '广告密度', value: '—', icon: 'ri-bar-chart-2-line', color: '#047857' },
        { label: 'Hook 强度', value: '—', icon: 'ri-star-line', color: '#B45309' },
      ],
      verdictTitle: '结构评估',
      verdictBody: '请先生成剧本，系统将基于 segment 与 Hook 文本生成简要结构分析。',
    };
  }

  const plan = segmentPlanFromBlueprint(blueprint);
  const pace = deriveNarrativePaceLabel(plan.length);
  const hookLabel = deriveHookStrengthLabel(blueprint.hook);
  const density = deriveAdDensityLabel(plan);
  const arc = deriveEmotionArcLabel(blueprint);

  const hookDisplay =
    hookLabel === '强' ? '强（文本充实）' : hookLabel === '中' ? '中' : '弱（可加长 Hook）';

  const items: StoryBlueprintAnalysisItem[] = [
    { label: '叙事节奏', value: pace, icon: 'ri-pulse-line', color: '#B45309' },
    { label: '情绪弧线', value: arc, icon: 'ri-emotion-line', color: '#DC2626' },
    { label: '广告密度', value: density, icon: 'ri-bar-chart-2-line', color: '#047857' },
    { label: 'Hook 强度', value: hookDisplay, icon: 'ri-star-line', color: '#B45309' },
  ];

  const { title, body } = buildVerdict({
    pace,
    hook: hookLabel,
    density,
    arc,
  });

  return { items, verdictTitle: title, verdictBody: body };
}

/**
 * 已进入故事生成及之后阶段：禁止再请求 story/generate（与后端编排一致）；
 * 不影响 pipeline 读取与页面展示。
 */
export const STORY_PIPELINE_LOCKED_STATUSES = new Set<string>([
  'story_generated',
  'asset_specs_generated',
  'assets_rendering',
  'assets_ready',
  'segments_generated',
  'video_rendering',
  'completed',
  'failed',
]);

export function isStoryPipelineLockedForRegenerate(pipeline: PipelineSummaryDto | null | undefined): boolean {
  const st = pipeline?.project?.status;
  if (!st) return false;
  return STORY_PIPELINE_LOCKED_STATUSES.has(st);
}

export const STORY_REGENERATE_LOCKED_TITLE =
  '当前版本已生成，如需重新生成需新建项目或联系管理员重置流程';
