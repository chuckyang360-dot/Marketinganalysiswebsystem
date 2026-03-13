import { FileText, MessageSquare, Video } from 'lucide-react';
import type { ContentIdea } from '../types/analysis';

interface Props {
  ideas: ContentIdea[];
}

export function ContentIdeas({ ideas }: Props) {
  const formatIcons = {
    'blog': <FileText className="w-5 h-5" />,
    'social post': <MessageSquare className="w-5 h-5" />,
    'video script': <Video className="w-5 h-5" />,
  };

  const formatLabels = {
    'blog': '博客文章',
    'social post': '社交媒体',
    'video script': '视频脚本',
  };

  const grouped = ideas.reduce((acc, idea) => {
    const format = idea.format || 'blog';
    if (!acc[format]) acc[format] = [];
    acc[format].push(idea);
    return acc;
  }, {} as Record<string, ContentIdea[]>);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">内容创意</h2>
        <span className="ml-auto text-sm text-gray-500">{ideas.length} 个创意</span>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([format, formatIdeas]) => (
          <FormatSection
            key={format}
            format={format}
            icon={formatIcons[format as keyof typeof formatIcons]}
            label={formatLabels[format as keyof typeof formatLabels]}
            ideas={formatIdeas}
          />
        ))}
      </div>
    </div>
  );
}

interface FormatSectionProps {
  format: string;
  icon: React.ReactNode;
  label: string;
  ideas: ContentIdea[];
}

function FormatSection({ icon, label, ideas }: FormatSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <span className="text-sm text-gray-500">({ideas.length})</span>
      </div>
      <div className="space-y-3">
        {ideas.map((idea, idx) => (
          <IdeaCard key={idx} idea={idea} />
        ))}
      </div>
    </div>
  );
}

function IdeaCard({ idea }: { idea: ContentIdea }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-gray-100 hover:border-purple-200 transition-all hover:shadow-md">
      <h4 className="font-semibold text-gray-900 mb-2">{idea.title}</h4>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
          {idea.format}
        </span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
          {idea.target_keyword}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{idea.reason}</p>
    </div>
  );
}
