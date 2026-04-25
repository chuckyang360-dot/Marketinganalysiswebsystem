import { API_BASE_URL } from '../../../config/api';
import type {
  AssetsPageCharacterVm,
  AssetsPageProductVm,
  AssetsPageSceneVm,
  AssetsPageViewModel,
} from '../types/shortDrama';
import type {
  AssetImageDto,
  AssetLibraryItemDto,
  AssetReferenceImageDto,
  PipelineAssetsBundleDto,
  PipelineCharacterAssetDto,
  PipelineProductAssetDto,
  PipelineSceneAssetDto,
  PipelineSummaryDto,
} from '../types/shortDramaApi';
import { SHORT_DRAMA_UI } from './shortDramaUiCopy';

export const ASSETS_PAGE_MESSAGES = SHORT_DRAMA_UI.assets;

function isLikelyRenderableUrl(input: string): boolean {
  const u = input.trim().toLowerCase();
  if (!u) return false;
  if (u.startsWith('javascript:')) return false;
  if (u.includes('undefined') || u.includes('null')) return false;
  if (u.endsWith('.svg') || u.endsWith('.txt') || u.endsWith('.json')) return false;
  return true;
}

function maybeRewriteLocalStaticAbsoluteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return trimmed;
  try {
    const u = new URL(trimmed);
    const isLocalHost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    const isShortDramaStatic = u.pathname.startsWith('/static/short-drama-');
    const base = API_BASE_URL.replace(/\/$/, '');
    if (!isLocalHost || !isShortDramaStatic || !base) return trimmed;
    return `${base}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return trimmed;
  }
}

export function resolveAssetImageUrl(imageUrl: string | null | undefined): { src: string | null; hasRealImage: boolean } {
  const u = imageUrl?.trim();
  if (!u || !isLikelyRenderableUrl(u)) return { src: null, hasRealImage: false };
  if (u.startsWith('data:') || u.startsWith('blob:')) return { src: isLikelyRenderableUrl(u) ? u : null, hasRealImage: true };
  if (u.startsWith('http://') || u.startsWith('https://')) {
    const rewritten = maybeRewriteLocalStaticAbsoluteUrl(u);
    return { src: isLikelyRenderableUrl(rewritten) ? rewritten : null, hasRealImage: true };
  }
  if (u.startsWith('/')) {
    const base = API_BASE_URL.replace(/\/$/, '');
    const resolved = base ? `${base}${u}` : u;
    return { src: isLikelyRenderableUrl(resolved) ? resolved : null, hasRealImage: true };
  }
  return { src: null, hasRealImage: false };
}

type ThumbnailLikeAsset = {
  image_url?: string | null;
  cover_image_id?: number | null;
  cover_image?: Partial<AssetImageDto> | null;
  images?: Partial<AssetImageDto>[];
  reference_images?: Partial<AssetReferenceImageDto>[];
};

function isActiveStatus(status: unknown): boolean {
  return String(status || 'active').toLowerCase() === 'active';
}

function resolveMaybeImageUrl(value: string | null | undefined): string | null {
  return resolveAssetImageUrl(value).src;
}

export function getAssetThumbnailUrl(asset: ThumbnailLikeAsset | AssetLibraryItemDto | null | undefined): string | null {
  if (!asset) return null;
  const cover = asset.cover_image;
  if (cover && isActiveStatus(cover.status)) {
    const src = resolveMaybeImageUrl(typeof cover.image_url === 'string' ? cover.image_url : null);
    if (src) return src;
  }

  const images = (asset.images ?? []).filter((img) => isActiveStatus(img.status));
  const coverId = typeof asset.cover_image_id === 'number' ? asset.cover_image_id : Number(asset.cover_image_id);
  if (Number.isInteger(coverId) && coverId > 0) {
    const byCoverId = images.find((img) => img.id === coverId);
    const src = resolveMaybeImageUrl(typeof byCoverId?.image_url === 'string' ? byCoverId.image_url : null);
    if (src) return src;
  }

  for (const img of images) {
    const src = resolveMaybeImageUrl(typeof img.image_url === 'string' ? img.image_url : null);
    if (src) return src;
  }

  for (const ref of asset.reference_images ?? []) {
    if (!isActiveStatus(ref.status)) continue;
    const src = resolveMaybeImageUrl(typeof ref.file_url === 'string' ? ref.file_url : null);
    if (src) return src;
  }

  return resolveMaybeImageUrl(asset.image_url ?? null);
}

function metaRecord(meta: unknown): Record<string, unknown> {
  return meta && typeof meta === 'object' && !Array.isArray(meta) ? (meta as Record<string, unknown>) : {};
}

function pickString(meta: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function tagsFromMeta(meta: Record<string, unknown>, fallback: string[]): string[] {
  const t = meta['tags'] ?? meta['trait_tags'] ?? meta['traitTags'];
  if (Array.isArray(t) && t.length) return t.map(String).filter(Boolean).slice(0, 8);
  if (typeof t === 'string' && t.trim()) return t.split(/[,，、]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
  return fallback.length ? fallback : ['资产规范'];
}

export function characterAssetDtoToViewModel(row: PipelineCharacterAssetDto): AssetsPageCharacterVm {
  const meta = metaRecord(row.meta);
  const src = getAssetThumbnailUrl(row);
  const voice =
    pickString(meta, ['voice_style', 'voiceStyle', 'voice']) ||
    (row.role_type?.includes('主') ? '未指定（主角）' : '未指定');
  const visual = (row.visual_prompt ?? '').trim();
  return {
    id: row.id,
    name: row.name?.trim() || '未命名角色',
    role: row.role_type?.trim() || '—',
    desc: (row.description ?? '').trim() || '—',
    tags: tagsFromMeta(meta, visual ? [visual.slice(0, 24)] : []),
    voice,
    img: src,
    hasRealImage: Boolean(src),
    visualPrompt: visual || '—',
  };
}

export function sceneAssetDtoToViewModel(row: PipelineSceneAssetDto): AssetsPageSceneVm {
  const meta = metaRecord(row.meta);
  const src = getAssetThumbnailUrl(row);
  const visual = (row.visual_prompt ?? '').trim();
  const type = (row.scene_type ?? '').trim() || pickString(meta, ['sceneType', 'type']) || '场景';
  return {
    id: row.id,
    name: row.name?.trim() || '未命名场景',
    type,
    desc: (row.description ?? '').trim() || '—',
    img: src,
    hasRealImage: Boolean(src),
    visualPrompt: visual || '—',
  };
}

export function productAssetDtoToViewModel(row: PipelineProductAssetDto): AssetsPageProductVm {
  const meta = metaRecord(row.meta);
  const src = getAssetThumbnailUrl(row);
  const desc = (row.description ?? '').trim() || '—';
  const visual = (row.visual_prompt ?? '').trim();
  const placement =
    pickString(meta, ['placement', 'shot_use', 'shotUse', 'use_mode', 'useMode']) ||
    (desc.length > 0 && desc !== '—' ? desc.slice(0, 80) : '产品出镜方式见描述');
  const cameraHint =
    visual.length > 0 ? (visual.length > 120 ? `${visual.slice(0, 120)}…` : visual) : '见视觉 Prompt / 描述';
  return {
    id: row.id,
    name: row.name?.trim() || '未命名产品',
    placement,
    cameraHint,
    desc,
    img: src,
    hasRealImage: Boolean(src),
  };
}

export function assetsBundleEmpty(assets: PipelineSummaryDto['assets'] | null | undefined): boolean {
  if (!assets) return true;
  const c = assets.characters?.length ?? 0;
  const s = assets.scenes?.length ?? 0;
  const p = assets.products?.length ?? 0;
  return c === 0 && s === 0 && p === 0;
}

/** 三者均有行才算「规范齐套」；任一非空但总未齐套为 partial；全空为 empty */
export type AssetsBundleCompleteness = 'empty' | 'partial' | 'complete';

export function getAssetsBundleCompleteness(
  assets: PipelineSummaryDto['assets'] | null | undefined,
): AssetsBundleCompleteness {
  if (!assets) return 'empty';
  const c = assets.characters?.length ?? 0;
  const s = assets.scenes?.length ?? 0;
  const p = assets.products?.length ?? 0;
  if (c > 0 && s > 0 && p > 0) return 'complete';
  if (c === 0 && s === 0 && p === 0) return 'empty';
  return 'partial';
}

/** 将 pipeline.assets 转为 Assets 页可直接绑定的视图模型 */
export function pipelineAssetsToAssetsPageViewModel(
  assets: PipelineAssetsBundleDto | null | undefined,
): AssetsPageViewModel {
  if (!assets) {
    return { characters: [], scenes: [], products: [] };
  }
  return {
    characters: (assets.characters ?? []).map((r) => characterAssetDtoToViewModel(r)),
    scenes: (assets.scenes ?? []).map((r) => sceneAssetDtoToViewModel(r)),
    products: (assets.products ?? []).map((r) => productAssetDtoToViewModel(r)),
  };
}

export function assetsPageViewModelEmpty(vm: AssetsPageViewModel): boolean {
  return vm.characters.length === 0 && vm.scenes.length === 0 && vm.products.length === 0;
}
