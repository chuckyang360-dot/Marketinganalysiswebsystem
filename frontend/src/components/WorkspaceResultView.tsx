import type { FullAnalysisResponse } from '../types/analysis';
import { ExecutiveSummary } from './ExecutiveSummary';
import { OpportunityScore } from './OpportunityScore';
import { RedditSection } from './RedditSection';
import { XSection } from './XSection';
import { SEOSection } from './SEOSection';
import { GapTable } from './GapTable';
import { ContentIdeas } from './ContentIdeas';

interface Props {
  data: FullAnalysisResponse;
}

export function WorkspaceResultView({ data }: Props) {
  return (
    <div className="space-y-6">
      <div id="section-summary">
        <ExecutiveSummary data={data} />
      </div>
      <div id="section-score">
        <OpportunityScore gapAnalysis={data.gap_analysis} />
      </div>
      <div id="section-reddit" className="grid lg:grid-cols-2 gap-6">
        <RedditSection data={data.reddit_analysis} />
      </div>
      <div id="section-seo" className="grid lg:grid-cols-2 gap-6">
        <SEOSection data={data.seo_analysis} />
      </div>
      {data.x_analysis && (
        <div id="section-x" className="grid lg:grid-cols-2 gap-6">
          <XSection data={data.x_analysis} />
        </div>
      )}
      <div id="section-gap">
        <GapTable data={data.gap_analysis} />
      </div>
      <div id="section-ideas">
        <ContentIdeas ideas={data.content_ideas} />
      </div>
    </div>
  );
}
