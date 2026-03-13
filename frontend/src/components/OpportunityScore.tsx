import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { GapAnalysis } from '../types/analysis';

interface Props {
  gapAnalysis: GapAnalysis;
}

export function OpportunityScore({ gapAnalysis }: Props) {
  const { opportunities } = gapAnalysis;

  const averageScore = opportunities.length > 0
    ? opportunities.reduce((sum, opp) => sum + opp.gap_score, 0) / opportunities.length
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 2) return { bg: 'bg-green-500', text: 'text-green-600', icon: <TrendingUp /> };
    if (score >= 1) return { bg: 'bg-yellow-500', text: 'text-yellow-600', icon: <Minus /> };
    return { bg: 'bg-red-500', text: 'text-red-600', icon: <TrendingDown /> };
  };

  const scoreInfo = getScoreColor(averageScore);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">机会得分</h2>

      <div className="flex items-center gap-6">
        <div className={`w-24 h-24 ${scoreInfo.bg} rounded-2xl flex items-center justify-center shadow-lg`}>
          <span className="text-4xl font-bold text-white">{averageScore.toFixed(1)}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {scoreInfo.icon}
            <span className={`font-semibold ${scoreInfo.text}`}>
              {averageScore >= 2 ? '高机会' : averageScore >= 1 ? '中等机会' : '低机会'}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            基于 {opportunities.length} 个关键词的市场需求和供给分析
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {opportunities.filter(o => o.gap_score >= 2).length}
            </div>
            <div className="text-sm text-gray-500">高潜力</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {opportunities.filter(o => o.gap_score >= 1 && o.gap_score < 2).length}
            </div>
            <div className="text-sm text-gray-500">中等潜力</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {opportunities.filter(o => o.gap_score < 1).length}
            </div>
            <div className="text-sm text-gray-500">低潜力</div>
          </div>
        </div>
      </div>
    </div>
  );
}
