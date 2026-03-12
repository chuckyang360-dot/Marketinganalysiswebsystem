import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  History as HistoryIcon,
  Eye,
  X,
  Clock,
  Twitter,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getToken, logout, fetchAnalysisHistory, fetchTaskDetail } from '../lib/auth';

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
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
        const tasks = data?.tasks || [];

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
      } catch (error: any) {
        console.error('Failed to load history:', error);
        if (isMounted) {
          if (error?.status === 401) {
            logout();
          }
          toast.error('加载历史记录失败');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewDetails = async (taskId: number) => {
    const token = getToken();
    if (!token) {
      toast.error('请先登录');
      return;
    }

    try {
      setDetailLoading(true);
      const detail = await fetchTaskDetail(token, taskId);
      setSelectedTask(detail);
    } catch (err: any) {
      console.error('Failed to fetch detail:', err);
      toast.error(`加载详情失败：${err?.message || '未知错误'}`);
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
      // ignore parse error
    }

    return <div className="text-sm text-gray-600">{summary}</div>;
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === '积极') return 'text-green-600';
    if (sentiment === '消极') return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-10 text-center text-gray-500">加载中...</Card>
        </div>
      </div>
    );
  }

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
              <p className="text-gray-600 mt-1">
                {t('history.description') || '查看您的分析历史'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {history.length === 0 ? (
            <Card className="p-10 text-center text-gray-500">暂无历史记录</Card>
          ) : (
            history.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg text-gray-900">{item.keyword}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">{formatDate(item.timestamp)}</div>
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

                  {renderSummary(item.summary)}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-2xl font-bold">分析详情</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {detailLoading ? (
                  <div className="p-10 text-center text-gray-500">加载详情中...</div>
                ) : (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-600 mb-2">品牌关键词</div>
                        <div className="text-3xl font-bold">
                          {selectedTask.keyword || selectedTask.brand || 'N/A'}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Clock className="w-4 h-4" />
                          查询时间
                        </div>
                        <div className="text-3xl font-bold">
                          {formatDate(selectedTask.created_at || new Date().toISOString())}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-gray-700">
                          {selectedTask.stats?.total_mentions ?? selectedTask.mentions?.length ?? 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">总提及</div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-700">
                          {selectedTask.stats?.positive_count ?? 0}
                        </div>
                        <div className="text-sm text-green-600 mt-1">积极</div>
                      </div>

                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-700">
                          {selectedTask.stats?.negative_count ?? 0}
                        </div>
                        <div className="text-sm text-red-600 mt-1">消极</div>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-gray-700">
                          {selectedTask.stats?.neutral_count ?? 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">中性</div>
                      </div>
                    </div>

                    {selectedTask.summary && selectedTask.summary !== 'N/A' && (
                      <div className="bg-emerald-50 border-2 border-emerald-100 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-base font-semibold text-emerald-900 mb-2">
                              AI 分析总结
                            </h3>
                            <p className="text-sm text-emerald-800">{selectedTask.summary}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTask.mentions?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Twitter className="w-5 h-5 text-sky-600" />
                          <h3 className="text-lg font-semibold">品牌提及</h3>
                          <span className="ml-auto text-sm text-gray-500">
                            共 {selectedTask.mentions.length} 条
                          </span>
                        </div>

                        <div className="space-y-3">
                          {selectedTask.mentions.map((mention: any, i: number) => (
                            <div
                              key={i}
                              className="p-4 rounded-lg border border-gray-100 bg-gray-50"
                            >
                              <p className="text-gray-900">{mention.text}</p>
                              <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-gray-500">@{mention.author}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-500">
                                    ❤ {mention.engagement ?? 0}
                                  </span>
                                  <span className={getSentimentColor(mention.sentiment || '中性')}>
                                    {mention.sentiment || '中性'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTask.influencers?.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-semibold">关键影响者</h3>
                        </div>

                        <div className="space-y-2">
                          {selectedTask.influencers.map((influencer: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div>
                                <div className="font-medium text-gray-900">
                                  {influencer.name || influencer.author || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {(influencer.followers || 0).toLocaleString()} 粉丝
                                </div>
                              </div>
                              <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                {influencer.influence || 'unknown'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-purple-50 border-2 border-purple-100 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-purple-300" />
                          <div>
                            <h3 className="text-lg font-semibold text-purple-900">关键影响者</h3>
                            <p className="text-sm text-purple-700">
                              当前结果中未识别到高影响力账号
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTask.alerts?.length > 0 ? (
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <h3 className="text-lg font-semibold text-amber-900">风险预警</h3>
                        </div>

                        <ul className="space-y-2">
                          {selectedTask.alerts.map((alert: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-amber-900"
                            >
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
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}