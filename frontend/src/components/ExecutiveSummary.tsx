import { FileText } from 'lucide-react';
import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function ExecutiveSummary({ data }: Props) {
  const { query, reddit_analysis, seo_analysis, gap_analysis, content_ideas } = data;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">执行摘要</h2>
      </div>

      <div className="space-y-6">
        <Section
          title="搜索关键词"
          content={query}
          highlight
        />

        <Section
          title="Reddit 分析"
          content={reddit_analysis.summary || '暂无摘要'}
          subtitle={`${reddit_analysis.topics.length} 个话题，${reddit_analysis.mentions.length} 条提及`}
        />

        <Section
          title="SEO 分析"
          content={seo_analysis.summary || '暂无摘要'}
          subtitle={`${seo_analysis.topics.length} 个话题，${seo_analysis.mentions.length} 条提及`}
        />

        <Section
          title="市场机会"
          content={`发现 ${gap_analysis.opportunities.length} 个内容机会`}
          subtitle={`${gap_analysis.opportunities.filter(o => o.gap_score >= 2).length} 个高潜力关键词`}
        />

        <Section
          title="内容建议"
          content={`生成 ${content_ideas.length} 个内容创意`}
          subtitle="覆盖博客文章、社交媒体帖子和视频脚本"
        />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  content: string;
  subtitle?: string;
  highlight?: boolean;
}

function Section({ title, content, subtitle, highlight }: SectionProps) {
  return (
    <div className={highlight ? 'bg-blue-50 rounded-xl p-4 -mx-2' : ''}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <p className={`text-lg ${highlight ? 'text-blue-900 font-medium' : 'text-gray-900'}`}>
        {content}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
