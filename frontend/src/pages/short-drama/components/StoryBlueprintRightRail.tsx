import type { StoryBlueprintAnalysisItem } from '../types/shortDrama';
import { ri, sdColors, sdFontHeading } from '../utils/shortDramaHelpers';

type Props = {
  items: StoryBlueprintAnalysisItem[];
  verdictTitle: string;
  verdictBody: string;
  className?: string;
};

export function StoryBlueprintRightRail({ items, verdictTitle, verdictBody, className = '' }: Props) {
  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-y-auto border-[#EAEAEA] bg-[#F7F8FA] p-6 pt-10 xl:flex xl:w-64 xl:border-l ${className}`}
    >
      <h3 className="mb-5 text-[12px] font-bold uppercase tracking-wider text-[#8E8E93]">结构分析</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-white p-3.5"
            style={{ border: `1px solid ${sdColors.border}` }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <i className={ri(item.icon, 'text-[12px]')} style={{ color: item.color }} aria-hidden />
              <span className="text-[11px] text-[#8E8E93]">{item.label}</span>
            </div>
            <p className="text-[13px] font-semibold" style={{ ...sdFontHeading, color: sdColors.ink }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <div
        className="mt-5 rounded-xl p-3.5"
        style={{
          background: 'rgba(4, 120, 87, 0.06)',
          border: '1px solid rgba(4, 120, 87, 0.2)',
        }}
      >
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#047857' }}>
          {verdictTitle}
        </p>
        <p className="text-[12px] leading-relaxed text-[#444444]">{verdictBody}</p>
      </div>
    </aside>
  );
}
