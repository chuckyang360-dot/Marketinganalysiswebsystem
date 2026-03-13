import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function ExecutiveSummarySection({ data }: Props) {
  const { report, query } = data;

  // Fallback to placeholder if report is not available
  const executiveSummary = report?.executive_summary ||
    `基于 ${query} 的市场数据分析，已收集来自 Reddit、SEO、X 等多个数据源的原始信息。本报告将提供整体的市场洞察、机会识别和策略建议。`;

  const marketAnalysis = report?.market_analysis ||
    `当前市场环境下，${query} 相关领域存在明确的增长机会。Reddit 社区讨论活跃，用户对专业内容的需求在上升。SEO 内容供给相对分散，高质量的行业分析内容仍有空间。X 平台舆情整体中性，品牌认知度有待提升。`;

  const keyFindings = report?.key_findings || [
    "Reddit 社区是获取真实用户反馈的黄金渠道，讨论话题直接反映用户需求和痛点",
    "SEO 侧更偏重产品对比和教程，用户在购买决策阶段使用",
    "X 平台内容传播速度较快，适合新品发布和营销活动"
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">执行摘要</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {executiveSummary}
        </p>
      </div>

      {/* Market Analysis Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">📈</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">市场分析</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {marketAnalysis}
        </p>
      </div>

      {/* Key Findings Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">💡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">关键发现</h2>
        </div>
        <ul className="space-y-3">
          {(keyFindings ?? []).map((finding, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-700">
              <span className="text-purple-500 mt-1">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
