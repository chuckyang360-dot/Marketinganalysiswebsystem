import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * 营销页通用卡片：统一 p-5、边框与宽度行为（网格内配合 h-full）。
 * 禁止在 MarketingCard 内再嵌套 MarketingCard 或其它卡片组件。
 */
export function MarketingCard({ children, className = '' }: Props) {
  return (
    <div
      className={`h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className}`.trim()}
    >
      {children}
    </div>
  );
}
