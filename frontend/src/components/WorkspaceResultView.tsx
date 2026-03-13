import type { FullAnalysisResponse } from '../types/analysis';
import { ExecutiveSummarySection } from './ExecutiveSummarySection';
import { EvidenceSection } from './EvidenceSection';
import { AnalysisSection } from './AnalysisSection';
import { StrategySection } from './StrategySection';
import { ExecutionSection } from './ExecutionSection';

interface Props {
  data: FullAnalysisResponse;
}

// 添加默认空数据，防止访问未定义字段时崩溃
const EMPTY_DATA: FullAnalysisResponse = {
  query: '',
  reddit_analysis: {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  },
  seo_analysis: {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  },
  x_analysis: {
    summary: '',
    stats: { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 },
    alerts: [],
    topics: [],
    mentions: []
  },
  gap_analysis: {
    reddit_topics: [],
    seo_topics: [],
    opportunities: []
  },
  content_ideas: []
};

export function WorkspaceResultView({ data }: Props) {
  // 使用数据或默认空数据
  const safeData = data || EMPTY_DATA;

  return (
    <div className="space-y-8">
      <ExecutiveSummarySection data={safeData} />
      <EvidenceSection data={safeData} />
      <AnalysisSection data={safeData} />
      <StrategySection data={safeData} />
      <ExecutionSection data={safeData} />
    </div>
  );
}
