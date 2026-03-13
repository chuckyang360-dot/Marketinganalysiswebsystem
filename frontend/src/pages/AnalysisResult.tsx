import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { OpportunityScore } from '../components/OpportunityScore';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { RedditSection } from '../components/RedditSection';
import { SEOSection } from '../components/SEOSection';
import { GapTable } from '../components/GapTable';
import { ContentIdeas } from '../components/ContentIdeas';
import { ArrowLeft, Download } from 'lucide-react';
import type { FullAnalysisResponse } from '../types/analysis';

export function AnalysisResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<FullAnalysisResponse | null>(location.state?.data || null);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data && location.state?.query) {
      runAnalysis(location.state.query);
    }
  }, []);

  const runAnalysis = async (query: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/full-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 }),
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar variant="workspace" />
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-6xl mx-auto text-center">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-xl text-gray-500">正在分析市场数据...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar variant="workspace" />
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">没有分析数据</h1>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navbar variant="workspace" />
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/workspace')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analysis-${data.query.replace(/\s+/g, '-')}.json`;
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>

          <div className="grid gap-6">
            <ExecutiveSummary data={data} />
            <OpportunityScore gapAnalysis={data.gap_analysis} />
            <div className="grid lg:grid-cols-2 gap-6">
              <RedditSection data={data.reddit_analysis} />
              <SEOSection data={data.seo_analysis} />
            </div>
            <GapTable data={data.gap_analysis} />
            <ContentIdeas ideas={data.content_ideas} />
          </div>
        </div>
      </main>
    </div>
  );
}
