import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar';
import { WorkspaceWelcome } from '../components/WorkspaceWelcome';
import { WorkspaceResultView } from '../components/WorkspaceResultView';
import EcomGrowthDecisionPage from '../components/EcomGrowthDecisionPage';
import AnalysisHistoryDrawer from '../components/AnalysisHistoryDrawer';
import { runFullAnalysis } from '../services/api';
import type { WorkspaceAnalysisResult } from '../types/analysis';
import { isEcomProductAnalysisResult, isFullAnalysisResponse } from '../types/analysis';
import { useLanguage } from '../contexts/LanguageContext';
import type { AnalysisHistoryRecord } from '../types/history';
import { getAnalysisHistoryRecordById, getAnalysisHistoryRecords, upsertAnalysisHistoryRecord } from '../services/history';

export function Workspace() {
  const navigate = useNavigate();
  const { analysisId } = useParams();
  const { language: lang } = useLanguage();
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentSourceUrl, setCurrentSourceUrl] = useState('');
  const [currentResult, setCurrentResult] = useState<WorkspaceAnalysisResult | null>(null);
  const [historyRecords, setHistoryRecords] = useState<AnalysisHistoryRecord[]>([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHttpUrl = (input: string) => /^https?:\/\//i.test(String(input || '').trim());

  const isEcomUrl = (input: string) => {
    const trimmed = (input || '').trim().toLowerCase();
    if (!trimmed.startsWith('http')) return false;
    return (
      trimmed.includes('amazon.') ||
      trimmed.includes('lazada.') ||
      trimmed.includes('shopee.') ||
      trimmed.includes('shop.tiktok.com') ||
      trimmed.includes('tiktokshop.') ||
      trimmed.includes('tiktok.com/shop')
    );
  };

  const getContentRouteMeta = (input: string): { sourceType: string; contentType: 'video' | 'image' | 'article' } | null => {
    const trimmed = (input || '').trim().toLowerCase();
    if (!isHttpUrl(trimmed)) return null;

    if (trimmed.includes('mp.weixin.qq.com')) return { sourceType: 'wechat', contentType: 'article' };
    if (trimmed.includes('zhihu.com')) return { sourceType: 'zhihu', contentType: 'article' };
    if (trimmed.includes('xiaohongshu.com') || trimmed.includes('xhslink.com')) return { sourceType: 'xiaohongshu', contentType: 'image' };
    if (trimmed.includes('weibo.com')) return { sourceType: 'weibo', contentType: 'image' };
    if (trimmed.includes('x.com') || trimmed.includes('twitter.com')) return { sourceType: 'x', contentType: 'image' };
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return { sourceType: 'youtube', contentType: 'video' };

    // Non-shop TikTok URLs go to content engine.
    if (trimmed.includes('tiktok.com') && !trimmed.includes('shop.tiktok.com') && !trimmed.includes('tiktok.com/shop')) {
      return { sourceType: 'tiktok', contentType: 'video' };
    }
    return null;
  };

  const handleAnalyze = async (query: string) => {
    const normalizedQuery = String(query || '').trim();
    const contentRouteMeta = getContentRouteMeta(normalizedQuery);
    if (contentRouteMeta) {
      const params = new URLSearchParams({
        sourceUrl: normalizedQuery,
        sourceType: contentRouteMeta.sourceType,
        contentType: contentRouteMeta.contentType,
      });
      navigate(`/content-engine?${params.toString()}`);
      return;
    }

    setCurrentQuery(query);
    setCurrentResult(null);
    setError(null);
    setLoading(true);

    try {
      const data = await runFullAnalysis(query);
      console.log("FULL_ANALYSIS_RESPONSE", data);
      const saved = upsertAnalysisHistoryRecord(query, data);
      setHistoryRecords(getAnalysisHistoryRecords(['marketing_report', 'ecom_product', 'content_creation']));
      setCurrentResult(data);
      setCurrentQuery(saved.display_value || query);
      if (isEcomProductAnalysisResult(data)) {
        setCurrentSourceUrl(String(data.parse_data?.url || query || '').trim());
      } else {
        setCurrentSourceUrl('');
      }
      navigate(saved.result_route, { replace: true });
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
    setCurrentQuery('');
    setCurrentSourceUrl('');
    navigate('/workspace');
  };

  const handleNewAnalysis = () => {
    setCurrentResult(null);
    setCurrentQuery('');
    setCurrentSourceUrl('');
    navigate('/workspace');
  };

  const openHistoryRecord = (record: AnalysisHistoryRecord) => {
    const resultData = (record.result_data as WorkspaceAnalysisResult) || null;
    setCurrentResult(resultData);
    setCurrentQuery(record.display_value || record.title || record.input_value);
    if (resultData && isEcomProductAnalysisResult(resultData)) {
      const url = String(resultData.parse_data?.url || record.input_value || '').trim();
      setCurrentSourceUrl(url);
    } else {
      setCurrentSourceUrl('');
    }
    setError(null);
    navigate(record.result_route);
    setHistoryDrawerOpen(false);
  };

  useEffect(() => {
    setHistoryRecords(getAnalysisHistoryRecords(['marketing_report', 'ecom_product', 'content_creation']));
  }, []);

  useEffect(() => {
    if (!analysisId) return;
    const found = getAnalysisHistoryRecordById(analysisId);
    if (!found) return;
    const resultData = (found.result_data as WorkspaceAnalysisResult) || null;
    setCurrentResult(resultData);
    setCurrentQuery(found.display_value || found.title || found.input_value);
    if (resultData && isEcomProductAnalysisResult(resultData)) {
      const url = String(resultData.parse_data?.url || found.input_value || '').trim();
      setCurrentSourceUrl(url);
    } else {
      setCurrentSourceUrl('');
    }
    setError(null);
  }, [analysisId]);

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isEcomResult = currentResult != null && isEcomProductAnalysisResult(currentResult);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-16">
      <Navbar onOpenHistory={() => setHistoryDrawerOpen(true)} />
      <main className="flex-1 flex overflow-hidden">
        {!isEcomResult && (
          <WorkspaceSidebar
            currentResult={currentResult}
            onBackToWelcome={handleBackToWelcome}
            onNewAnalysis={handleNewAnalysis}
            onScrollToSection={handleScrollToSection}
            lang={lang}
          />
        )}

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
                <p className="text-gray-600">
                  {isEcomUrl(currentQuery)
                    ? (lang === 'zh'
                        ? '正在抓取商品信息并生成 Vibe 分析...'
                        : 'Fetching product info and running CEO Vibe analysis...')
                    : (lang === 'zh' ? '正在分析...' : 'Analyzing...')}
                </p>
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
              {currentResult == null ? null : isEcomProductAnalysisResult(currentResult) ? (
                <div className="px-6 py-6">
                  <EcomGrowthDecisionPage
                    key={currentQuery}
                    data={currentResult}
                    productUrl={currentSourceUrl}
                    analysisId={analysisId || ''}
                    onNewAnalysis={handleNewAnalysis}
                    onEcomResultUpdate={(next) => setCurrentResult(next)}
                  />
                </div>
              ) : isFullAnalysisResponse(currentResult) ? (
                <div className="p-6">
                  <WorkspaceResultView data={currentResult} />
                  <div className="max-w-7xl mx-auto mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNewAnalysis}
                      className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                    >
                      {lang === 'zh' ? '新建分析' : 'Start New Analysis'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <AnalysisHistoryDrawer
        open={historyDrawerOpen}
        records={historyRecords}
        onClose={() => setHistoryDrawerOpen(false)}
        onOpenRecord={openHistoryRecord}
      />
    </div>
  );
}
