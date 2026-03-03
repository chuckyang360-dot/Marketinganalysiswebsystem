import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisLayout } from '../components/AnalysisLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Search, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface SEOResult {
  keywords: Array<{ keyword: string; volume: number; difficulty: string; trend: string }>;
  ranking: Array<{ page: string; currentRank: number; predictedRank: number }>;
  suggestions: string[];
}

export function SEOAnalysis() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    keywords: '',
    url: '',
    competitors: '',
  });
  const [result, setResult] = useState<SEOResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockResult: SEOResult = {
        keywords: formData.keywords.split(',').map((kw, i) => ({
          keyword: kw.trim(),
          volume: Math.floor(Math.random() * 50000) + 1000,
          difficulty: ['易', '中', '难'][Math.floor(Math.random() * 3)],
          trend: ['上升', '稳定', '下降'][Math.floor(Math.random() * 3)],
        })),
        ranking: [
          { page: '首页', currentRank: 15, predictedRank: 5 },
          { page: '产品页', currentRank: 28, predictedRank: 12 },
          { page: '博客文章', currentRank: 42, predictedRank: 18 },
        ],
        suggestions: [
          '优化页面标题标签，包含主要关键词',
          '增加内部链接，提升页面权重',
          '优化移动端体验，提升加载速度',
          '创建高质量外链，提升域名权威',
          '更新旧内容，保持内容新鲜度',
        ],
      };

      setResult(mockResult);
      setLoading(false);
      toast.success(t('common.success'));

      // Save to history
      const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'SEO',
        data: formData,
        result: mockResult,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 50)));
    }, 2000);
  };

  return (
    <AnalysisLayout
      title={t('seo.title')}
      description={t('seo.description')}
      icon={<Search className="w-7 h-7 text-white" />}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>{t('seo.input.keywords')}</Label>
              <Input
                placeholder={t('seo.input.keywords.placeholder')}
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>{t('seo.input.url')}</Label>
              <Input
                type="url"
                placeholder={t('seo.input.url.placeholder')}
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>{t('seo.input.competitors')}</Label>
              <Input
                placeholder={t('seo.input.competitors.placeholder')}
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('seo.button.analyze')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{t('seo.result.keywords')}</h3>
                </div>
                <div className="space-y-3">
                  {result.keywords.map((kw, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{kw.keyword}</div>
                        <div className="text-sm text-gray-600">
                          搜索量: {kw.volume.toLocaleString()} | 难度: {kw.difficulty}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">{kw.trend}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">{t('seo.result.ranking')}</h3>
                </div>
                <div className="space-y-3">
                  {result.ranking.map((rank, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{rank.page}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">#{rank.currentRank}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-green-600">#{rank.predictedRank}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold">{t('seo.result.suggestions')}</h3>
                </div>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>填写左侧表单开始分析</p>
            </Card>
          )}
        </div>
      </div>
    </AnalysisLayout>
  );
}
