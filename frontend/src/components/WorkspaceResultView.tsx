import type { FullAnalysisResponse } from '../types/analysis';
import { useLanguage } from '../contexts/LanguageContext';
import { EvidenceSection } from './EvidenceSection';
import { getWorkspaceReportSections } from '../utils/reportSections';

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
    mentions: [],
  },
  seo_analysis: {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: [],
  },
  x_analysis: {
    summary: '',
    stats: { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 },
    alerts: [],
    topics: [],
    mentions: [],
  },
  gap_analysis: {
    reddit_topics: [],
    seo_topics: [],
    opportunities: [],
  },
  content_ideas: [],
};

export function WorkspaceResultView({ data }: Props) {
  const { language: lang } = useLanguage();
  const safeData = (data as FullAnalysisResponse) || EMPTY_DATA;

  const reportSections = getWorkspaceReportSections(lang);
  const labelById = Object.fromEntries(reportSections.map((s) => [s.id, s.label])) as Record<
    string,
    string
  >;
  // 顶层 section 的 ids/order 由 reportSections 统一提供
  const [
    executiveSection,
    marketSection,
    keyFindingsSection,
    strategySection,
    methodsSection,
    contentPlanSection,
    evidenceSection,
  ] = reportSections;

  const labels = {
    zh: {
      executive: '执行摘要',
      market: '市场分析',
      keyFindings: '关键发现',
      strategy: '策略建议',
      methods: '执行方法',
      contentPlan: '内容规划',
      evidence: '证据',
      strategyJudgment: '市场判断',
      channels: '推荐渠道',
      positioning: '品牌定位',
      articles: '文章',
      social: '社媒',
      video: '视频',
      poster: '海报',
      generate: '生成内容 →',
    },
    en: {
      executive: 'Executive Summary',
      market: 'Market Analysis',
      keyFindings: 'Key Findings',
      strategy: 'Strategy',
      methods: 'Methods',
      contentPlan: 'Content Plan',
      evidence: 'Evidence',
      strategyJudgment: 'Market Judgment',
      channels: 'Recommended Channels',
      positioning: 'Brand Positioning',
      articles: 'Articles',
      social: 'Social',
      video: 'Video',
      poster: 'Poster',
      generate: 'Generate content →',
    },
  }[lang];

  const report = safeData.report as any;
  const strategy_recommendations = (report?.strategy_recommendations ?? []) as Array<any>;
  const methods = (report?.methods ?? []) as Array<any>;
  const content_plan = report?.content_plan ?? {};

  return (
    <div className="space-y-8">
      {/* 1️⃣ Executive Summary */}
      <section
        id={executiveSection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[executiveSection.id]}</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {report?.executive_summary || '暂无数据'}
        </p>
      </section>

      {/* 2️⃣ Market Analysis */}
      <section
        id={marketSection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[marketSection.id]}</h2>
        <p className="text-gray-700 whitespace-pre-line">{report?.market_analysis || ''}</p>
      </section>

      {/* 3️⃣ Key Findings */}
      <section
        id={keyFindingsSection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[keyFindingsSection.id]}</h2>
        <ul className="space-y-2">
          {(report?.key_findings ?? []).map((item: string, i: number) => (
            <li
              key={i}
              className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800 leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* 4️⃣ Strategy（两层：大标题 + 小标签） */}
      <section
        id={strategySection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[strategySection.id]}</h2>

        <div className="space-y-4">
          {strategy_recommendations.map((strategy, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 p-6 bg-gray-50 space-y-4">
              <div className="text-sm font-semibold text-gray-700">{labels.strategyJudgment}</div>
              <p className="text-gray-800 whitespace-pre-line">{strategy.market_judgment}</p>

              {strategy.channels && strategy.channels.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-600">{labels.channels}</div>
                  <div className="flex flex-wrap gap-2">
                    {strategy.channels.map((channel: string, chIdx: number) => (
                      <span
                        key={chIdx}
                        className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {strategy.positioning && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-600">{labels.positioning}</div>
                  <p className="text-gray-700 whitespace-pre-line">{strategy.positioning}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5️⃣ Methods（两层：大标题 + 方法卡片，不使用三级标题） */}
      <section
        id={methodsSection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[methodsSection.id]}</h2>

        <div className="space-y-4">
          {methods.map((m: any, i: number) => (
            <div key={i} className="rounded-xl border border-gray-200 p-6 bg-gray-50">
              <div className="font-semibold text-lg text-gray-900">{m.name}</div>

              {Array.isArray(m.steps) && m.steps.length > 0 && (
                <ol className="list-decimal list-inside mt-3 space-y-1 text-gray-700 text-sm">
                  {m.steps.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              )}

              {Array.isArray(m.metrics) && m.metrics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {m.metrics.map((metric: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6️⃣ Content Plan（两层：大标题 + 分组卡片标签） */}
      <section
        id={contentPlanSection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[contentPlanSection.id]}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Articles */}
          <div className="bg-gray-50 p-5 rounded-xl flex flex-col gap-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{labels.articles}</div>
              <button className="text-blue-600 text-sm font-medium hover:underline" type="button">
                {labels.generate}
              </button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {(content_plan?.articles ?? []).map((item: any, i: number) => {
                const outline = Array.isArray(item.outline) ? item.outline.join('\n') : item.outline || '';
                return (
                  <li key={i}>
                    <div className="font-semibold">{item.title}</div>
                    {outline && (
                      <div className="text-sm text-gray-600 whitespace-pre-line mt-1">{outline}</div>
                    )}
                    {item.estimated_length && (
                      <div className="text-xs text-gray-500 mt-1">预估长度：{item.estimated_length}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social */}
          <div className="bg-gray-50 p-5 rounded-xl flex flex-col gap-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{labels.social}</div>
              <button className="text-blue-600 text-sm font-medium hover:underline" type="button">
                {labels.generate}
              </button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {(content_plan?.social_posts ?? []).map((item: any, i: number) => (
                <li key={i}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{item.platform}</span>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <span className="text-gray-400">
                        {item.hashtags.map((h: string) => `#${h}`).join(' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">{item.content}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Video */}
          <div className="bg-gray-50 p-5 rounded-xl flex flex-col gap-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{labels.video}</div>
              <button className="text-blue-600 text-sm font-medium hover:underline" type="button">
                {labels.generate}
              </button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {(content_plan?.video_ideas ?? []).map((item: any, i: number) => {
                const scriptOutline = Array.isArray(item.script_outline)
                  ? item.script_outline.join('\n')
                  : item.script_outline || '';
                return (
                  <li key={i}>
                    <div className="font-semibold">{item.title}</div>
                    {scriptOutline && (
                      <div className="text-sm text-gray-600 whitespace-pre-line mt-1">{scriptOutline}</div>
                    )}
                    {item.estimated_duration && (
                      <div className="text-xs text-gray-500 mt-1">预估时长：{item.estimated_duration}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Poster */}
          <div className="bg-gray-50 p-5 rounded-xl flex flex-col gap-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{labels.poster}</div>
              <button className="text-blue-600 text-sm font-medium hover:underline" type="button">
                {labels.generate}
              </button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {(content_plan?.poster_ideas ?? []).map((item: any, i: number) => (
                <li key={i}>
                  <div className="font-semibold">{item.headline}</div>
                  {item.key_message && <div className="text-sm text-gray-700 mt-1">{item.key_message}</div>}
                  {item.cta_text && <div className="text-xs text-gray-500 mt-1">CTA：{item.cta_text}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7️⃣ Evidence（放最后） */}
      <section
        id={evidenceSection.id}
        className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{labelById[evidenceSection.id]}</h2>
        <EvidenceSection data={safeData} />
      </section>
    </div>
  );
}