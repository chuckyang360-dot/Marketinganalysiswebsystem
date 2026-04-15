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
    <div
      className="w-full px-6 lg:px-10 py-3"
      style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: "1100px" }}
      >
        {/* Steps */}
        <div className="flex items-center gap-1 sm:gap-3">
          {STEPS.map((step, idx) => (
            <div key={step.label} className="flex items-center gap-1 sm:gap-2">
              {idx > 0 && (
                <span
                  className="w-6 h-px hidden sm:block"
                  style={{ background: idx < 4 ? "#7B61FF" : "#EAEAEA", opacity: 0.4 }}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ background: "rgba(123,97,255,0.1)" }}
                >
                  <i
                    className={`${idx < 4 ? "ri-check-line" : step.icon} text-[10px]`}
                    style={{ color: "#7B61FF" }}
                  />
                </div>
                <span
                  className="text-[11px] font-medium hidden sm:block"
                  style={{ color: "#555555" }}
                >
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right info */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] hidden sm:block" style={{ color: "#AAAAAA" }}>
            ID:{" "}
            <span className="font-medium" style={{ color: "#888888" }}>
              {analysisId}
            </span>
          </span>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            分析完成
          </div>
        </div>
      </div>
    </div>
  );
}
