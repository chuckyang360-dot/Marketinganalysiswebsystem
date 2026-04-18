import type { ProductPreviewSummary } from '../types/shortDrama';
import { ri, sdColors, sdFontHeading } from '../utils/shortDramaHelpers';

type Props = {
  preview: ProductPreviewSummary;
};

const blocks: {
  key: keyof Pick<ProductPreviewSummary, 'sellingPoints' | 'sceneKeywords' | 'styleKeywords'>;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  { key: 'sellingPoints', label: '卖点提炼', color: '#B45309', bg: 'rgba(180,83,9,0.06)', border: 'rgba(180,83,9,0.15)' },
  { key: 'sceneKeywords', label: '场景关键词', color: '#047857', bg: 'rgba(4,120,87,0.06)', border: 'rgba(4,120,87,0.15)' },
  { key: 'styleKeywords', label: '风格关键词', color: '#334155', bg: 'rgba(51,65,85,0.06)', border: 'rgba(51,65,85,0.15)' },
];

export function InfoPreviewPanel({ preview }: Props) {
  const statusLabel =
    preview.status === 'idle'
      ? '等待解析'
      : preview.status === 'parsing'
        ? '解析中…'
        : preview.status === 'ready'
          ? '已提取'
          : preview.status === 'error'
            ? '解析失败'
            : '解析异常';

  const summaryDisplay =
    preview.status === 'idle'
      ? '请填写上方产品资料后，点击「解析产品信息」，将请求后端进行解析。'
      : preview.status === 'parsing'
        ? 'AI 正在理解产品信息，提炼卖点、场景与风格关键词…'
        : preview.status === 'error'
          ? preview.errorMessage || '解析失败，请稍后重试。'
          : preview.summary;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div
        className="flex items-center gap-3 border-b border-[#EAEAEA] px-5 py-4"
        style={{ background: sdColors.surface2 }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: sdColors.ink }}>
          <i className={ri('ri-sparkling-2-line', 'text-[14px] text-white')} aria-hidden />
        </div>
        <span className="text-[13px] font-bold" style={{ ...sdFontHeading, color: sdColors.ink }}>
          AI 解析结果
        </span>
        <span
          className="ml-auto rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            background:
              preview.status === 'ready'
                ? 'rgba(4,120,87,0.08)'
                : preview.status === 'parsing'
                  ? 'rgba(59,130,246,0.08)'
                  : preview.status === 'error'
                    ? 'rgba(220,38,38,0.08)'
                    : 'rgba(0,0,0,0.04)',
            color:
              preview.status === 'ready'
                ? '#047857'
                : preview.status === 'parsing'
                  ? '#2563EB'
                  : preview.status === 'error'
                    ? '#DC2626'
                    : '#6E6E73',
            borderColor:
              preview.status === 'ready'
                ? 'rgba(4,120,87,0.18)'
                : preview.status === 'parsing'
                  ? 'rgba(37,99,235,0.2)'
                  : preview.status === 'error'
                    ? 'rgba(220,38,38,0.2)'
                    : 'rgba(0,0,0,0.06)',
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-5 p-5">
        {preview.status === 'parsing' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <i className={ri('ri-loader-4-line', 'animate-spin text-[22px] text-[#1D1D1F]')} aria-hidden />
            <p className="text-[13px] text-[#8E8E93]">解析中，请稍候…</p>
          </div>
        ) : null}

        {preview.status !== 'parsing' ? (
          <>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">产品摘要</p>
              <p
                className="rounded-xl border border-[#EAEAEA] p-4 text-[13px] leading-relaxed"
                style={{
                  color:
                    preview.status === 'idle' ? '#8E8E93' : preview.status === 'error' ? '#DC2626' : '#444444',
                  background: sdColors.surface,
                }}
              >
                {summaryDisplay}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {blocks.map((b) => (
                <div
                  key={b.key}
                  className="rounded-xl p-4"
                  style={{ background: b.bg, border: `1px solid ${b.border}` }}
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: b.color }}>
                    {b.label}
                  </p>
                  {preview.status === 'ready' && preview[b.key].length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {preview[b.key].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.75)',
                            color: b.color,
                            borderColor: b.border,
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : preview.status === 'error' ? (
                    <p className="text-[12px] text-[#AEAEB2]">—</p>
                  ) : (
                    <p className="text-[12px] text-[#AEAEB2]">解析完成后将在此展示标签</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
