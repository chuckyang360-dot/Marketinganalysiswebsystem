import { Code, ShoppingCart, AlertTriangle, Zap } from 'lucide-react';

export function ExampleCards({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <ExampleCard
        icon={<Code className="w-6 h-6" />}
        title="AI Coding Tools"
        description="分析 AI 编程工具的市场需求和竞争态势"
        query="AI coding tools"
        onClick={() => onSelect('AI coding tools')}
      />
      <ExampleCard
        icon={<ShoppingCart className="w-6 h-6" />}
        title="Shopify SEO"
        description="探索 Shopify SEO 内容机会和竞争差距"
        query="Shopify SEO"
        onClick={() => onSelect('Shopify SEO')}
      />
      <ExampleCard
        icon={<AlertTriangle className="w-6 h-6" />}
        title="Dropshipping Problems"
        description="识别代发货用户的痛点和内容需求"
        query="Amazon dropshipping problems"
        onClick={() => onSelect('Amazon dropshipping problems')}
      />
      <ExampleCard
        icon={<Zap className="w-6 h-6" />}
        title="Marketing Automation"
        description="发现营销自动化工具的内容机会"
        query="best marketing automation tools"
        onClick={() => onSelect('best marketing automation tools')}
      />
    </div>
  );
}

interface ExampleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  query: string;
  onClick: () => void;
}

function ExampleCard({ icon, title, description, onClick }: ExampleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group p-6 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all text-left border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </button>
  );
}
