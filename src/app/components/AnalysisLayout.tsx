import { ReactNode } from 'react';

interface AnalysisLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

export function AnalysisLayout({ title, description, icon, children }: AnalysisLayoutProps) {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{title}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
