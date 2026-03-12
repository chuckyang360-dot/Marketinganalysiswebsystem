import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { History as HistoryIcon, AlertCircle, Eye, X, Clock, Twitter, TrendingUp, Users, AlertTriangle, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { getToken, logout, fetchAnalysisHistory, fetchTaskDetail, type TaskDetail } from '../lib/auth';

interface HistoryItem {
  id: number;
  keyword: string;
  summary: string;
  timestamp: string;
}

export function History() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Safe effect - only runs once on mount with empty dependency array
  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) setLoading(true);
      try {
        const data = await fetchAnalysisHistory(token);
        const tasks = data.tasks || [];

        // Transform to minimal data structure
        const xHistory: HistoryItem[] = tasks
          .filter((task: any) => task.keyword)
          .map((task: any) => ({
            id: task.id || Date.now(),
            keyword: String(task.keyword || 'N/A'),
            summary: JSON.stringify(task.progress || {}),
            timestamp: task.created_at || new Date().toISOString(),
          }));

        if (isMounted) {
          setHistory(xHistory);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
        if (isMounted) {
          if ((error as any).status === 401) {
            logout();
          }
          toast.error('加载历史记录失败');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array = only runs once

  const handleViewDetails = async (taskId: number) => {
    const token = getToken();
    if (!token) {
      logout();
      return;
    }

    setDetailLoading(true);
    try {
      const detail = await fetchTaskDetail(token, taskId);
      setSelectedTask(detail);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to load task detail:', err);
      toast.error(`加载详情失败: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const renderSummary = (summary: string) => {
    try {
      const parsed = JSON.parse(summary);
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-50 rounded px-2 py-1 text-center">
              <div className="font-semibold text-gray-900">{parsed.total_mentions ?? 0}</div>
              <div className="text-gray-600">总提及</div>
            </div>
            <div className="bg-green-50 rounded px-2 py-1 text-center">
              <div className="font-semibold text-green-700">{parsed.positive_count ?? 0}</div>
              <div className="text-green-600">积极</div>
            </div>
            <div className="bg-red-50 rounded px-2 py-1 text-center">
              <div className="font-semibold text-red-700">{parsed.negative_count ?? 0}</div>
              <div className="text-red-600">消极</div>
            </div>
            <div className="bg-gray-100 rounded px-2 py-1 text-center">
              <div className="font-semibold text-gray-700">{parsed.neutral_count ?? 0}</div>
              <div className="text-gray-600">中性</div>
            </div>
          </div>
        );
      }
    } catch {
      // Not valid JSON, fallback to raw text
    }
    return <div className="text-sm text-gray-600">{summary}</div>;
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === '积极') return 'text-green-600';
    if (sentiment === '消极') return 'text-red-600';
    return 'text-gray-600';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-gray-600">加载中...</p>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <HistoryIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{t('history.title') || '历史记录'}</h1>
                <p className="text-gray-600 mt-1">{t('history.description') || '查看您的分析历史'}</p>
              </div>
            </div>
          </div>
          <Card className="p-12 text-center text-gray-500">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t('history.empty') || '暂无历史记录'}</p>
          </Card>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <HistoryIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{t('history.title') || '历史记录'}</h1>
              <p className="text-gray-600 mt-1">{t('history.description') || '查看您的分析历史'}</p>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="space-y-3">
                {/* Keyword and Time */}
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg text-gray-900">
                    {item.keyword}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                      {formatDate(item.timestamp)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                {renderSummary(item.summary)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-2xl font-bold">分析详情</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTask(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {detailLoading ? (
                    <div className="text-center py-12 text-gray-500">
                      加载详情中...
                    </div>
                  ) : (
                    <>
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-sky-50 rounded-lg p-4">
                          <div className="text-sm text-sky-600 mb-1">品牌关键词</div>
                          <div className="font-semibold text-lg text-sky-900">{selectedTask.keyword}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            查询时间
                          </div>
                          <div className="font-semibold text-gray-900">{formatDate(selectedTask.created_at)}</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-gray-900">{selectedTask.stats.total_mentions}</div>
                          <div className="text-sm text-gray-600 mt-1">总提及</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-green-700">{selectedTask.stats.positive_count}</div>
                          <div className="text-sm text-green-600 mt-1">积极</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-red-700">{selectedTask.stats.negative_count}</div>
                          <div className="text-sm text-red-600 mt-1">消极</div>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-gray-700">{selectedTask.stats.neutral_count}</div>
                          <div className="text-sm text-gray-600 mt-1">中性</div>
                        </div>
                      </div>
                      {/* AI Summary */}
{selectedTask.summary && selectedTask.summary !== 'N/A' && (
  <div className="bg-emerald-50 border-2 border-emerald-100 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-base font-semibold text-emerald-900 mb-2">AI 分析总结</h3>
        <p className="text-sm text-emerald-800">{selectedTask.summary}</p>
      </div>
    </div>
  </div>
)}
                      {/* Mentions */}
                      {selectedTask.mentions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Twitter className="w-5 h-5 text-sky-600" />
                            <h3 className="text-lg font-semibold">品牌提及</h3>
                            <span className="ml-auto text-sm text-gray-500">共 {selectedTask.mentions.length} 条</span>
                          </div>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {selectedTask.mentions.map((mention, i) => (
                              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-sm mb-2 text-gray-900">{mention.text}</p>
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span>@{mention.author}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                      <span className="text-red-500">♥</span>
                                      <span>{mention.engagement}</span>
                                    </span>
                                    <span className={getSentimentColor(mention.sentiment)}>
                                      {mention.sentiment}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Competitors */}
                      {selectedTask.competitors.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold">竞品账号</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.competitors.map((comp, i) => (
                              <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtags */}
                      {selectedTask.hashtags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Hash className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">话题标签</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.hashtags.map((tag, i) => (
                              <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sentiment Trend */}
                      {selectedTask.sentimentTrend.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold">情绪趋势</h3>
                          </div>
                          <div className="space-y-2">
                            {selectedTask.sentimentTrend.map((trend, i) => (
                              <div key={i} className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 w-12">{trend.date}</span>
                                <div className="flex-1 flex gap-2 h-8">
                                  <div
                                    className="bg-green-100 rounded flex items-center justify-center text-xs font-medium text-green-700"
                                    style={{ width: `${(trend.positive / (trend.positive + trend.negative)) * 100}%` }}
                                  >
                                    {trend.positive}%
                                  </div>
                                  <div
                                    className="bg-red-100 rounded flex items-center justify-center text-xs font-medium text-red-700"
                                    style={{ width: `${(trend.negative / (trend.positive + trend.negative)) * 100}%` }}
                                  >
                                    {trend.negative}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Influencers */}
                      {selectedTask.influencers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold">关键影响者</h3>
                          </div>
                          <div className="space-y-2">
                            {selectedTask.influencers.map((influencer, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                  <div className="font-medium text-gray-900">{influencer.name}</div>
                                  <div className="text-sm text-gray-600">{influencer.followers.toLocaleString()} 粉丝</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  influencer.influence === '高' ? 'bg-red-100 text-red-700' :
                                  influencer.influence === '中' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {influencer.influence}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alerts */}
{selectedTask.alerts.length > 0 ? (
  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-3">
      <AlertTriangle className="w-5 h-5 text-amber-600" />
      <h3 className="text-lg font-semibold text-amber-900">风险预警</h3>
    </div>

    <ul className="space-y-2">
      {selectedTask.alerts.map((alert, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
          <span className="text-amber-600 mt-0.5 flex-shrink-0">△</span>
          <span>{alert}</span>
        </li>
      ))}
    </ul>
  </div>
) : (
  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-300" />
      <div>
        <h3 className="text-lg font-semibold text-amber-900">风险预警</h3>
        <p className="text-sm text-amber-700">当前结果中未检测到风险</p>
      </div>
    </div>
  </div>
)}
