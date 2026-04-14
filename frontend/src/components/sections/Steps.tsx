import { Container } from '../layout/Container';
import { Section } from '../layout/Section';

export type StepItem = {
  title: string;
  /** 省略时不渲染说明行，仅保留标题句 */
  description?: string;
};

type Props = {
  heading?: string;
  steps: StepItem[];
  sectionClassName?: string;
};

/**
 * 编号流程（1 / 2 / 3），用于「如何使用」等线性叙事。
 */
export function Steps({ heading, steps, sectionClassName = '' }: Props) {
  return (
    <Section className={`bg-white ${sectionClassName}`.trim()}>
      <Container>
        {heading && (
          <h2 className="text-left text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">{heading}</h2>
        )}
        <ol className={`max-w-3xl space-y-10 text-left ${heading ? 'mt-10' : ''}`}>
          {steps.map((step, index) => (
            <li key={index} className="flex gap-5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                {step.description ? (
                  <p className="mt-1 text-base leading-relaxed text-gray-600">{step.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
