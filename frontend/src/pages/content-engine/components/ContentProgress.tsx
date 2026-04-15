interface ContentProgressProps {
  analysisId: string;
}

const STEPS = [
  { icon: "ri-link-m", label: "输入内容" },
  { icon: "ri-scan-line", label: "内容解析" },
  { icon: "ri-bar-chart-box-line", label: "内容分析" },
  { icon: "ri-magic-line", label: "内容生成" },
];

export default function ContentProgress({ analysisId }: ContentProgressProps) {
  return (
    <div className="w-full px-6 py-3 lg:px-10" style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}>
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1100px" }}>
        <div className="flex items-center gap-1 sm:gap-3">
          {STEPS.map((step, idx) => (
            <div key={step.label} className="flex items-center gap-1 sm:gap-2">
              {idx > 0 ? <span className="hidden h-px w-6 bg-[#7B61FF]/40 sm:block" /> : null}
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(123,97,255,0.1)]">
                  <i className={`${idx < 4 ? "ri-check-line" : step.icon} text-[10px] text-[#7B61FF]`} />
                </div>
                <span className="hidden text-[11px] font-medium text-[#555555] sm:block">{step.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-[#AAAAAA] sm:block">
            ID: <span className="font-medium text-[#888888]">{analysisId}</span>
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-[rgba(22,163,74,0.08)] px-3 py-1.5 text-[11px] font-semibold text-[#16a34a]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
            </span>
            分析完成
          </div>
        </div>
      </div>
    </div>
  );
}
