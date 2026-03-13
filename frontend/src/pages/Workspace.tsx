import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { WorkspaceSidebar } from '../components/WorkspaceSidebar';
import { WorkspaceWelcome } from '../components/WorkspaceWelcome';
import { WorkspaceResultView } from '../components/WorkspaceResultView';
import { StaticCaseReport } from '../components/StaticCaseReport';
import { runFullAnalysis } from '../services/api';
import { reportCases } from '../data/reportCases';
import type { FullAnalysisResponse } from '../types/analysis';
import { useLanguage } from '../contexts/LanguageContext';

export function Workspace() {
  const { language: lang } = useLanguage();
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<FullAnalysisResponse | null>(null);
  const [staticCaseId, setStaticCaseId] = useState<string | null>(null);

  const handleCaseSelect = (caseId: string) => {
    console.log("handleCaseSelect - caseId:", caseId);
    console.log("reportCases ids:", reportCases.map(c => c.id));
    const found = reportCases.find(c => c.id === caseId);
    console.log("Found case:", found);
    if (found) {
      setStaticCaseId(caseId);
    } else {
      console.log("Case not found for caseId:", caseId);
    }
    setCurrentResult(null);
  };

  const handleExampleSelect = async (query: string) => {
    setCurrentQuery(query);
    await runAnalysis(query);
  };

  const runAnalysis = async (q: string) => {
    setCurrentQuery(q);
    setCurrentResult(null);
    try {
      const data = await runFullAnalysis(q);
      setCurrentResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(lang === 'zh' ? '分析失败，请稍后重试' : 'Analysis failed, please try again later');
    }
  };

  const handleBackToWelcome = () => {
    setCurrentResult(null);
    setStaticCaseId(null);
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

  const handleScrollToExamples = () => {
    const element = document.getElementById('examples');
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
          staticCaseId={staticCaseId}
          onBackToWelcome={handleBackToWelcome}
          onNewAnalysis={handleNewAnalysis}
          onSelect={handleExampleSelect}
          onScrollToSection={handleScrollToSection}
          onScrollToExamples={handleScrollToExamples}
          lang={lang}
        />

        {/* Right Main Area */}
        <div className="flex-1 overflow-y-auto">
          {currentResult === null && staticCaseId === null ? (
            <WorkspaceWelcome
              lang={lang}
              onCaseSelect={handleCaseSelect}
              onSelect={(query, result) => {
                setCurrentQuery(query);
                setCurrentResult(result);
              }}
            />
          ) : staticCaseId !== null ? (
            <div className="min-h-full">
              <StaticCaseReport caseId={staticCaseId} />
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
