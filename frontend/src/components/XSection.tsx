import type { XAnalysis } from '../types/analysis';

interface Props {
  data: XAnalysis;
}

// 默认空对象，用于 mock/provider 未启用或异常时
const EMPTY_X_ANALYSIS: XAnalysis = {
  summary: '',
  stats: { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 },
  alerts: [],
  topics: [],
  mentions: []
};

export function XSection({ data }: Props) {
  // 使用数据或默认空对象
  const xData = data || EMPTY_X_ANALYSIS;
  const { summary, stats, alerts, mentions } = xData;
  const { total_mentions, positive_count, negative_count, neutral_count } = stats;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <span className="text-2xl">X</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">X 舆情分析</h2>
      </div>

      {summary && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-gray-800">{summary}</p>
        </div>
      )}

      {/* 情绪统计 - 读取 stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            内容情绪
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">正面</span>
              <span className="text-2xl font-semibold text-green-600 ml-2">
                {positive_count}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">负面</span>
              <span className="text-2xl font-semibold text-red-600 ml-2">
                {negative_count}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">中性</span>
              <span className="text-2xl font-semibold text-gray-600 ml-2">
                {neutral_count}
              </span>
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            X 警告
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <span className="text-yellow-600">⚠️</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-yellow-900">{alert}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mentions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            相关提及 ({total_mentions})
          </h3>
          <div className="space-y-3">
            {mentions.map((mention, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-900">{mention.author}</span>
                  <span className="text-xs text-gray-500 ml-2">• {mention.sentiment}</span>
                </div>
                <p className="text-sm text-gray-700">{mention.text}</p>
                <div className="mt-2 text-xs text-gray-500">互动: {mention.engagement}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
