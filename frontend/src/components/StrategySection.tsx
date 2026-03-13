import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function StrategySection({ data }: Props) {
  const { report } = data;

  // Fallback data if report is not available
  const strategyRecommendations = report?.strategy_recommendations || [
    {
      market_judgment: "处于成长型市场，建议采用差异化策略",
      channels: ["Reddit", "产品官网", "专业博客"],
      positioning: "专业可靠的解决方案提供商",
      content_strategy: "建立专业内容矩阵，覆盖意识、考虑、决策全阶段",
      timing: "立即启动，3 个月内建立完整内容体系",
      format: "长文为主（60%），短视频辅助（30%），社交媒体互动（10%）"
    }
  ];

  const methods = report?.methods || [
    {
      name: "建立用户信任体系",
      steps: [
        "收集并展示用户真实案例和评价",
        "发布专业的产品白皮书和技术文档",
        "建立透明的定价和服务承诺",
        "提供产品试用和退款政策"
      ],
      metrics: ["信任度提升", "转化率提高", "客户留存率"]
    }
  ];

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
          {strategyRecommendations.map((strategy, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">市场判断</h3>
              <p className="text-gray-700 mb-4">{strategy.market_judgment}</p>

              {strategy.channels && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">推荐渠道</h4>
                  <div className="flex flex-wrap gap-2">
                    {strategy.channels.map((channel, chIdx) => (
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
          {methods.map((method, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{method.name}</h3>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">实施步骤</h4>
                <ol className="space-y-2">
                  {method.steps.map((step, stepIdx) => (
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
                    {method.metrics.map((metric, mIdx) => (
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
