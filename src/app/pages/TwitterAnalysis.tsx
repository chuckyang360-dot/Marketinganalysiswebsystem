import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisLayout } from '../components/AnalysisLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Twitter, TrendingUp, Users, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getToken, logout, fetchAnalysisHistory } from '../lib/auth';

interface TwitterResult {
  mentions: Array<{ text: string; author: string; engagement: number; sentiment: string }>;
  sentimentTrend: Array<{ date: string; positive: number; negative: number }>;
  influencers: Array<{ name: string; followers: number; influence: string }>;
  alerts: string[];
  summary?: string;  // AI 分析总结
  topics?: string[]; // 热门话题
}

export function TwitterAnalysis() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [formData, setFormData] = useState({
    brand: '',
    competitors: '',
    hashtags: '',
  });
  const [result, setResult] = useState<TwitterResult | null>(null);
  const [queryTime, setQueryTime] = useState<string | null>(null);

  // 检查 token 是否有效
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/x-analysis/history`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.status === 401 || response.status === 404) {
            logout();
            toast.error('登录已过期，请重新登录');
            navigate('/login');
          }
        } catch (error) {
          // 忽略检查错误
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQueryTime(null);
    setAnalysisStep('fetching');

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 模拟分析进度
      setTimeout(() => setAnalysisStep('analyzing'), 1000);
      setTimeout(() => setAnalysisStep('processing'), 2500);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/x-analysis`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brand: formData.brand,
          competitors: formData.competitors ? formData.competitors.split(',').map(s => s.trim()).filter(s => s) : [],
          hashtags: formData.hashtags ? formData.hashtags.split(',').map(s => s.trim()).filter(s => s) : [],
        }),
      });

      if (response.status === 401 || response.status === 404) {
        logout();
        toast.error('登录已过期，请重新登录');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || '请求失败');
      }

      const data = await response.json();
      setResult(data);
      setAnalysisStep('');
      setQueryTime(new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
      toast.success('分析完成');

      // 刷新历史记录
      if (token) {
        try {
          await fetchAnalysisHistory(token);
        } catch (error) {
          console.error('Failed to refresh history:', error);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const message = error instanceof Error ? error.message : '分析失败，请重试';
      toast.error(message);
    } finally {
      setLoading(false);
      setAnalysisStep('');
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === '积极') return 'text-green-600';
    if (sentiment === '消极') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <AnalysisLayout
      title={t('twitter.title')}
      description={t('twitter.description')}
      icon={<Twitter className="w-7 h-7 text-white" />}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>{t('twitter.input.brand')}</Label>
              <Input
                placeholder={t('twitter.input.brand.placeholder')}
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>{t('twitter.input.competitors')}</Label>
              <Input
                placeholder={t('twitter.input.competitors.placeholder')}
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('twitter.input.hashtags')}</Label>
              <Input
                placeholder={t('twitter.input.hashtags.placeholder')}
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600"
              disabled={loading}
            >
              {loading ? '分析中...' : t('twitter.button.analyze')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Twitter className="w-16 h-16 text-sky-600 animate-bounce" />
                <h3 className="text-xl font-semibold text-gray-900">分析中...</h3>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center justify-center gap-2 text-sky-600 ${analysisStep === 'fetching' ? 'font-semibold' : 'text-gray-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${analysisStep === 'fetching' ? 'bg-sky-600' : 'bg-gray-300'}`} />
                    正在抓取 X 数据...
                  </div>
                  <div className={`flex items-center justify-center gap-2 text-sky-600 ${analysisStep === 'analyzing' ? 'font-semibold' : 'text-gray-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${analysisStep === 'analyzing' ? 'bg-sky-600' : 'bg-gray-300'}`} />
                    正在进行 AI 情绪分析...
                  </div>
                  <div className={`flex items-center justify-center gap-2 text-sky-600 ${analysisStep === 'processing' ? 'font-semibold' : 'text-gray-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${analysisStep === 'processing' ? 'bg-sky-600' : 'bg-gray-300'}`} />
                    正在整理结果...
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-4">请稍候，这可能需要几秒钟</p>
              </div>
            </Card>
          ) : result ? (
            <>
              {/* Query Info */}
              <Card className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-sky-100">
                <div className="flex items-center gap-3 text-sm">
                  <Twitter className="w-5 h-5 text-sky-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sky-900">分析关键词：{formData.brand}</div>
                    <div className="text-sky-700 mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      查询时间：{queryTime}
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI 分析总结 */}
              {result.summary && (
                <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-semibold text-emerald-900 mb-2">AI 分析总结</h3>
                      <p className="text-sm text-emerald-800">{result.summary}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* 品牌提及 */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Twitter className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.mentions')}</h3>
                  <span className="ml-auto text-sm text-gray-500">共 {result.mentions.length} 条</span>
                </div>
                <div className="space-y-3">
                  {result.mentions.map((mention, i) => (
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
              </Card>

              {/* 情绪趋势 */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.sentiment')}</h3>
                </div>
                <div className="space-y-3">
                  {result.sentimentTrend.map((trend, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-16">{trend.date}</span>
                      <div className="flex-1 flex gap-2 h-8">
                        <div
                          className="flex-1 bg-green-100 rounded flex items-center justify-center text-xs font-medium text-green-700"
                          style={{ width: `${(trend.positive / (trend.positive + trend.negative)) * 100}%` }}
                        >
                          {trend.positive}%
                        </div>
                        <div
                          className="flex-1 bg-red-100 rounded flex items-center justify-center text-xs font-medium text-red-700"
                          style={{ width: `${(trend.negative / (trend.positive + trend.negative)) * 100}%` }}
                        >
                          {trend.negative}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 关键影响者 */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.influencers')}</h3>
                </div>
                <div className="space-y-3">
                  {result.influencers && result.influencers.length > 0 ? (
                    result.influencers.map((influencer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">@{influencer.name}</div>
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
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">暂无高价值影响者</p>
                      <p className="text-xs text-gray-400">当前结果中未识别到高影响力账号</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* 风险预警 */}
              <Card className="p-6 border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-900">{t('twitter.result.alerts')}</h3>
                </div>
                <ul className="space-y-3">
                  {result.alerts && result.alerts.map((alert, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* 查看历史 */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/history')}
              >
                <Clock className="w-4 h-4 mr-2" />
                查看历史记录
              </Button>
            </>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <Twitter className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>填写左侧表单开始分析</p>
            </Card>
          )}
        </div>
      </div>
    </AnalysisLayout>
  );
}
