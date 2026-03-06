import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisLayout } from '../components/AnalysisLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Twitter, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TwitterResult {
  mentions: Array<{ text: string; author: string; engagement: number; sentiment: string }>;
  sentimentTrend: Array<{ date: string; positive: number; negative: number }>;
  influencers: Array<{ name: string; followers: number; influence: string }>;
  alerts: string[];
}

export function TwitterAnalysis() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    competitors: '',
    hashtags: '',
  });
  const [result, setResult] = useState<TwitterResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/x-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: formData.brand,
          competitors: formData.competitors,
          hashtags: formData.hashtags,
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const data = await response.json();
      setResult(data);
      toast.success(t('common.success'));

      // 保存到历史记录
      const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'Twitter',
        data: formData,
        result: data,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 50)));
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(t('common.error') || '分析失败，请重试');
    } finally {
      setLoading(false);
    }
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
              {loading ? t('common.loading') : t('twitter.button.analyze')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Twitter className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.mentions')}</h3>
                </div>
                <div className="space-y-3">
                  {result.mentions.map((mention, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm mb-2">{mention.text}</p>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{mention.author}</span>
                        <div className="flex items-center gap-3">
                          <span>♥ {mention.engagement}</span>
                          <span className={
                            mention.sentiment === '积极' ? 'text-green-600' :
                            mention.sentiment === '消极' ? 'text-red-600' : 'text-gray-600'
                          }>
                            {mention.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.sentiment')}</h3>
                </div>
                <div className="space-y-2">
                  {result.sentimentTrend.map((trend, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-12">{trend.date}</span>
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1 h-8 bg-green-100 rounded flex items-center justify-center text-xs font-medium text-green-700">
                          {trend.positive}%
                        </div>
                        <div className="flex-1 h-8 bg-red-100 rounded flex items-center justify-center text-xs font-medium text-red-700">
                          {trend.negative}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.influencers')}</h3>
                </div>
                <div className="space-y-3">
                  {result.influencers.map((influencer, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{influencer.name}</div>
                        <div className="text-sm text-gray-600">{influencer.followers.toLocaleString()} 粉丝</div>
                      </div>
                      <div className="text-sm font-medium text-purple-600">{influencer.influence}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold">{t('twitter.result.alerts')}</h3>
                </div>
                <ul className="space-y-2">
                  {result.alerts.map((alert, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </Card>
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
