import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar';
import { WorkspaceWelcome } from '../components/WorkspaceWelcome';
import { WorkspaceResultView } from '../components/WorkspaceResultView';
import { runFullAnalysis } from '../services/api';
import type { FullAnalysisResponse } from '../types/analysis';
import { useLanguage } from '../contexts/LanguageContext';

export function Workspace() {
  const { language: lang } = useLanguage();
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<FullAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (query: string) => {
    setCurrentQuery(query);
    setCurrentResult(null);
    setError(null);
    setLoading(true);

    try {
      const data = await runFullAnalysis(query);
      console.log("FULL_ANALYSIS_RESPONSE", data);

      // 验证返回数据结构
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data');
      }

      // 验证必要字段存在
      if (!data.query || !data.reddit_analysis || !data.seo_analysis) {
        throw new Error('Missing required fields in response');
      }

      setCurrentResult(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setCurrentResult(null);

      // 显示用户友好的错误提示
      if (lang === 'zh') {
        alert(`分析失败：${errorMsg}`);
      } else {
        alert(`Analysis failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToWelcome = () => {
    setCurrentResult(null);
  };

  const handleNewAnalysis = () => {
    setCurrentResult(null);
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-16">
      <Navbar />
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <WorkspaceSidebar
          currentResult={currentResult}
          onBackToWelcome={handleBackToWelcome}
          onNewAnalysis={handleNewAnalysis}
          onScrollToSection={handleScrollToSection}
          lang={lang}
        />

        {/* Right Main Area */}
        <div className="flex-1 overflow-y-auto">
          {currentResult === null && !loading && !error ? (
            <WorkspaceWelcome
              lang={lang}
              onAnalyze={handleAnalyze}
            />
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4 mx-auto"></div>
                <p className="text-gray-600">{lang === 'zh' ? '正在分析...' : 'Analyzing...'}</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-red-200">
                <div className="text-red-600 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4l-4 4m0 0l4-4m4 4H4m16 0v2m0 4l-4 4m0 0l4-4m4 4H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {lang === 'zh' ? '分析失败' : 'Analysis Failed'}
                </h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleNewAnalysis}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {lang === 'zh' ? '重新分析' : 'Retry'}
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-full">
              {/* Minimal Query Display */}
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-9-9m0 0l-9 9m0 0l-9 9" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{lang === 'zh' ? '当前分析' : 'Current Analysis'}:</div>
                    <div className="text-lg font-semibold text-gray-900">{currentQuery}</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {currentResult && <WorkspaceResultView data={currentResult} />}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
