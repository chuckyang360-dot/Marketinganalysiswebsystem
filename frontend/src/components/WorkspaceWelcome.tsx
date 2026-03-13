import { useState } from 'react';

interface Props {
  lang?: 'zh' | 'en';
  onAnalyze?: (query: string) => void;
}

// Helper function to safely call onAnalyze
function callOnAnalyze(onAnalyze: ((query: string) => void) | undefined, query: string) {
  if (onAnalyze) {
    onAnalyze(query);
  }
}

export function WorkspaceWelcome({ lang = 'zh', onAnalyze }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    callOnAnalyze(onAnalyze, query);
  };

  const examples = [
    {
      id: 'amazon-seller',
      title: lang === 'zh' ? '亚马逊卖家增长策略' : 'Amazon Seller Growth Strategy',
      description: lang === 'zh' ? '分析亚马逊卖家的选品、Listing优化、评价与增长机会' : 'Analyze product selection, listing optimization, reviews, and growth opportunities for Amazon sellers',
      query: 'Amazon seller growth strategy for product launch',
      icon: '🛒'
    },
    {
      id: 'shopify-dtc',
      title: lang === 'zh' ? '独立站 SEO 增长策略' : 'Shopify SEO Strategy',
      description: lang === 'zh' ? '分析独立站的 SEO 流量、内容与增长机会' : 'Analyze SEO traffic, content, and growth opportunities for Shopify stores',
      query: 'Shopify SEO strategy for traffic growth',
      icon: '🌐'
    },
    {
      id: 'ai-saas',
      title: lang === 'zh' ? 'SaaS 产品增长策略' : 'SaaS Product Growth Strategy',
      description: lang === 'zh' ? '分析 SaaS 产品的用户增长、留存与定价策略' : 'Analyze user growth, retention, and pricing strategies for SaaS products',
      query: 'SaaS user acquisition and retention strategy',
      icon: '💻'
    },
    {
      id: 'b2b-lead-gen',
      title: lang === 'zh' ? 'B2B 获客转化策略' : 'B2B Lead Generation Strategy',
      description: lang === 'zh' ? '分析 B2B 企业的获客、线索转化与内容营销机会' : 'Analyze lead generation, conversion, and content marketing opportunities for B2B companies',
      query: 'B2B lead generation strategy through content marketing',
      icon: '🤝'
    }
  ];

  return (
    <div className="h-full flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === 'zh' ? '欢迎使用 GlobalPulse AI' : 'Welcome to GlobalPulse AI'}
          </h1>
          <p className="text-sm text-gray-500">
            {lang === 'zh' ? '输入关键词开始智能市场分析，或选择下方案例' : 'Enter keywords to start intelligent market analysis, or select an example below'}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'zh' ? '输入市场、细分领域或关键词' : 'Enter a market, niche, or keyword'}
              className="w-full pr-28 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1"
            >
              {lang === 'zh' ? '分析' : 'Analyze'}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5 5H6" />
              </svg>
            </button>
          </div>
        </form>

        {/* Examples */}
        <div id="examples">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            {lang === 'zh' ? '示例' : 'Examples'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => callOnAnalyze(onAnalyze, example.query)}
                disabled={loading}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
              >
                <span className="text-lg">{example.icon}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-900 leading-tight">{example.title}</span>
                  <span className="text-[10px] text-gray-500 leading-tight mt-0.5">{example.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
