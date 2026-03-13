import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { GapAnalysis } from '../types/analysis';

interface Props {
  data: GapAnalysis;
}

export function GapTable({ data }: Props) {
  const { opportunities } = data;
  const sorted = [...opportunities].sort((a, b) => b.gap_score - a.gap_score);

  const getScoreBadge = (score: number) => {
    if (score >= 2) return { bg: 'bg-green-100', text: 'text-green-800', label: '高潜力' };
    if (score >= 1) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '中等' };
    return { bg: 'bg-gray-100', text: 'text-gray-800', label: '低潜力' };
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">内容机会差距</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">关键词</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">需求</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">供给</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">得分</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">潜力</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((opp, idx) => {
              const badge = getScoreBadge(opp.gap_score);
              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">{opp.keyword}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-orange-600 font-semibold">{opp.demand}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-blue-600 font-semibold">{opp.supply}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-gray-900">{opp.gap_score.toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-orange-500" />
          <span>需求 = Reddit 讨论热度</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDownRight className="w-4 h-4 text-blue-500" />
          <span>供给 = SEO 内容数量</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span>得分 = 需求 / (供给 + 1)</span>
        </div>
      </div>
    </div>
  );
}
