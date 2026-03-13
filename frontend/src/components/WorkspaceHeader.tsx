import { type } from 'react';

interface Props {
  query: string;
  onBack?: () => void;
  onNewAnalysis?: () => void;
  lang?: 'zh' | 'en';
}

export function WorkspaceHeader({ query, onBack, onNewAnalysis, lang = 'zh' }: Props) {
  const t = {
    zh: {
      currentAnalysis: '当前分析',
      newAnalysis: '新建分析',
      newAnalysisBtn: '开始新的分析'
    },
    en: {
      currentAnalysis: 'Current Analysis',
      newAnalysis: 'New Analysis',
      newAnalysisBtn: 'Start New Analysis'
    }
  };

  const text = t[lang];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Query Display */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-9-9m0 0l-9 9m0 0l-9 9" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-500">{text.currentAnalysis}:</div>
            <div className="text-lg font-semibold text-gray-900">{query}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m-8 14l-7-7m0 0l-7 7m8 14l-7-7" />
              </svg>
              {lang === 'zh' ? '返回欢迎' : 'Back'}
            </button>
          )}
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-7 7m0 0l-7 7m0 0l-7 7v-14m0 0l-7 7" />
              </svg>
              {text.newAnalysisBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
