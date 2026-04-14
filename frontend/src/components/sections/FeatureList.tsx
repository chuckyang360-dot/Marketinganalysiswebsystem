import type { ReactNode } from 'react';
import { Container } from '../layout/Container';
import { Section } from '../layout/Section';

export type FeatureListItem = {
  icon: ReactNode;
  title: string;
  description: string;
};

type Props = {
  /** 区块标题（可选） */
  heading?: ReactNode;
  items: FeatureListItem[];
  sectionClassName?: string;
};

/**
 * 纵向 icon + 文本列表，替代「多列卡片网格」展示要点。
 */
export function FeatureList({ heading, items, sectionClassName = '' }: Props) {
  return (
    <Section className={sectionClassName}>
      <Container>
        {heading && (
          <h2 className="text-left text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">{heading}</h2>
        )}
        <ul className={`max-w-3xl space-y-8 text-left ${heading ? 'mt-10' : ''}`}>
          {items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-base leading-relaxed text-gray-600">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
