import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function AnalysisSection({ data }: Props) {
  // 添加空值保护
  const gap_analysis = data?.gap_analysis || {
    reddit_topics: [],
    seo_topics: [],
    opportunities: []
  };
  const reddit_analysis = data?.reddit_analysis || {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  };

  return (
    <div id="section-analysis" className="space-y-6">
      {/* Gap Analysis Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">📈</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">深度分析：内容机会差距</h2>
        </div>

        {/* Reddit Topics */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Reddit 讨论话题（需求侧）
          </h3>
          <div className="flex flex-wrap gap-2">
            {gap_analysis.reddit_topics.map((topic, idx) => (
              <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* SEO Topics */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            SEO 内容话题（供给侧）
          </h3>
          <div className="flex flex-wrap gap-2">
            {gap_analysis.seo_topics.map((topic, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Opportunity Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            机会识别
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">关键词</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">机会得分</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">需求</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">供给</th>
                </tr>
              </thead>
              <tbody>
                {gap_analysis.opportunities.map((opp, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{opp.keyword}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        opp.gap_score > 70 ? 'bg-green-100 text-green-700' :
                        opp.gap_score > 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {opp.gap_score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">{opp.demand}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">{opp.supply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🔬</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">深度洞察</h2>
        </div>

        <div className="space-y-4">
          {/* Reddit Insight */}
          <div className="p-4 bg-orange-50 rounded-xl">
            <h3 className="text-sm font-semibold text-orange-900 mb-2">Reddit 用户行为模式</h3>
            <p className="text-sm text-gray-700">
              Reddit 用户更倾向于讨论具体的使用场景和问题解决方法。
              情绪分析显示 {reddit_analysis.sentiment.positive > reddit_analysis.sentiment.negative ? '正面情绪占主导' : '需要关注负面反馈'}。
            </p>
          </div>

          {/* SEO Insight */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">SEO 内容策略分析</h3>
            <p className="text-sm text-gray-700">
              SEO 内容主要集中在产品介绍和教程类文章。
              发现 {gap_analysis.opportunities.length} 个高价值内容机会，建议优先创建差距得分大于 50 的内容。
            </p>
          </div>

          {/* Content Gap Insight */}
          <div className="p-4 bg-green-50 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 mb-2">内容差距总结</h3>
            <p className="text-sm text-gray-700">
              Reddit 讨论的话题与现有 SEO 内容存在明显差异，
              这表明用户真实需求与内容供给之间存在认知差距。
              建议增加更多用户痛点导向的内容。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
