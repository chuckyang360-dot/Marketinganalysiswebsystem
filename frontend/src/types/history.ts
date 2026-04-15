export type HistoryRecordType = 'marketing_report' | 'ecom_product' | 'content_creation';

export type HistoryRecordStatus = 'completed' | 'failed';

export interface AnalysisHistoryRecord {
  id: string;
  type: HistoryRecordType;
  platform: string;
  title: string;
  input_value: string;
  display_value: string;
  cover_image: string;
  status: HistoryRecordStatus;
  created_at: string;
  updated_at: string;
  result_route: string;
  result_data?: unknown;
  score?: number;
  issues_count?: number;
}
