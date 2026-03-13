import type { FullAnalysisResponse } from '../types/analysis';
import { ExecutiveSummarySection } from './ExecutiveSummarySection';
import { EvidenceSection } from './EvidenceSection';
import { AnalysisSection } from './AnalysisSection';
import { StrategySection } from './StrategySection';
import { ExecutionSection } from './ExecutionSection';

interface Props {
  data: FullAnalysisResponse;
}

export function WorkspaceResultView({ data }: Props) {
  return (
    <div className="space-y-8">
      <ExecutiveSummarySection data={data} />
      <EvidenceSection data={data} />
      <AnalysisSection data={data} />
      <StrategySection data={data} />
      <ExecutionSection data={data} />
    </div>
  );
}
