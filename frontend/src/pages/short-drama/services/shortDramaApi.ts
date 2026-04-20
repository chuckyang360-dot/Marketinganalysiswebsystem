import { API_BASE_URL } from '../../../config/api';
import type {
  AssetImageBatchResponseDto,
  CreateShortDramaProjectResponseDto,
  GenerateAssetSpecsResponseDto,
  GenerateSegmentScriptsResponseDto,
  GenerateStoryResponseDto,
  MergeVideoResponseDto,
  ParseProductResponseDto,
  PipelineSummaryDto,
  ProductInputPayload,
  RenderJobStatusResponseDto,
  ShortDramaProjectDto,
  SingleSegmentVideoResponseDto,
  VideoBatchSummaryResponseDto,
} from '../types/shortDramaApi';

export class ShortDramaApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ShortDramaApiError';
    this.status = status;
  }
}

function joinUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function formatShortDramaDetailObject(d: Record<string, unknown>): string {
  const msg = typeof d.message === 'string' ? d.message : '';
  const seg = d.segment_id != null && d.segment_id !== '' ? `segment=${String(d.segment_id)}` : '';
  const shot = d.shot_id != null && d.shot_id !== '' ? `shot=${String(d.shot_id)}` : '';
  const mfRaw = d.missing_fields;
  const mf =
    Array.isArray(mfRaw) && mfRaw.length
      ? `missing fields=${mfRaw.map((x) => String(x)).join(', ')}`
      : '';
  const parts = [msg, seg, shot, mf].filter(Boolean);
  return parts.length ? parts.join(' · ') : JSON.stringify(d);
}

async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: unknown }).msg) : String(x)))
        .join('; ');
    }
    if (typeof j.detail === 'object' && j.detail !== null && !Array.isArray(j.detail)) {
      return formatShortDramaDetailObject(j.detail as Record<string, unknown>);
    }
  } catch {
    /* ignore */
  }
  return text.slice(0, 400) || res.statusText || `HTTP ${res.status}`;
}

async function sdFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(joinUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new ShortDramaApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

export type CreateProjectBody = {
  user_id: number;
  project_name: string;
  duration?: string | null;
  format?: string | null;
  style?: string | null;
  visual_style?: string | null;
  aspect_ratio?: string | null;
};

export async function createShortDramaProject(body: CreateProjectBody): Promise<CreateShortDramaProjectResponseDto> {
  return sdFetchJson<CreateShortDramaProjectResponseDto>('/api/short-drama/project', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getShortDramaProject(projectId: number): Promise<ShortDramaProjectDto> {
  return sdFetchJson<ShortDramaProjectDto>(`/api/short-drama/project/${projectId}`);
}

export async function getShortDramaPipeline(projectId: number): Promise<PipelineSummaryDto> {
  return sdFetchJson<PipelineSummaryDto>(`/api/short-drama/project/${projectId}/pipeline`);
}

export async function parseShortDramaProduct(
  projectId: number,
  input: ProductInputPayload,
): Promise<ParseProductResponseDto> {
  return sdFetchJson<ParseProductResponseDto>('/api/short-drama/product/parse', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, input }),
  });
}

export async function generateShortDramaStory(projectId: number): Promise<GenerateStoryResponseDto> {
  return sdFetchJson<GenerateStoryResponseDto>('/api/short-drama/story/generate', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
}

export type AssetSpecsCallMeta = {
  /** auto: 首屏；retry_button：手动重试；next_button：底部下一步兜底 */
  trigger?: 'auto' | 'retry_button' | 'next_button';
};

export async function generateShortDramaAssetSpecs(
  projectId: number,
  meta: AssetSpecsCallMeta = {},
): Promise<GenerateAssetSpecsResponseDto> {
  const trigger = meta.trigger ?? 'auto';
  console.info(`[FE_ASSET_SPECS_REQUEST] projectId=${projectId} trigger=${trigger}`);
  try {
    const res = await sdFetchJson<GenerateAssetSpecsResponseDto>('/api/short-drama/assets/specs/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    });
    const nc = res.assets?.characters?.length ?? 0;
    const ns = res.assets?.scenes?.length ?? 0;
    const np = res.assets?.products?.length ?? 0;
    console.info(`[FE_ASSET_SPECS_SUCCESS] projectId=${projectId} trigger=${trigger} characters=${nc} scenes=${ns} products=${np}`);
    return res;
  } catch (e) {
    const msg = e instanceof ShortDramaApiError ? `${e.message} status=${e.status}` : String(e);
    console.warn(`[FE_ASSET_SPECS_ERROR] projectId=${projectId} trigger=${trigger} ${msg}`);
    throw e;
  }
}

export async function generateShortDramaAssetImages(projectId: number): Promise<AssetImageBatchResponseDto> {
  return sdFetchJson<AssetImageBatchResponseDto>('/api/short-drama/assets/images/generate', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
}

export async function generateShortDramaSegmentScripts(projectId: number): Promise<GenerateSegmentScriptsResponseDto> {
  return sdFetchJson<GenerateSegmentScriptsResponseDto>('/api/short-drama/segment/generate', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
}

export async function generateShortDramaSegmentVideos(projectId: number): Promise<VideoBatchSummaryResponseDto> {
  return sdFetchJson<VideoBatchSummaryResponseDto>('/api/short-drama/videos/generate', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
}

export async function generateShortDramaSingleSegmentVideo(
  projectId: number,
  segmentId: string,
): Promise<SingleSegmentVideoResponseDto> {
  return sdFetchJson<SingleSegmentVideoResponseDto>(
    `/api/short-drama/videos/generate/${encodeURIComponent(segmentId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    },
  );
}

export async function getShortDramaRenderJob(jobId: number): Promise<RenderJobStatusResponseDto> {
  return sdFetchJson<RenderJobStatusResponseDto>(`/api/short-drama/videos/render-jobs/${jobId}`);
}

export async function mergeShortDramaProjectVideo(projectId: number): Promise<MergeVideoResponseDto> {
  return sdFetchJson<MergeVideoResponseDto>('/api/short-drama/videos/merge', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });
}
