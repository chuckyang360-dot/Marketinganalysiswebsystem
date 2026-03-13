import { MessageSquare, TrendingUp, AlertCircle, Users } from 'lucide-react';
import type { RedditAnalysis } from '../types/analysis';

interface Props {
  data: RedditAnalysis;
}

export function RedditSection({ data }: Props) {
  const { summary, sentiment, topics, alerts, mentions } = data;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Reddit 分析</h2>
      </div>

      {summary && (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl">
          <p className="text-gray-800">{summary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <SentimentCard sentiment={sentiment} />
        <TopicsCard topics={topics} />
      </div>

      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            关注事项
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-red-900">{alert.message}</span>
                    {alert.count !== undefined && (
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                        {alert.count}
                      </span>
                    )}
                    {alert.level && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                        {alert.level}
                      </span>
                    )}
                  </div>
                  {alert.affected_users && alert.affected_users.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-700">
                      <Users className="w-3.5 h-3.5" />
                      <span>{alert.affected_users.slice(0, 3).join(', ')}{alert.affected_users.length > 3 ? ` 等${alert.affected_users.length}人` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mentions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            热门讨论 ({mentions.length})
          </h3>
          <div className="space-y-3">
            {mentions.slice(0, 5).map((mention, idx) => (
              <MentionCard key={idx} mention={mention} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SentimentCard({ sentiment }: { sentiment: RedditAnalysis['sentiment'] }) {
  const sentimentTotal = sentiment.positive + sentiment.negative + sentiment.neutral;
  const getPercent = (value: number) =>
    sentimentTotal > 0 ? Math.round((value / sentimentTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        情绪分析
      </h3>
      <div className="space-y-3">
        <SentimentBar label="正面" value={getPercent(sentiment.positive)} color="bg-green-500" />
        <SentimentBar label="中性" value={getPercent(sentiment.neutral)} color="bg-gray-400" />
        <SentimentBar label="负面" value={getPercent(sentiment.negative)} color="bg-red-500" />
      </div>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TopicsCard({ topics }: { topics: string[] }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        热门话题 ({topics.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}

function MentionCard({ mention }: { mention: RedditAnalysis['mentions'][0] }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 mb-1 truncate">{mention.title}</h4>
          {mention.content && (
            <p className="text-sm text-gray-500 line-clamp-2">{mention.content}</p>
          )}
        </div>
        {mention.score && (
          <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{mention.score}</span>
          </div>
        )}
      </div>
      {mention.url && (
        <a
          href={mention.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-600 hover:text-orange-700 mt-2 block"
        >
          查看原文 →
        </a>
      )}
    </div>
  );
}
