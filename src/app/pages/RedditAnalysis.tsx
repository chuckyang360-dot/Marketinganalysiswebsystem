import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisLayout } from '../components/AnalysisLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { TrendingUp, MessageCircle, Heart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  summary: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topics: string[];
  alerts: Array<{
    level: string;
    message: string;
    count: number;
    affected_users: string[];
  }>;
  mentions: Array<{
    id: string;
    platform: string;
    author: string;
    author_username: string;
    author_display_name: string;
    text: string;
    url: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    followers: number;
    sentiment: string;
    sentiment_score: number;
    influencer_tier: string;
    platform_metadata: Record<string, any>;
    raw: any;
  }>;
}

interface AnalysisRequest {
  keywords: string;
  subreddits: string;
  limit?: number;
}

export function RedditAnalysis() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subreddits: '',
    keywords: '',
    timeRange: '7d',
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Helper function to safely get nested values
  const getSentimentValue = (value: any) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      return value.positive || value.negative || value.neutral || 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reddit-analysis/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: formData.keywords,
          subreddits: formData.subreddits,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        toast.error(data.summary || t('common.error'));
      } else {
        setResult(data);
        toast.success(t('common.success'));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnalysisLayout
      title={t('reddit.title')}
      description={t('reddit.description')}
      icon={<TrendingUp className="w-7 h-7 text-white" />}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>{t('reddit.input.subreddits')}</Label>
              <Input
                placeholder={t('reddit.input.subreddits.placeholder')}
                value={formData.subreddits}
                onChange={(e) => setFormData({ ...formData, subreddits: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t('reddit.input.keywords')}</Label>
              <Input
                placeholder={t('reddit.input.keywords.placeholder')}
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t('reddit.input.timeRange')}</Label>
              <Select value={formData.timeRange} onValueChange={(value) => setFormData({ ...formData, timeRange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24小时</SelectItem>
                  <SelectItem value="7d">7天</SelectItem>
                  <SelectItem value="30d">30天</SelectItem>
                  <SelectItem value="90d">90天</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-red-600"
              disabled={loading}
              >
              {loading ? t('common.loading') : t('reddit.button.analyze')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        {result ? (
          <>
            {/* Topics */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.topics')}</h3>
                </div>
                <div className="space-y-3">
                  {result.topics.map((topic: string, i: number) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg text-white">
                      <div className="font-medium mb-1">{topic}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sentiment Analysis */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.sentiment')}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">积极</span>
                    <span className="text-sm font-medium text-green-600">{getSentimentValue(result.sentiment.positive)}%</span>
                  </div>
                  <div className="h-2 bg-green-600 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: `${getSentimentValue(result.sentiment.positive)}%` }} />
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">中性</span>
                    <span className="text-sm font-medium text-gray-600">{getSentimentValue(result.sentiment.neutral)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-600" style={{ width: `${getSentimentValue(result.sentiment.neutral)}%` }} />
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">消极</span>
                    <span className="text-sm font-medium text-red-600">{getSentimentValue(result.sentiment.negative)}%</span>
                  </div>
                  <div className="h-2 bg-red-600 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${getSentimentValue(result.sentiment.negative)}%` }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Mentions List */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.mentions')} ({result.mentions.length})</h3>
                </div>
                <div className="space-y-4">
                  {result.mentions.slice(0, 20).map((mention: any, i: number) => (
                    <div key={mention.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="mb-3">
                        <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          <div className="font-medium mb-1">{mention.author_username || mention.author || '匿名'}</div>
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{mention.text}</p>
                        </a>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(mention.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{mention.platform}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.summary')}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.summary}
                </p>
              </Card>
            </div>

            {/* Alerts */}
            {(result.alerts && result.alerts.length > 0) && (
              <div className="space-y-6">
                <Card className="p-6 border-l-4 border-orange-400 bg-orange-50">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">{t('reddit.result.alerts')} ({result.alerts.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {result.alerts.map((alert: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-start gap-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            alert.level === 'critical' ? 'bg-red-600 text-white' :
                            alert.level === 'high' ? 'bg-orange-500 text-white' :
                            alert.level === 'warning' ? 'bg-yellow-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {alert.count}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium mb-1">{alert.message}</div>
                            {alert.affected_users.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                涉及: {alert.affected_users.slice(0, 2).join(', ')}...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>填写左侧表单开始分析</p>
          </Card>
        )}
      </div>
    </AnalysisLayout>
  );
}
