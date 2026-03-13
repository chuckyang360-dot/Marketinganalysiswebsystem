import { reportCases } from '../data/reportCases';
import type { ReportCase } from '../data/reportCases';

interface Props {
  caseId: string;
  lang?: 'zh' | 'en';
}

export function StaticCaseReport({ caseId, lang = 'zh' }: Props) {
  const caseData = reportCases.find(c => c.id === caseId);

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">案例数据未找到</p>
      </div>
    );
  }

  const priorityColor = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700'
  };

  const priorityLabel = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{caseData.title}</h1>
            <p className="text-lg text-gray-500">{caseData.subtitle}</p>
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            {caseData.marketStage}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">客户类型</div>
            <div className="text-sm font-medium text-gray-900">{caseData.clientType}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">主要目标</div>
            <div className="text-sm font-medium text-gray-900">{caseData.primaryGoal}</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          执行摘要
        </h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-red-600 mb-1">核心问题</div>
            <p className="text-sm text-gray-700">{caseData.executiveSummary.coreIssue}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-green-600 mb-1">最优机会</div>
            <p className="text-sm text-gray-700">{caseData.executiveSummary.topOpportunity}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-blue-600 mb-1">建议动作</div>
            <p className="text-sm text-gray-700">{caseData.executiveSummary.suggestedAction}</p>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">{caseData.executiveSummary.summary}</p>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          市场概览
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">市场趋势</div>
            <p className="text-sm text-gray-700">{caseData.marketOverview.marketTrend}</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">用户需求</div>
            <p className="text-sm text-gray-700">{caseData.marketOverview.userDemand}</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">竞争成熟度</div>
            <p className="text-sm text-gray-700">{caseData.marketOverview.competitionLevel}</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">内容密度</div>
            <p className="text-sm text-gray-700">{caseData.marketOverview.contentDensity}</p>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-500 mb-1">渠道变化</div>
            <p className="text-sm text-gray-700">{caseData.marketOverview.channelShift}</p>
          </div>
        </div>
      </div>

      {/* Target User Profiles */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">👥</span>
          目标用户画像
        </h2>
        <div className="space-y-6">
          {caseData.audience.targetUsers.map((user, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="text-sm font-medium text-gray-900 mb-3">{user.persona}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">核心痛点</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {user.painPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">决策因素</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {user.decisionFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Opportunities */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          渠道机会
        </h2>
        <div className="space-y-3">
          {caseData.channelOpportunities.map((channel, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium {priorityColor[channel.priority]}">
                {priorityLabel[channel.priority]}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">{channel.channel}</div>
                <p className="text-sm text-gray-600">{channel.opportunity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Strategy */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          内容策略
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                ToFu 漏斗
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {caseData.contentStrategy.toFu.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-gray-400">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                MoFu 漏斗
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {caseData.contentStrategy.moFu.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-gray-400">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                BoFu 漏斗
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {caseData.contentStrategy.boFu.map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-gray-400">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">内容形式</div>
              <div className="flex flex-wrap gap-1">
                {caseData.contentStrategy.formats.map((format, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{format}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">发布渠道</div>
              <div className="flex flex-wrap gap-1">
                {caseData.contentStrategy.channels.map((channel, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">{channel}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">更新节奏</div>
              <p className="text-sm text-gray-700">{caseData.contentStrategy.rhythm}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Plan */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">📅</span>
          执行计划
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">30 天</div>
            <ul className="text-sm text-gray-700 space-y-2">
              {caseData.executionPlan.day30.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">60 天</div>
            <ul className="text-sm text-gray-700 space-y-2">
              {caseData.executionPlan.day60.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">90 天</div>
            <ul className="text-sm text-gray-700 space-y-2">
              {caseData.executionPlan.day90.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Expected Outcome */}
      <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          预期结果
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">曝光</div>
            <p className="text-sm text-gray-700">{caseData.expectedOutcome.exposure}</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">线索</div>
            <p className="text-sm text-gray-700">{caseData.expectedOutcome.leads}</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">转化</div>
            <p className="text-sm text-gray-700">{caseData.expectedOutcome.conversion}</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">品牌认知</div>
            <p className="text-sm text-gray-700">{caseData.expectedOutcome.brandAwareness}</p>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-500 mb-1">内容资产</div>
            <p className="text-sm text-gray-700">{caseData.expectedOutcome.contentAssets}</p>
          </div>
        </div>
      </div>

      {/* Suggested Actions */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          建议动作
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {caseData.actions.map((action, idx) => (
            <button
              key={idx}
              className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">
                {action.type === 'video' && '🎬'}
                {action.type === 'image' && '🖼️'}
                {action.type === 'ad' && '📢'}
                {action.type === 'listing' && '📝'}
                {action.type === 'blog' && '📄'}
                {action.type === 'landing' && '🌐'}
                {action.type === 'email' && '📧'}
                {action.type === 'doc' && '📚'}
                {action.type === 'report' && '📊'}
                {action.type === 'case' && '📋'}
                {action.type === 'ppt' && '📽️'}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
