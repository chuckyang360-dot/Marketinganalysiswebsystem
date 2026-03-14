import type { EvidenceItem, SentimentType } from '../types/analysis';

interface Props {
  item: EvidenceItem;
}

const PLATFORM_CONFIG: Record<EvidenceItem['platform'], { icon: string; color: string; label: string }> = {
  x: { icon: 'X', color: 'from-indigo-500 to-purple-500', label: 'X' },
  reddit: { icon: '💬', color: 'from-orange-500 to-red-500', label: 'Reddit' },
  seo: { icon: '🔍', color: 'from-blue-500 to-cyan-500', label: 'Web' },
  youtube: { icon: '▶️', color: 'from-red-500 to-pink-500', label: 'YouTube' },
  instagram: { icon: '📷', color: 'from-pink-500 to-purple-500', label: 'Instagram' },
};

const SENTIMENT_COLORS: Record<SentimentType, { bg: string; text: string; label: string }> = {
  positive: { bg: 'bg-green-50', text: 'text-green-600', label: '正面' },
  negative: { bg: 'bg-red-50', text: 'text-red-600', label: '负面' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', label: '中性' },
  mixed: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: '混合' },
};

export function EvidenceCard({ item }: Props) {
  const config = PLATFORM_CONFIG[item.platform];
  const sentimentInfo = item.analysis?.sentiment ? SENTIMENT_COLORS[item.analysis.sentiment] : null;

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Header: Platform & Author */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs text-white font-bold">{config.icon}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {item.source?.verified && <span className="text-xs text-blue-500">✓</span>}
            <span className="text-sm font-medium text-gray-900 truncate">
              {item.author || '未知作者'}
            </span>
          </div>
          {sentimentInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentInfo.bg} ${sentimentInfo.text} flex-shrink-0`}>
              {sentimentInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Original source weight signals (from raw platform data) */}
      {item.source && (
        <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
          {item.source.follower_count && item.source.follower_count > 0 && (
            <span>👥 {formatNumber(item.source.follower_count)}</span>
          )}
          {item.source.subscriber_count && item.source.subscriber_count > 0 && (
            <span>📺 {formatNumber(item.source.subscriber_count)}</span>
          )}
          {item.source.author_karma && item.source.author_karma > 0 && (
            <span>⚡ {formatNumber(item.source.author_karma)}</span>
          )}
          {item.source.domain_authority && item.source.domain_authority > 0 && (
            <span className="text-blue-500">DA {item.source.domain_authority}</span>
          )}
        </div>
      )}

      {/* Title (if exists) */}
      {item.title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">{item.title}</h4>
      )}

      {/* Content - Always show at least something */}
      {item.content ? (
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.content}</p>
      ) : item.title ? (
        <p className="text-sm text-gray-400 italic mb-2">无内容描述</p>
      ) : null}

      {/* Original metrics (from raw platform data) */}
      {item.metrics && (
        <div className="flex flex-wrap gap-2 mb-2">
          {item.metrics.likes && item.metrics.likes > 0 && (
            <span className="text-xs text-gray-500">❤️ {formatNumber(item.metrics.likes)}</span>
          )}
          {item.metrics.comments && item.metrics.comments > 0 && (
            <span className="text-xs text-gray-500">💬 {formatNumber(item.metrics.comments)}</span>
          )}
          {item.metrics.reposts && item.metrics.reposts > 0 && (
            <span className="text-xs text-gray-500">🔄 {formatNumber(item.metrics.reposts)}</span>
          )}
          {item.metrics.shares && item.metrics.shares > 0 && (
            <span className="text-xs text-gray-500">🔄 {formatNumber(item.metrics.shares)}</span>
          )}
          {item.metrics.views && item.metrics.views > 0 && (
            <span className="text-xs text-gray-500">👁️ {formatNumber(item.metrics.views)}</span>
          )}
          {item.metrics.upvotes && item.metrics.upvotes > 0 && (
            <span className="text-xs text-orange-500">👍 {formatNumber(item.metrics.upvotes)}</span>
          )}
          {item.metrics.score && item.metrics.score > 0 && (
            <span className="text-xs text-orange-500">⬆️ {formatNumber(item.metrics.score)}</span>
          )}
          {item.metrics.reach && item.metrics.reach > 0 && (
            <span className="text-xs text-purple-500">📡 {formatNumber(item.metrics.reach)}</span>
          )}
        </div>
      )}

      {/* Derived analysis metrics (system calculated) */}
      {item.analysis && (
        <div className="flex flex-wrap gap-2 mb-2">
          {item.analysis.engagement_rate && item.analysis.engagement_rate > 0 && (
            <span className="text-xs text-gray-400">
              互动率: {item.analysis.engagement_rate < 1 ? `${(item.analysis.engagement_rate * 100).toFixed(2)}%` : `${item.analysis.engagement_rate.toFixed(2)}%`}
            </span>
          )}
          {item.analysis.authority_score && item.analysis.authority_score > 0 && (
            <span className="text-xs text-blue-500">权威度: {item.analysis.authority_score.toFixed(1)}</span>
          )}
          {item.analysis.overall_weight && item.analysis.overall_weight > 0 && (
            <span className="text-xs text-purple-500">权重: {item.analysis.overall_weight.toFixed(1)}</span>
          )}
        </div>
      )}

      {/* Platform-specific metadata */}
      {item.metadata && (
        <div className="flex flex-wrap gap-2 mb-2">
          {item.metadata.subreddit && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">r/{item.metadata.subreddit}</span>
          )}
          {item.metadata.domain && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded truncate max-w-[150px]">{item.metadata.domain}</span>
          )}
          {item.metadata.published_at && (
            <span className="text-xs text-gray-400">
              {new Date(item.metadata.published_at).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>
      )}

      {/* Link */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
        >
          查看原文 →
        </a>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
