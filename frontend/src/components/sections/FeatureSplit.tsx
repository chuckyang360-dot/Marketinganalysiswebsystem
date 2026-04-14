import type { ReactNode } from 'react';
import { Container } from '../layout/Container';
import { Section } from '../layout/Section';

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  /** 与文字列相对的视觉区（插图、示意） */
  visual: ReactNode;
  /** true：桌面端图为左、文为右；移动端仍为先文后图便于阅读 */
  reverse?: boolean;
  sectionClassName?: string;
};

/**
 * 左文右图 / 右文左图。用于产品说明、故事叙述，替代纯卡片网格。
 */
export function FeatureSplit({ eyebrow, title, children, visual, reverse, sectionClassName = '' }: Props) {
  return (
    <Section className={`bg-gray-50 ${sectionClassName}`.trim()}>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className={`text-left ${reverse ? 'lg:order-2' : ''}`}>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{eyebrow}</p>
            )}
            <h2 className={`text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl ${eyebrow ? 'mt-3' : ''}`}>
              {title}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-600">{children}</div>
          </div>
          <div className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>{visual}</div>
        </div>
      </Container>
    </Section>
  );
}
