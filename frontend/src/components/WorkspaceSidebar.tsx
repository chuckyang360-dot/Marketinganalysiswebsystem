import { useEffect, useState } from 'react';
import type { FullAnalysisResponse } from '../types/analysis';
import type { ReportSection } from '../types/report';
import { getWorkspaceReportSections } from '../utils/reportSections';

interface Props {
  currentResult?: FullAnalysisResponse | null;
  onBackToWelcome?: () => void;
  onNewAnalysis?: () => void;
  onScrollToSection?: (sectionId: string) => void;
  lang?: 'zh' | 'en';
}

export function WorkspaceSidebar({
  currentResult,
  onBackToWelcome,
  onNewAnalysis,
  onScrollToSection,
  lang = 'zh'
}: Props) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('executive-summary');

  const currentTitle = currentResult?.query || (lang === 'zh' ? '无' : 'None');

  const t = {
    zh: {
      newAnalysis: '新建分析',
      recentAnalysis: '最近分析',
      examples: '示例案例',
      backToHome: '返回首页',
      backToWelcome: '返回欢迎页',
      currentAnalysis: '当前分析',
      executive: '执行摘要',
      redditEvidence: 'Reddit证据',
      seoEvidence: 'SEO证据',
      xSentiment: 'X舆情',
      analysis: '深度分析',
      strategy: '策略建议',
      execution: '执行动作',
    },
    en: {
      newAnalysis: 'New Analysis',
      recentAnalysis: 'Recent Analysis',
      examples: 'Examples',
      backToHome: 'Home',
      backToWelcome: 'Back to Welcome',
      currentAnalysis: 'Current Analysis',
      executive: 'Executive Summary',
      redditEvidence: 'Reddit Evidence',
      seoEvidence: 'SEO Evidence',
      xSentiment: 'X Sentiment',
      analysis: 'Deep Analysis',
      strategy: 'Strategy',
      execution: 'Execution',
    }
  };

  const text = t[lang];
  const isWelcomeState = currentResult === null;

  const welcomeNavItems = [
    { id: 'new', icon: '➕', label: text.newAnalysis, action: onNewAnalysis },
    { id: 'recent', icon: '🕐', label: text.recentAnalysis, action: () => {} },
    { id: 'home', icon: '🏠', label: text.backToHome, action: () => window.location.href = '/' }
  ];

  const reportSections: ReportSection[] = getWorkspaceReportSections(lang);

  const iconById: Record<string, string> = {
    'executive-summary': '📊',
    'market-analysis': '📈',
    'key-findings': '📌',
    strategy: '🎯',
    methods: '🧩',
    'content-plan': '⚡',
    evidence: '🧾',
  };

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    }
  };

  // 高亮当前滚动到的 section
  useEffect(() => {
    if (currentResult === null) return;

    const ids = reportSections.map(s => s.id);
    const elements = ids
      .map(id => (typeof document !== 'undefined' ? document.getElementById(id) : null))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting && e.target instanceof HTMLElement)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        if (visible[0]?.target) {
          setActiveSection((visible[0].target as HTMLElement).id);
        }
      },
      {
        // 让“接近顶部”的 section 更容易被判定为 active
        root: null,
        rootMargin: '-18% 0px -68% 0px',
        threshold: [0.05, 0.15, 0.25, 0.4, 0.6],
      },
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [currentResult, lang]); // reportSections 由 lang 决定

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
          {(welcomeNavItems ?? []).map((item) => (
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
          {reportSections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(section => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base flex-shrink-0">{iconById[section.id] ?? '•'}</span>
              <span className="flex-1 text-left truncate">{section.label}</span>
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
