import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function EvidenceSection({ data }: Props) {
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
            {reddit_analysis.mentions?.length || 0} 条讨论
          </span>
        </div>

        {/* Reddit Sentiment */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{reddit_analysis.sentiment.positive}</div>
            <div className="text-sm text-gray-600 mt-1">正面</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{reddit_analysis.sentiment.negative}</div>
            <div className="text-sm text-gray-600 mt-1">负面</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{reddit_analysis.sentiment.neutral}</div>
            <div className="text-sm text-gray-600 mt-1">中性</div>
          </div>
        </div>

        {/* Reddit Mentions */}
        <div className="space-y-3">
          {(reddit_analysis.mentions ?? []).slice(0, 5).map((mention, idx) => {
            const preview = mention.title || mention.content || '';
            const truncated = preview.length > 100 ? preview.slice(0, 100) + '...' : preview;
            return (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-900 mb-1">{preview}</div>
                <div className="text-xs text-gray-500">Reddit</div>
                {mention.url && (
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    查看原文
                  </a>
                )}
                {preview.length > 100 && (
                  <div className="text-xs text-gray-600 mt-2 truncate">{truncated}</div>
                )}
              </div>
            );
          })}
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
            {seo_analysis.mentions?.length || 0} 条内容
          </span>
        </div>

        {/* SEO Sentiment */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{seo_analysis.sentiment.positive}</div>
            <div className="text-sm text-gray-600 mt-1">正面</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{seo_analysis.sentiment.negative}</div>
            <div className="text-sm text-gray-600 mt-1">负面</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{seo_analysis.sentiment.neutral}</div>
            <div className="text-sm text-gray-600 mt-1">中性</div>
          </div>
        </div>

        {/* SEO Mentions */}
        <div className="space-y-3">
          {(seo_analysis.mentions ?? []).slice(0, 5).map((mention, idx) => {
            const preview = mention.title || mention.content || '';
            const truncated = preview.length > 100 ? preview.slice(0, 100) + '...' : preview;
            return (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-900 mb-1">{preview}</div>
                <div className="text-xs text-gray-500">Web</div>
                {mention.url && (
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    查看原文
                  </a>
                )}
                {preview.length > 100 && (
                  <div className="text-xs text-gray-600 mt-2 truncate">{truncated}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X Sentiment Evidence */}
      {x_analysis && x_analysis.stats.total_mentions > 0 && (
        <div id="section-x-sentiment" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">X 舆情证据</h2>
            <span className="text-sm text-gray-500 ml-2">
              {x_analysis.stats.total_mentions} 条提及
            </span>
          </div>

          {/* X Sentiment */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{x_analysis.stats.positive_count}</div>
              <div className="text-sm text-gray-600 mt-1">正面</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{x_analysis.stats.negative_count}</div>
              <div className="text-sm text-gray-600 mt-1">负面</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{x_analysis.stats.neutral_count}</div>
              <div className="text-sm text-gray-600 mt-1">中性</div>
            </div>
          </div>

          {/* X Mentions */}
          <div className="space-y-3">
            {(x_analysis.mentions ?? []).slice(0, 5).map((mention, idx) => {
              const author = mention.author || 'Unknown';
              const text = mention.text || '';
              const engagement = mention.engagement ?? 0;
              const sentiment = mention.sentiment || '中性';
              return (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-900 mb-1">{author}</div>
                  <div className="text-sm text-gray-600 mb-2">{text}</div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>互动: {engagement}</span>
                    <span>情绪: {sentiment}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
