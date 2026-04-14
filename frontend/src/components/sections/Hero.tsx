import type { ReactNode } from 'react';
import { Container } from '../layout/Container';
import { Section } from '../layout/Section';

type Props = {
  title: ReactNode;
  subtitle: ReactNode;
  primaryCTA: ReactNode;
  secondaryCTA?: ReactNode;
  /** 传给 Section，用于首屏压缩上下间距等 */
  sectionClassName?: string;
};

/**
 * 营销页统一 Hero：居中、最大阅读宽、主/次 CTA 间距一致。
 * 所有页面首屏应复用此组件而非重复写标题区。
 */
export function Hero({ title, subtitle, primaryCTA, secondaryCTA, sectionClassName = '' }: Props) {
  return (
    <Section className={`border-b border-gray-100 bg-white py-16 md:py-20 ${sectionClassName}`.trim()}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">{subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primaryCTA}
            {secondaryCTA}
          </div>
        </div>
      </Container>
    </Section>
  );
}
