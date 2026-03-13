import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function StrategySection({ data }: Props) {
  const { report } = data;

  return (
    <div id="section-strategy" className="space-y-6">
      {/* Strategy Recommendations Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">策略建议</h2>
        </div>

        <div className="space-y-6">
          {(report?.strategy_recommendations ?? []).map((strategy, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">市场判断</h3>
              <p className="text-gray-700 mb-4">{strategy.market_judgment}</p>

              {strategy.channels && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">推荐渠道</h4>
                  <div className="flex flex-wrap gap-2">
                    {(strategy.channels ?? []).map((channel, chIdx) => (
                      <span key={chIdx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {strategy.positioning && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">品牌定位</h4>
                  <p className="text-sm text-gray-700">{strategy.positioning}</p>
                </div>
              )}

              {strategy.content_strategy && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">内容策略</h4>
                  <p className="text-sm text-gray-700">{strategy.content_strategy}</p>
                </div>
              )}

              {strategy.timing && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">时间规划</h4>
                  <p className="text-sm text-gray-700">{strategy.timing}</p>
                </div>
              )}

              {strategy.format && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">内容形式</h4>
                  <p className="text-sm text-gray-700">{strategy.format}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Methods Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🛠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">实施方法</h2>
        </div>

        <div className="space-y-6">
          {(report?.methods ?? []).map((method, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{method.name}</h3>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">实施步骤</h4>
                <ol className="space-y-2">
                  {(method.steps ?? []).map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="text-blue-500 mt-0.5">{stepIdx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {method.metrics && method.metrics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">成功指标</h4>
                  <div className="flex flex-wrap gap-2">
                    {(method.metrics ?? []).map((metric, mIdx) => (
                      <span key={mIdx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
