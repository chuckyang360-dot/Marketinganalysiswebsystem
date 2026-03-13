import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function EvidenceSection({ data }: Props) {
  // 添加空值保护
  const reddit_analysis = data?.reddit_analysis || {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  };
  const seo_analysis = data?.seo_analysis || {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  };
  const x_analysis = data?.x_analysis || {
    summary: '',
    stats: { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 },
    alerts: [],
    topics: [],
    mentions: []
  };

  // 添加空值保护的辅助函数
  const redditSentiment = reddit_analysis?.sentiment || { positive: 0, negative: 0, neutral: 0 };
  const seoSentiment = seo_analysis?.sentiment || { positive: 0, negative: 0, neutral: 0 };
  const xStats = x_analysis?.stats || { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 };
  const redditMentions = reddit_analysis?.mentions || [];
  const seoMentions = seo_analysis?.mentions || [];
  const xMentions = x_analysis?.mentions || [];

  return (
    <div className="space-y-6">
      {/* Reddit Evidence */}
      <div id="section-reddit-evidence" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">💬</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Reddit 证据</h2>
          <span className="text-sm text-gray-500 ml-2">
            {redditSentiment.positive + redditSentiment.negative + redditSentiment.neutral} 条讨论
          </span>
        </div>

        {/* Reddit Sentiment */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{redditSentiment.positive}</div>
            <div className="text-sm text-gray-600 mt-1">正面</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{redditSentiment.negative}</div>
            <div className="text-sm text-gray-600 mt-1">负面</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{redditSentiment.neutral}</div>
            <div className="text-sm text-gray-600 mt-1">中性</div>
          </div>
        </div>

        {/* Reddit Mentions */}
        <div className="space-y-3">
          {redditMentions.slice(0, 5).map((mention, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm font-medium text-gray-900 mb-1">{mention.title}</div>
              <div className="text-xs text-gray-500">{mention.platform}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Evidence */}
      <div id="section-seo-evidence" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">SEO 证据</h2>
          <span className="text-sm text-gray-500 ml-2">
            {seoSentiment.positive + seoSentiment.negative + seoSentiment.neutral} 条内容
          </span>
        </div>

        {/* SEO Sentiment */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{seoSentiment.positive}</div>
            <div className="text-sm text-gray-600 mt-1">正面</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{seoSentiment.negative}</div>
            <div className="text-sm text-gray-600 mt-1">负面</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{seoSentiment.neutral}</div>
            <div className="text-sm text-gray-600 mt-1">中性</div>
          </div>
        </div>

        {/* SEO Mentions */}
        <div className="space-y-3">
          {seoMentions.slice(0, 5).map((mention, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm font-medium text-gray-900 mb-1">{mention.title}</div>
              <div className="text-xs text-gray-500">{mention.platform}</div>
            </div>
          ))}
        </div>
      </div>

      {/* X Sentiment Evidence */}
      {x_analysis && (
        <div id="section-x-sentiment" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">X 舆情证据</h2>
            <span className="text-sm text-gray-500 ml-2">
              {xStats.total_mentions} 条提及
            </span>
          </div>

          {/* X Sentiment */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{xStats.positive_count}</div>
              <div className="text-sm text-gray-600 mt-1">正面</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{xStats.negative_count}</div>
              <div className="text-sm text-gray-600 mt-1">负面</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{xStats.neutral_count}</div>
              <div className="text-sm text-gray-600 mt-1">中性</div>
            </div>
          </div>

          {/* X Mentions */}
          <div className="space-y-3">
            {xMentions.slice(0, 5).map((mention, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-900 mb-1">{mention.author}</div>
                <div className="text-sm text-gray-600 mb-2">{mention.text}</div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>互动: {mention.engagement}</span>
                  <span>情绪: {mention.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
