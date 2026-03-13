import { useState } from 'react';
import type { FullAnalysisResponse } from '../types/analysis';
import { reportCases } from '../data/reportCases';

interface Props {
  currentResult?: FullAnalysisResponse | null;
  staticCaseId?: string | null;
  onBackToWelcome?: () => void;
  onNewAnalysis?: () => void;
  onSelect?: (query: string) => void;
  onScrollToSection?: (sectionId: string) => void;
  onScrollToExamples?: () => void;
  lang?: 'zh' | 'en';
}

export function WorkspaceSidebar({
  currentResult,
  staticCaseId,
  onBackToWelcome,
  onNewAnalysis,
  onSelect,
  onScrollToSection,
  onScrollToExamples,
  lang = 'zh'
}: Props) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('summary');

  const staticCase = staticCaseId ? reportCases.find(c => c.id === staticCaseId) : null;
  const currentTitle = staticCase?.title || currentResult?.query || (lang === 'zh' ? '无' : 'None');

  const t = {
    zh: {
      newAnalysis: '新建分析',
      recentAnalysis: '最近分析',
      examples: '示例案例',
      backToHome: '返回首页',
      backToWelcome: '返回欢迎页',
      currentAnalysis: '当前分析',
      executiveSummary: '执行摘要',
      opportunityScore: '机会得分',
      redditAnalysis: 'Reddit分析',
      seoAnalysis: 'SEO分析',
      contentGap: '内容机会差距',
      contentIdeas: '内容创意'
    },
    en: {
      newAnalysis: 'New Analysis',
      recentAnalysis: 'Recent Analysis',
      examples: 'Examples',
      backToHome: 'Home',
      backToWelcome: 'Back to Welcome',
      currentAnalysis: 'Current Analysis',
      executiveSummary: 'Executive Summary',
      opportunityScore: 'Opportunity Score',
      redditAnalysis: 'Reddit Analysis',
      seoAnalysis: 'SEO Analysis',
      contentGap: 'Content Gap',
      contentIdeas: 'Content Ideas'
    }
  };

  const text = t[lang];
  const isWelcomeState = currentResult === null;

  const welcomeNavItems = [
    { id: 'new', icon: '➕', label: text.newAnalysis, action: onNewAnalysis },
    { id: 'recent', icon: '🕐', label: text.recentAnalysis, action: () => {} },
    { id: 'examples', icon: '📋', label: text.examples, action: onScrollToExamples },
    { id: 'home', icon: '🏠', label: text.backToHome, action: () => window.location.href = '/' }
  ];

  const resultSections = [
    { id: 'summary', icon: '📊', label: text.executiveSummary },
    { id: 'score', icon: '🎯', label: text.opportunityScore },
    { id: 'reddit', icon: '💬', label: text.redditAnalysis },
    { id: 'seo', icon: '🔍', label: text.seoAnalysis },
    { id: 'gap', icon: '📈', label: text.contentGap },
    { id: 'ideas', icon: '💡', label: text.contentIdeas }
  ];

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    }
  };

  return (
    <aside className={`${isWelcomeState ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all`}>
      {/* Result State: Current Analysis Info */}
      {!isWelcomeState && (
        <div className="p-4 border-b border-gray-100">
          <div className="text-xs text-gray-500 mb-1">{text.currentAnalysis}</div>
          <div className="text-sm font-semibold text-gray-900 truncate">
            {currentTitle}
          </div>
        </div>
      )}

      {/* Welcome State Navigation */}
      {isWelcomeState && (
        <nav className="flex-1 flex flex-col items-center py-4 space-y-3">
          {welcomeNavItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => item.action ? item.action() : null}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 transition-colors"
              >
                {item.icon}
              </button>
              {/* Tooltip */}
              {hoveredItem === item.id && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Result State Directory Navigation */}
      {!isWelcomeState && (
        <nav className="flex-1 flex flex-col py-3">
          {resultSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{section.icon}</span>
              <span className="flex-1 text-left">{section.label}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="my-2 mx-4 h-px bg-gray-200" />

          {/* Bottom Actions */}
          <button
            onClick={onBackToWelcome}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="text-base">←</span>
            <span>{text.backToWelcome}</span>
          </button>
          <button
            onClick={onNewAnalysis}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="text-base">➕</span>
            <span>{text.newAnalysis}</span>
          </button>
        </nav>
      )}
    </aside>
  );
}
