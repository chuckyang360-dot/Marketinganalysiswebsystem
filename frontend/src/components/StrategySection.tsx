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
              {/* market_judgment */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">市场判断</h3>
              <p className="text-gray-700 mb-4">{strategy.market_judgment}</p>

              {/* channels */}
              {strategy.channels && strategy.channels.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">推荐渠道</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.channels.map((channel, chIdx) => (
                      <span
                        key={chIdx}
                        className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* positioning */}
              {strategy.positioning && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">品牌定位</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {strategy.positioning}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
