import { useState } from 'react';
import type { FullAnalysisResponse } from '../types/analysis';

interface Props {
  data: FullAnalysisResponse;
}

export function ExecutionSection({ data }: Props) {
  const { report, content_ideas } = data;
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = (actionType: string) => {
    setLoadingAction(actionType);
    // Placeholder implementation
    console.log(`Executing action: ${actionType}`);
    setTimeout(() => {
      setLoadingAction(null);
      alert(`${actionType} 功能即将开放`);
    }, 1000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div id="section-execution" className="space-y-6">
      {/* Action Buttons */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">执行动作</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleAction('generate_article')}
            disabled={loadingAction === 'generate_article'}
            className="flex items-center justify-center gap-2 p-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
          >
            <span className="text-xl">📝</span>
            <span className="font-medium">
              {loadingAction === 'generate_article' ? '生成中...' : '生成文章'}
            </span>
          </button>

          <button
            onClick={() => handleAction('generate_poster')}
            disabled={loadingAction === 'generate_poster'}
            className="flex items-center justify-center gap-2 p-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
          >
            <span className="text-xl">🎨</span>
            <span className="font-medium">
              {loadingAction === 'generate_poster' ? '生成中...' : '生成海报'}
            </span>
          </button>

          <button
            onClick={() => handleAction('generate_video')}
            disabled={loadingAction === 'generate_video'}
            className="flex items-center justify-center gap-2 p-4 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
          >
            <span className="text-xl">🎬</span>
            <span className="font-medium">
              {loadingAction === 'generate_video' ? '生成中...' : '生成视频'}
            </span>
          </button>

          <button
            onClick={() => handleAction('copy_report')}
            disabled={loadingAction === 'copy_report'}
            className="flex items-center justify-center gap-2 p-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
          >
            <span className="text-xl">📋</span>
            <span className="font-medium">
              {loadingAction === 'copy_report' ? '复制中...' : '复制报告'}
            </span>
          </button>
        </div>
      </div>

      {/* Content Ideas Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">💡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">内容创意</h2>
          <span className="text-sm text-gray-500 ml-2">({content_ideas.length} 个创意)</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {content_ideas.map((idea, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                <button
                  onClick={() => handleCopy(idea.title)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  📋
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {idea.format}
                </span>
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                  {idea.target_keyword}
                </span>
              </div>

              <p className="text-sm text-gray-600">{idea.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Plan Card */}
      {report?.content_plan && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">内容计划</h2>
          </div>

          {/* Articles */}
          {report.content_plan.articles && report.content_plan.articles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                文章 ({report.content_plan.articles.length})
              </h3>
              <div className="space-y-3">
                {report.content_plan.articles.map((article, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-900 mb-1">{article.title}</div>
                    <div className="text-xs text-gray-500">{article.estimated_length || '未指定长度'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Posts */}
          {report.content_plan.social_posts && report.content_plan.social_posts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                社交媒体 ({report.content_plan.social_posts.length})
              </h3>
              <div className="space-y-3">
                {report.content_plan.social_posts.map((post, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-900 mb-2">{post.platform}</div>
                    <div className="text-xs text-gray-600">{post.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Ideas */}
          {report.content_plan.video_ideas && report.content_plan.video_ideas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                视频创意 ({report.content_plan.video_ideas.length})
              </h3>
              <div className="space-y-3">
                {report.content_plan.video_ideas.map((video, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-900 mb-1">{video.title}</div>
                    <div className="text-xs text-gray-500">{video.estimated_duration || '未指定时长'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Poster Ideas */}
          {report.content_plan.poster_ideas && report.content_plan.poster_ideas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                海报创意 ({report.content_plan.poster_ideas.length})
              </h3>
              <div className="space-y-3">
                {report.content_plan.poster_ideas.map((poster, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-900 mb-2">{poster.headline}</div>
                    <div className="text-xs text-gray-600">{poster.key_message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
