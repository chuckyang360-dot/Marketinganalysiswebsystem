import type { ProductInputDraft, ProductPreviewSummary } from '../types/shortDrama';
import type { ProductContextDto, ProductInputPayload, StoryBlueprintDto } from '../types/shortDramaApi';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** 将 pipeline / DB 中的 raw_inputs 还原为表单草稿（与 mapDraftToProductInputPayload 互逆，尽力而为）。 */
export function pipelineRawInputsToDraft(raw: unknown): ProductInputDraft | null {
  const o = asRecord(raw);
  if (!o) return null;
  const productImages = Array.isArray(o.product_images)
    ? o.product_images
        .map((row, idx) => {
          const r = asRecord(row);
          if (!r || typeof r.image_url !== 'string' || !r.image_url.trim()) return null;
          return {
            imageUrl: r.image_url.trim(),
            imageOrder: typeof r.image_order === 'number' ? r.image_order : idx,
            isMainImage: Boolean(r.is_main_image),
            imageCaptionRaw: typeof r.image_caption_raw === 'string' ? r.image_caption_raw : '',
          };
        })
        .filter((x): x is ProductInputDraft['productImages'][number] => Boolean(x))
    : [];
  const hasAnything =
    (typeof o.product_name_raw === 'string' && o.product_name_raw.trim()) ||
    (typeof o.product_category_raw === 'string' && o.product_category_raw.trim()) ||
    (typeof o.brand_raw === 'string' && o.brand_raw.trim()) ||
    (typeof o.price_raw === 'string' && o.price_raw.trim()) ||
    (typeof o.target_users_raw === 'string' && o.target_users_raw.trim()) ||
    (Array.isArray(o.selling_points_raw) && o.selling_points_raw.length > 0) ||
    (Array.isArray(o.usage_scenarios_raw) && o.usage_scenarios_raw.length > 0) ||
    (typeof o.extra_notes_raw === 'string' && o.extra_notes_raw.trim()) ||
    productImages.length > 0;

  if (!hasAnything) return null;

  return {
    productNameRaw: typeof o.product_name_raw === 'string' ? o.product_name_raw : '',
    productCategoryRaw: typeof o.product_category_raw === 'string' ? o.product_category_raw : '',
    brandRaw: typeof o.brand_raw === 'string' ? o.brand_raw : '',
    priceRaw: typeof o.price_raw === 'string' ? o.price_raw : '',
    targetUsersRaw: typeof o.target_users_raw === 'string' ? o.target_users_raw : '',
    sellingPointsRaw: Array.isArray(o.selling_points_raw) ? o.selling_points_raw.map((x) => String(x)) : [],
    usageScenariosRaw: Array.isArray(o.usage_scenarios_raw) ? o.usage_scenarios_raw.map((x) => String(x)) : [],
    extraNotesRaw: typeof o.extra_notes_raw === 'string' ? o.extra_notes_raw : '',
    productImages,
  };
}

/** Map create-project form → POST /project body fields (duration/format/style/visual/aspect already strings on backend). */
export function mapDraftToProductInputPayload(draft: ProductInputDraft): ProductInputPayload {
  return {
    product_name_raw: draft.productNameRaw.trim() || undefined,
    product_category_raw: draft.productCategoryRaw.trim() || undefined,
    brand_raw: draft.brandRaw.trim() || undefined,
    price_raw: draft.priceRaw.trim() || undefined,
    target_users_raw: draft.targetUsersRaw.trim() || undefined,
    selling_points_raw: draft.sellingPointsRaw.length ? draft.sellingPointsRaw : undefined,
    usage_scenarios_raw: draft.usageScenariosRaw.length ? draft.usageScenariosRaw : undefined,
    extra_notes_raw: draft.extraNotesRaw.trim() || undefined,
    product_images: draft.productImages.map((img, idx) => ({
      image_url: img.imageUrl,
      image_order: img.imageOrder ?? idx,
      is_main_image: Boolean(img.isMainImage),
      image_caption_raw: img.imageCaptionRaw || '',
    })),
  };
}

/**
 * ProductContext (normalized) → InfoPreviewPanel model.
 * Graceful degradation when arrays empty.
 */
export function productContextToPreview(ctx: ProductContextDto): ProductPreviewSummary {
  return {
    productName: ctx.product_name || '',
    productCategory: ctx.product_category || '',
    productSummary: ctx.product_summary || '',
    coreSellingPoints: ctx.core_selling_points ?? [],
    targetUsers: ctx.target_users ?? [],
    usageScenarios: ctx.usage_scenarios ?? [],
    visualFeatures: ctx.visual_features ?? [],
    productForm: ctx.product_form || '',
    keyFunctions: ctx.key_functions ?? [],
    emotionalValue: ctx.emotional_value ?? [],
    suitableStoryAngles: ctx.suitable_story_angles ?? [],
    visualRiskNotes: ctx.visual_risk_notes ?? [],
    consistencyNotes: ctx.consistency_notes ?? [],
    extractedFromImages: ctx.extracted_from_images ?? [],
    parseConfidence: typeof ctx.parse_confidence === 'number' ? ctx.parse_confidence : 0,
    sourceTrace: (ctx.source_trace ?? {}) as Record<string, string>,
    fieldMeta: (ctx.field_meta ?? {}) as Record<string, { edited_by_user?: boolean; edited_at?: string }>,
    status: 'ready',
  };
}

export function normalizedJsonToProductPreview(norm: unknown): ProductPreviewSummary | null {
  if (!norm || typeof norm !== 'object') return null;
  const o = norm as Record<string, unknown>;
  if (typeof o.product_name !== 'string' || !o.product_name.trim()) return null;
  return productContextToPreview(o as ProductContextDto);
}

export function previewToProductContextPayload(preview: ProductPreviewSummary): Record<string, unknown> {
  return {
    product_name: preview.productName,
    product_category: preview.productCategory,
    product_summary: preview.productSummary,
    core_selling_points: preview.coreSellingPoints,
    target_users: preview.targetUsers,
    usage_scenarios: preview.usageScenarios,
    visual_features: preview.visualFeatures,
    product_form: preview.productForm,
    key_functions: preview.keyFunctions,
    emotional_value: preview.emotionalValue,
    suitable_story_angles: preview.suitableStoryAngles,
    visual_risk_notes: preview.visualRiskNotes,
    consistency_notes: preview.consistencyNotes,
    extracted_from_images: preview.extractedFromImages,
    parse_confidence: preview.parseConfidence,
    source_trace: preview.sourceTrace,
    field_meta: preview.fieldMeta,
  };
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
