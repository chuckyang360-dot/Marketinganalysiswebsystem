import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisLayout } from '../components/AnalysisLayout';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

export function ContentGeneration() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: '',
    tone: '',
    audience: '',
    type: 'social',
  });
  const [generatedContent, setGeneratedContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const contentTemplates = {
        social: `🚀 让AI驱动您的营销增长！

GlobalPulseAI为您提供全方位的营销分析和内容生成解决方案。
✨ SEO优化建议
✨ 社交媒体热点挖掘
✨ 智能内容生成

立即体验，让数据为您的营销决策赋能！

#AI营销 #数字营销 #营销自动化`,
        blog: `# 如何利用AI工具提升营销效果

在当今数字化时代，营销人员面临着前所未有的挑战。如何在海量信息中找到目标受众？如何创作出真正打动人心的内容？GlobalPulseAI为您提供答案。

## 数据驱动的决策

通过AI分析引擎，我们帮助您：
- 深入了解关键词趋势
- 实时监控社交媒体热点
- 预测市场趋势

## 高效的内容创作

智能内容生成引擎能够：
- 基于数据洞察创作内容
- 保持品牌调性一致性
- 适配不同平台和受众

让AI成为您的营销助手，释放更多创意潜能！`,
        ad: `🎯 营销效果提升300%的秘密

GlobalPulseAI - 您的AI营销增长引擎

✅ 5大专业分析引擎
✅ 智能内容自动生成
✅ 综合数据洞察报告

🎁 限时优惠：立即注册享受30天免费试用

👉 点击了解详情`,
        email: `主题：发现提升营销ROI的新方法

您好，

在过去的一年里，我们观察到成功的营销团队有一个共同特点：他们都在使用AI工具来优化决策流程。

GlobalPulseAI可以帮助您：

1. SEO分析 - 找到最有潜力的关键词
2. 社交媒体监控 - 抓住热点话题
3. 内容生成 - 提高创作效率

我们的客户平均实现了：
• 流量增长 200%+
• 转化率提升 150%+
• 内容产出效率提升 300%+

立即预约免费演示，让我们为您展示如何实现这些成果。

祝好，
GlobalPulseAI团队`,
      };

      setGeneratedContent(contentTemplates[formData.type] || contentTemplates.social);
      setLoading(false);
      toast.success(t('common.success'));

      const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'Content',
        data: formData,
        result: { content: contentTemplates[formData.type] },
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 50)));
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('已复制到剪贴板');
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${Date.now()}.txt`;
    a.click();
    toast.success('导出成功');
  };

  return (
    <AnalysisLayout
      title={t('content.title')}
      description={t('content.description')}
      icon={<FileText className="w-7 h-7 text-white" />}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>{t('content.input.type')}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">{t('content.type.social')}</SelectItem>
                  <SelectItem value="blog">{t('content.type.blog')}</SelectItem>
                  <SelectItem value="ad">{t('content.type.ad')}</SelectItem>
                  <SelectItem value="email">{t('content.type.email')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('content.input.data')}</Label>
              <Textarea
                placeholder={t('content.input.data.placeholder')}
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div>
              <Label>{t('content.input.tone')}</Label>
              <Textarea
                placeholder={t('content.input.tone.placeholder')}
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label>{t('content.input.audience')}</Label>
              <Textarea
                placeholder={t('content.input.audience.placeholder')}
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('content.button.generate')}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {generatedContent ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('content.result.title')}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>填写左侧表单开始生成内容</p>
            </Card>
          )}
        </div>
      </div>
    </AnalysisLayout>
  );
}
