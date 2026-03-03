import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisLayout } from '../components/AnalysisLayout';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { BarChart3, Target, Lightbulb, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SummaryResult {
  insights: string[];
  strategies: string[];
  actions: Array<{ action: string; priority: string; timeline: string }>;
}

export function DataSummary() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    seoData: '',
    redditData: '',
    twitterData: '',
  });
  const [result, setResult] = useState<SummaryResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const mockResult: SummaryResult = {
        insights: [
          '目标关键词在搜索引擎中排名上升趋势明显，SEO优化效果显著',
          'Reddit社区对AI营销工具讨论热度持续走高，用户需求旺盛',
          'X平台品牌舆论整体积极，但需关注价格敏感度较高的用户群体',
          '内容营销投入产出比良好，建议加大优质内容产出力度',
          '竞争对手在社交媒体营销方面投入加大，需要制定差异化策略',
        ],
        strategies: [
          '持续优化SEO策略，重点关注长尾关键词和本地化搜索',
          '加强Reddit社区互动，建立品牌KOL影响力',
          '在X平台开展用户教育活动，突出产品价值而非价格',
          '建立内容营销矩阵，覆盖博客、视频、播客等多种形式',
          '开发产品差异化功能，提升品牌竞争力',
        ],
        actions: [
          { action: '启动关键词优化计划，目标排名前5', priority: '高', timeline: '本月' },
          { action: '组织Reddit AMA活动，提升品牌知名度', priority: '高', timeline: '下周' },
          { action: '制作产品价值对比内容，发布到X平台', priority: '中', timeline: '本周' },
          { action: '建立内容日历，规划未来3个月内容', priority: '中', timeline: '本月' },
          { action: '调研用户需求，规划产品新功能', priority: '高', timeline: '本季度' },
        ],
      };

      setResult(mockResult);
      setLoading(false);
      toast.success(t('common.success'));

      const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'Summary',
        data: formData,
        result: mockResult,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 50)));
    }, 2000);
  };

  return (
    <AnalysisLayout
      title={t('summary.title')}
      description={t('summary.description')}
      icon={<BarChart3 className="w-7 h-7 text-white" />}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>{t('summary.input.seo')}</Label>
              <Textarea
                placeholder="粘贴SEO分析结果..."
                value={formData.seoData}
                onChange={(e) => setFormData({ ...formData, seoData: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>{t('summary.input.reddit')}</Label>
              <Textarea
                placeholder="粘贴Reddit分析结果..."
                value={formData.redditData}
                onChange={(e) => setFormData({ ...formData, redditData: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>{t('summary.input.twitter')}</Label>
              <Textarea
                placeholder="粘贴X舆情分析结果..."
                value={formData.twitterData}
                onChange={(e) => setFormData({ ...formData, twitterData: e.target.value })}
                rows={4}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-teal-600"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('summary.button.generate')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{t('summary.result.insights')}</h3>
                </div>
                <ul className="space-y-2">
                  {result.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-600 mt-0.5">💡</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold">{t('summary.result.strategies')}</h3>
                </div>
                <ul className="space-y-2">
                  {result.strategies.map((strategy, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-3 bg-amber-50 rounded-lg">
                      <span className="text-amber-600 mt-0.5">🎯</span>
                      <span>{strategy}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">{t('summary.result.actions')}</h3>
                </div>
                <div className="space-y-3">
                  {result.actions.map((action, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium">{action.action}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          action.priority === '高' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">⏰ {action.timeline}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>填写左侧表单开始生成综合报告</p>
            </Card>
          )}
        </div>
      </div>
    </AnalysisLayout>
  );
}
