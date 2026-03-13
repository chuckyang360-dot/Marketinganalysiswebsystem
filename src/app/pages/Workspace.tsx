import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Search, TrendingUp, Twitter, FileText, BarChart3, History } from 'lucide-react';

const tools = [
  { id: 'seo', icon: Search, label: 'SEO Analysis', path: '/workspace/seo', color: 'blue' },
  { id: 'reddit', icon: TrendingUp, label: 'Reddit Monitor', path: '/workspace/reddit', color: 'orange' },
  { id: 'twitter', icon: Twitter, label: 'Twitter Monitor', path: '/workspace/twitter', color: 'sky' },
  { id: 'content', icon: FileText, label: 'Content Generator', path: '/workspace/content', color: 'purple' },
  { id: 'summary', icon: BarChart3, label: 'Data Summary', path: '/workspace/summary', color: 'green' },
  { id: 'history', icon: History, label: 'History', path: '/workspace/history', color: 'indigo' },
];

export function Workspace() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleToolClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Workspace</h1>
          <p className="text-gray-600">Select a tool to get started with your marketing analysis</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const colorClasses = {
              blue: 'from-blue-600 to-blue-700',
              orange: 'from-orange-600 to-orange-700',
              sky: 'from-sky-600 to-sky-700',
              purple: 'from-purple-600 to-purple-700',
              green: 'from-green-600 to-green-700',
              indigo: 'from-indigo-600 to-indigo-700',
            };

            return (
              <Card
                key={tool.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gray-300"
                onClick={() => handleToolClick(tool.path)}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[tool.color]} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{tool.label}</h3>
                <p className="text-sm text-gray-600">{t(`product.${tool.id}.description`)}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
