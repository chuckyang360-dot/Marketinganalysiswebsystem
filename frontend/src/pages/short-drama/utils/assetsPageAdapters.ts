import { API_BASE_URL } from '../../../config/api';
import type {
  AssetsPageCharacterVm,
  AssetsPageProductVm,
  AssetsPageSceneVm,
  AssetsPageViewModel,
} from '../types/shortDrama';
import type {
  PipelineAssetsBundleDto,
  PipelineCharacterAssetDto,
  PipelineProductAssetDto,
  PipelineSceneAssetDto,
  PipelineSummaryDto,
} from '../types/shortDramaApi';
import { SHORT_DRAMA_UI } from './shortDramaUiCopy';

/** 与历史 Framer 占位一致：无 image_url 时使用，非伪造后端图 */
export const ASSETS_PLACEHOLDER_CHAR =
  'https://readdy.ai/api/search-image?query=young%20chinese%20professional%20woman%20confident%20elegant%20modern%20outfit%20neutral%20expression%20studio%20portrait%20clean%20white%20background%20cinematic%20lighting%20lifestyle%20advertisement%20commercial%20photography%20realistic&width=200&height=260&seq=char01&orientation=portrait';

export const ASSETS_PLACEHOLDER_SCENE =
  'https://readdy.ai/api/search-image?query=abstract%20minimal%20studio%20backdrop%20soft%20gradient%20neutral%20tones%20no%20furniture%20clean%20horizontal%20advertising%20background%20realistic&width=320&height=200&seq=scene01&orientation=landscape';

export const ASSETS_PLACEHOLDER_PRODUCT =
  'https://readdy.ai/api/search-image?query=generic%20product%20silhouette%20soft%20shadow%20clean%20white%20background%20ecommerce%20placeholder%20minimal%20studio%20lighting%20no%20specific%20item&width=240&height=180&seq=prod01&orientation=landscape';

export const ASSETS_PAGE_MESSAGES = SHORT_DRAMA_UI.assets;

export function resolveAssetImageUrl(
  imageUrl: string | null | undefined,
  placeholder: string,
): { src: string; hasRealImage: boolean } {
  const u = imageUrl?.trim();
  if (!u) return { src: placeholder, hasRealImage: false };
  if (u.startsWith('data:') || u.startsWith('blob:')) return { src: u, hasRealImage: true };
  if (u.startsWith('http://') || u.startsWith('https://')) return { src: u, hasRealImage: true };
  if (u.startsWith('/')) {
    const base = API_BASE_URL.replace(/\/$/, '');
    return { src: base ? `${base}${u}` : u, hasRealImage: true };
  }
  return { src: placeholder, hasRealImage: false };
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
  const { src, hasRealImage } = resolveAssetImageUrl(row.image_url, ASSETS_PLACEHOLDER_CHAR);
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
    hasRealImage,
    visualPrompt: visual || '—',
  };
}

export function sceneAssetDtoToViewModel(row: PipelineSceneAssetDto): AssetsPageSceneVm {
  const meta = metaRecord(row.meta);
  const { src, hasRealImage } = resolveAssetImageUrl(row.image_url, ASSETS_PLACEHOLDER_SCENE);
  const visual = (row.visual_prompt ?? '').trim();
  const type = (row.scene_type ?? '').trim() || pickString(meta, ['sceneType', 'type']) || '场景';
  return {
    id: row.id,
    name: row.name?.trim() || '未命名场景',
    type,
    desc: (row.description ?? '').trim() || '—',
    img: src,
    hasRealImage,
    visualPrompt: visual || '—',
  };
}

export function productAssetDtoToViewModel(row: PipelineProductAssetDto): AssetsPageProductVm {
  const meta = metaRecord(row.meta);
  const { src, hasRealImage } = resolveAssetImageUrl(row.image_url, ASSETS_PLACEHOLDER_PRODUCT);
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
    hasRealImage,
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
