import type { FullAnalysisResponse } from '../types/analysis';
import { EvidenceSection } from './EvidenceSection';
import { StrategySection } from './StrategySection';

interface Props {
  data: FullAnalysisResponse;
}

// 添加默认空数据，防止访问未定义字段时崩溃
const EMPTY_DATA: FullAnalysisResponse = {
  query: '',
  reddit_analysis: {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  },
  seo_analysis: {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  },
  x_analysis: {
    summary: '',
    stats: { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 },
    alerts: [],
    topics: [],
    mentions: []
  },
  gap_analysis: {
    reddit_topics: [],
    seo_topics: [],
    opportunities: []
  },
  content_ideas: []
};

export function WorkspaceResultView({ data }: Props) {
  // 使用数据或默认空数据
  const safeData = data || EMPTY_DATA;

  return (
    <div className="space-y-8">
      {/* 1️⃣ Executive Summary */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {safeData.report?.executive_summary || '暂无数据'}
        </p>
      </section>

      {/* 2️⃣ Market Analysis */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Market Analysis</h2>
        <p className="text-gray-700 whitespace-pre-line">
          {safeData.report?.market_analysis || ''}
        </p>
      </section>

      {/* 3️⃣ Key Findings */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Key Findings</h2>
        <ul className="space-y-2">
          {(safeData.report?.key_findings || []).map((item, i) => (
            <li key={i} className="bg-gray-50 p-3 rounded-lg">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 4️⃣ Strategy（复用 StrategySection） */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Strategy</h2>
        <StrategySection data={safeData} />
      </section>

      {/* 5️⃣ Methods */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Methods</h2>
        <div className="space-y-4">
          {(safeData.report?.methods || []).map((m, i) => (
            <div key={i} className="bg-gray-50 p-5 rounded-xl space-y-4">
              {/* 方法名称 */}
              <h4 className="font-semibold text-lg text-gray-900">{m.name}</h4>

              {/* 步骤 - 有序列表 */}
              {m.steps && m.steps.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-600 mb-2">步骤</h5>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                    {m.steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 指标 - 标签 */}
              {m.metrics && m.metrics.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-600 mb-2">关键指标</h5>
                  <div className="flex flex-wrap gap-2">
                    {m.metrics.map((metric, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6️⃣ Content Plan */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Content Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Articles */}
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Articles</h3>
              <button className="text-blue-600 text-sm">生成内容 →</button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {(safeData.report?.content_plan?.articles || []).map((item, i) => {
                const outline =
                  Array.isArray(item.outline) ? item.outline.join('\n') : item.outline || '';
                return (
                  <li key={i}>
                    <div className="font-semibold">{item.title}</div>
                    {outline && (
                      <div className="text-sm text-gray-600 whitespace-pre-line mt-1">
                        {outline}
                      </div>
                    )}
                    {item.estimated_length && (
                      <div className="text-xs text-gray-500 mt-1">
                        预估长度：{item.estimated_length}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social */}
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Social</h3>
              <button className="text-blue-600 text-sm">生成内容 →</button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {(safeData.report?.content_plan?.social_posts || []).map((item, i) => (
                <li key={i}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {item.platform}
                    </span>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <span className="text-gray-400">
                        {item.hashtags.map((h: string) => `#${h}`).join(' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {item.content}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Video */}
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Video</h3>
              <button className="text-blue-600 text-sm">生成内容 →</button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {(safeData.report?.content_plan?.video_ideas || []).map((item, i) => {
                const scriptOutline =
                  Array.isArray(item.script_outline)
                    ? item.script_outline.join('\n')
                    : item.script_outline || '';
                return (
                  <li key={i}>
                    <div className="font-semibold">{item.title}</div>
                    {scriptOutline && (
                      <div className="text-sm text-gray-600 whitespace-pre-line mt-1">
                        {scriptOutline}
                      </div>
                    )}
                    {item.estimated_duration && (
                      <div className="text-xs text-gray-500 mt-1">
                        预估时长：{item.estimated_duration}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Poster */}
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Poster</h3>
              <button className="text-blue-600 text-sm">生成内容 →</button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {(safeData.report?.content_plan?.poster_ideas || []).map((item, i) => (
                <li key={i}>
                  <div className="font-semibold">{item.headline}</div>
                  {item.key_message && (
                    <div className="text-sm text-gray-700 mt-1">{item.key_message}</div>
                  )}
                  {item.cta_text && (
                    <div className="text-xs text-gray-500 mt-1">CTA：{item.cta_text}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7️⃣ Evidence（放最后，复用 EvidenceSection） */}
      <section className="bg-white rounded-2xl p-8 border shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Evidence</h2>
        <EvidenceSection data={safeData} />
      </section>
    </div>
  );
}
