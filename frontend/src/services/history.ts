import type { EcomProductAnalysisResult, FullAnalysisResponse, WorkspaceAnalysisResult } from '../types/analysis';
import type { AnalysisHistoryRecord, HistoryRecordType } from '../types/history';

const STORAGE_KEY = 'vm_workspace_analysis_history_v1';
const MAX_HISTORY_ITEMS = 100;
const SUPPORTED_TYPES: HistoryRecordType[] = ['marketing_report', 'ecom_product', 'content_creation'];

function nowIsoString(): string {
  return new Date().toISOString();
}

function createHistoryId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `analysis_${Date.now()}_${randomPart}`;
}

function normalizePlatform(raw: string | undefined): string {
  const value = String(raw || '').trim();
  return value || 'unknown';
}

function readHistoryStorage(): AnalysisHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === 'object') as AnalysisHistoryRecord[];
  } catch {
    return [];
  }
}

function writeHistoryStorage(records: AnalysisHistoryRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_HISTORY_ITEMS)));
}

function buildMarketingRecord(query: string, result: FullAnalysisResponse): AnalysisHistoryRecord {
  const now = nowIsoString();
  const id = createHistoryId();
  const title = String(result.query || query || '未命名分析').trim();
  return {
    id,
    type: 'marketing_report',
    platform: 'multi_source',
    title,
    input_value: query,
    display_value: title,
    cover_image: '',
    status: 'completed',
    created_at: now,
    updated_at: now,
    result_route: `/workspace/marketing-result/${id}`,
    result_data: result,
  };
}

function buildEcomRecord(query: string, result: EcomProductAnalysisResult): AnalysisHistoryRecord {
  const now = nowIsoString();
  const id = createHistoryId();
  const title = String(result.parse_data?.title || '未命名商品').trim();
  const platform = normalizePlatform(result.parse_data?.platform);
  const image = String(result.parse_data?.main_image || result.parse_data?.images?.[0] || '').trim();

  const scoreMatch = String(result.ceo_analysis || '').match(/(\d{2,3})\s*\/\s*100|(\d{2,3})分/);
  const parsedScore = Number(scoreMatch?.[1] || scoreMatch?.[2] || 0);
  const score = Number.isFinite(parsedScore) && parsedScore > 0 ? Math.min(100, parsedScore) : undefined;

  return {
    id,
    type: 'ecom_product',
    platform,
    title,
    input_value: query,
    display_value: title || '未命名商品',
    cover_image: image,
    status: result.status === 'error' ? 'failed' : 'completed',
    created_at: now,
    updated_at: now,
    result_route: `/workspace/ecom-result/${id}`,
    result_data: result,
    score,
    issues_count: 3,
  };
}

export function upsertAnalysisHistoryRecord(
  query: string,
  result: WorkspaceAnalysisResult
): AnalysisHistoryRecord {
  const nextRecord =
    result && (result as EcomProductAnalysisResult).type === 'ecom_product_analysis'
      ? buildEcomRecord(query, result as EcomProductAnalysisResult)
      : buildMarketingRecord(query, result as FullAnalysisResponse);

  const records = readHistoryStorage();
  const existingIndex = records.findIndex((item) => item.id === nextRecord.id);
  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      ...nextRecord,
      created_at: records[existingIndex].created_at || nextRecord.created_at,
      updated_at: nowIsoString(),
    };
  } else {
    records.unshift(nextRecord);
  }
  writeHistoryStorage(records);
  return nextRecord;
}

export function getAnalysisHistoryRecords(types: HistoryRecordType[] = SUPPORTED_TYPES): AnalysisHistoryRecord[] {
  const allowSet = new Set(types);
  return readHistoryStorage()
    .filter((item) => allowSet.has(item.type))
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}

export function getAnalysisHistoryRecordById(id: string): AnalysisHistoryRecord | null {
  if (!id) return null;
  return readHistoryStorage().find((item) => item.id === id) || null;
}
