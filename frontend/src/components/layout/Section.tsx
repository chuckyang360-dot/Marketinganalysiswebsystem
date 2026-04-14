import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * 营销页纵向区块。默认 py-20；若 className 中含 `py-*` 则不再追加默认纵向间距。
 * 禁止在页面中用裸 div 替代语义化 section。
 */
export function Section({ children, className = '' }: Props) {
  const hasPy = /\bpy-[^\s]+/.test(className);
  const padding = hasPy ? '' : 'py-20 ';
  return <section className={`${padding}${className}`.trim()}>{children}</section>;
}
