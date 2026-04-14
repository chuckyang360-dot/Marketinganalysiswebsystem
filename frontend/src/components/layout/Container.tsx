import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** 默认 max-w-7xl；营销页正文可用 max-w-6xl 收紧阅读宽度 */
  className?: string;
};

/**
 * 营销页统一水平容器：居中、最大宽度、左右安全边距。
 * 所有营销 section 的内容区应置于 Container 内。
 */
export function Container({ children, className = '' }: Props) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-6 md:px-8 ${className}`.trim()}>{children}</div>
  );
}
