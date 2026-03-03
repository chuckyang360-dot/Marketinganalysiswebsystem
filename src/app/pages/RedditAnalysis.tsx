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

interface RedditResult {
  trending: Array<{ title: string; subreddit: string; upvotes: number; comments: number }>;
  sentiment: { positive: number; neutral: number; negative: number };
  opportunities: string[];
}

export function RedditAnalysis() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subreddits: '',
    keywords: '',
    timeRange: '7d',
  });
  const [result, setResult] = useState<RedditResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const mockResult: RedditResult = {
        trending: [
          { title: 'AI营销工具推荐 - 2026年最新', subreddit: 'marketing', upvotes: 1245, comments: 89 },
          { title: '如何提升SEO排名？实战分享', subreddit: 'SEO', upvotes: 892, comments: 67 },
          { title: '社交媒体营销的5个技巧', subreddit: 'socialmedia', upvotes: 756, comments: 45 },
          { title: '内容营销案例分析', subreddit: 'content', upvotes: 634, comments: 38 },
        ],
        sentiment: {
          positive: 65,
          neutral: 25,
          negative: 10,
        },
        opportunities: [
          '用户对AI营销工具有强烈需求，可以针对性推出教程内容',
          'SEO相关话题热度持续走高，建议增加SEO相关内容输出',
          '社交媒体营销讨论活跃，可以参与社区互动建立品牌影响力',
          '内容营销案例分享受欢迎，可以制作相关案例库',
        ],
      };

      setResult(mockResult);
      setLoading(false);
      toast.success(t('common.success'));

      const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'Reddit',
        data: formData,
        result: mockResult,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 50)));
    }, 2000);
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
        <div className="space-y-6">
          {result ? (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.trending')}</h3>
                </div>
                <div className="space-y-3">
                  {result.trending.map((topic, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium mb-2">{topic.title}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>r/{topic.subreddit}</span>
                        <span>↑ {topic.upvotes}</span>
                        <span>💬 {topic.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.sentiment')}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">积极</span>
                      <span className="text-sm font-medium text-green-600">{result.sentiment.positive}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600" style={{ width: `${result.sentiment.positive}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">中性</span>
                      <span className="text-sm font-medium text-gray-600">{result.sentiment.neutral}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-600" style={{ width: `${result.sentiment.neutral}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">消极</span>
                      <span className="text-sm font-medium text-red-600">{result.sentiment.negative}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600" style={{ width: `${result.sentiment.negative}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{t('reddit.result.opportunities')}</h3>
                </div>
                <ul className="space-y-2">
                  {result.opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>填写左侧表单开始分析</p>
            </Card>
          )}
        </div>
      </div>
    </AnalysisLayout>
  );
}
