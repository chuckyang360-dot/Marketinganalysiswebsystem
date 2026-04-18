import type { ProductInputDraft, ProductPreviewSummary } from '../types/shortDrama';
import type { ProductContextDto, ProductInputPayload, StoryBlueprintDto } from '../types/shortDramaApi';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** 将 pipeline / DB 中的 raw_inputs 还原为表单草稿（与 mapDraftToProductInputPayload 互逆，尽力而为）。 */
export function pipelineRawInputsToDraft(raw: unknown): ProductInputDraft | null {
  const o = asRecord(raw);
  if (!o) return null;
  const extra = asRecord(o.extra) ?? {};

  const title = typeof o.title === 'string' ? o.title : '';
  const brand = typeof o.brand === 'string' ? o.brand : '';
  const description = typeof o.description === 'string' ? o.description : '';

  let category = typeof extra.category === 'string' ? extra.category : '';
  let useScene = '';
  if (description.includes(' · ')) {
    const parts = description.split(' · ');
    if (!category) category = parts[0]?.trim() ?? '';
    useScene = parts.slice(1).join(' · ').trim();
  } else {
    useScene = description.trim();
  }

  const bulletsRaw = o.bullet_points ?? o.selling_points;
  const sellingPoints = Array.isArray(bulletsRaw)
    ? bulletsRaw.map((x) => String(x)).filter((x) => x.length > 0)
    : [];

  const audience = typeof o.audience === 'string' ? o.audience : '';
  let targetMarkets: string[] = [];
  let targetUser = '';
  if (audience.includes(' | ')) {
    const [m, ...rest] = audience.split(' | ');
    const u = rest.join(' | ');
    if (m?.startsWith('市场：')) {
      targetMarkets = m
        .replace(/^市场：/, '')
        .split('、')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    targetUser = u.trim();
  } else {
    targetUser = audience.trim();
  }

  const tmExtra = extra.target_markets ?? extra.targetMarkets;
  if (Array.isArray(tmExtra) && tmExtra.length) {
    targetMarkets = tmExtra.map((x) => String(x)).filter(Boolean);
  }

  const brandTone = typeof extra.brand_tone === 'string' ? extra.brand_tone : '';
  const extraNotes = typeof extra.extra_notes === 'string' ? extra.extra_notes : '';

  const hasAnything =
    title.trim() ||
    brand.trim() ||
    category.trim() ||
    useScene.trim() ||
    sellingPoints.length ||
    targetMarkets.length ||
    targetUser.trim() ||
    brandTone.trim() ||
    extraNotes.trim();

  if (!hasAnything) return null;

  return {
    productName: title,
    category,
    brandName: brand,
    targetMarkets,
    targetUser,
    sellingPoints,
    useScene,
    brandTone,
    extraNotes,
  };
}

/** Map create-project form → POST /project body fields (duration/format/style/visual/aspect already strings on backend). */
export function mapDraftToProductInputPayload(draft: ProductInputDraft): ProductInputPayload {
  const descParts = [draft.category?.trim(), draft.useScene?.trim()].filter(Boolean);
  const audienceParts = [
    draft.targetMarkets.length ? `市场：${draft.targetMarkets.join('、')}` : '',
    draft.targetUser?.trim() || '',
  ].filter(Boolean);

  return {
    title: draft.productName.trim() || undefined,
    brand: draft.brandName.trim() || undefined,
    description: descParts.length ? descParts.join(' · ') : undefined,
    bullet_points: draft.sellingPoints.length ? draft.sellingPoints : undefined,
    audience: audienceParts.length ? audienceParts.join(' | ') : undefined,
    selling_points: draft.sellingPoints.length ? draft.sellingPoints : undefined,
    image_urls: [],
    extra: {
      category: draft.category,
      brand_tone: draft.brandTone,
      extra_notes: draft.extraNotes,
    },
  };
}

/**
 * ProductContext (normalized) → InfoPreviewPanel model.
 * Graceful degradation when arrays empty.
 */
export function productContextToPreview(ctx: ProductContextDto): ProductPreviewSummary {
  const summaryParts = [
    ctx.product_name,
    ctx.category,
    ctx.brand_name,
    ctx.target_users,
    ctx.brand_tone,
    ctx.notes_for_story,
  ].filter(Boolean);
  const summary =
    summaryParts.length > 0
      ? summaryParts.join(' · ')
      : '解析完成，但摘要字段较少；可在左侧补充产品描述后重试解析。';

  const sellingPoints = [...(ctx.selling_points ?? []), ...(ctx.core_features ?? [])].filter(Boolean);
  const sceneKeywords = [...(ctx.usage_scenarios ?? []), ...(ctx.visual_features ?? [])].filter(Boolean);
  const styleKeywords: string[] = [];
  if (ctx.brand_tone) styleKeywords.push(ctx.brand_tone);
  if (ctx.constraints?.length) styleKeywords.push(...ctx.constraints);
  if (ctx.meta && typeof ctx.meta.style_tags === 'object' && Array.isArray(ctx.meta.style_tags)) {
    styleKeywords.push(...(ctx.meta.style_tags as string[]).filter((x) => typeof x === 'string'));
  }

  return {
    summary,
    sellingPoints: sellingPoints.length ? sellingPoints : ctx.core_features?.length ? ctx.core_features : ['—'],
    sceneKeywords: sceneKeywords.length ? sceneKeywords : ['—'],
    styleKeywords: styleKeywords.length ? styleKeywords : ['—'],
    status: 'ready',
  };
}

export function normalizedJsonToProductPreview(norm: unknown): ProductPreviewSummary | null {
  if (!norm || typeof norm !== 'object') return null;
  const o = norm as Record<string, unknown>;
  if (typeof o.product_name !== 'string' || !o.product_name.trim()) return null;
  return productContextToPreview(o as ProductContextDto);
}

const SEGMENT_COLORS = ['#B45309', '#DC2626', '#047857', '#334155', '#9333EA', '#0F766E'];

export type StoryBlueprintPageScriptVm = {
  title: string;
  premise: string;
  hook: string;
  conflict: string;
  twist: string;
  resolution: string;
};

export type StoryBlueprintPageSegmentVm = {
  id: number;
  name: string;
  goal: string;
  duration: string;
  productPlacement: string;
  synopsis: string;
  color: string;
};

export type StoryBlueprintPageViewModel = {
  script: StoryBlueprintPageScriptVm;
  segments: StoryBlueprintPageSegmentVm[];
};

function formatSegmentDuration(seconds: number | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return '—';
  if (seconds >= 60) {
    const s = Math.round(seconds);
    return `${s}s`;
  }
  return `~${Math.round(seconds)}s`;
}

export function storyBlueprintDtoToPageView(dto: StoryBlueprintDto | undefined | null): StoryBlueprintPageViewModel {
  const b = dto ?? {};
  const script: StoryBlueprintPageScriptVm = {
    title: b.title?.trim() || '未命名剧本',
    premise: b.premise?.trim() || '—',
    hook: b.hook?.trim() || '—',
    conflict: (b.core_conflict ?? '').trim() || '—',
    twist: b.twist?.trim() || '—',
    resolution: b.resolution?.trim() || '—',
  };

  const plan = b.segment_plan ?? [];
  const segments: StoryBlueprintPageSegmentVm[] = plan.map((item, idx) => {
    const id = idx + 1;
    const name =
      (item.story_beat && String(item.story_beat).trim()) ||
      (item.segment_id && String(item.segment_id).trim()) ||
      `Segment ${id}`;
    return {
      id,
      name,
      goal: item.goal?.trim() || '—',
      duration: formatSegmentDuration(item.duration_seconds),
      productPlacement: item.product_exposure_mode?.trim() || '—',
      synopsis: item.summary?.trim() || '—',
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
    };
  });

  if (segments.length === 0) {
    segments.push({
      id: 1,
      name: 'Segment 1',
      goal: '—',
      duration: '—',
      productPlacement: '—',
      synopsis: '后端未返回 segment_plan，可尝试重新生成剧本。',
      color: SEGMENT_COLORS[0],
    });
  }

  return { script, segments };
}
