import type { MarketingResultData } from "@/mocks/marketingResult";

interface Props {
  data: MarketingResultData;
}

const EFFORT_MAP: Record<string, { color: string; bg: string; label: string }> = {
  "低": { color: "#16a34a", bg: "rgba(22,163,74,0.09)", label: "低投入" },
  "中": { color: "#f59e0b", bg: "rgba(245,158,11,0.09)", label: "中投入" },
  "高": { color: "#ef4444", bg: "rgba(239,68,68,0.09)", label: "高投入" },
};

const POTENTIAL_MAP: Record<string, { color: string; bg: string }> = {
  "高": { color: "#7B61FF", bg: "rgba(123,97,255,0.09)" },
  "中": { color: "#0ea5e9", bg: "rgba(14,165,233,0.09)" },
  "低": { color: "#888888", bg: "rgba(107,114,128,0.09)" },
};

export default function ContentStrategy({ data }: Props) {
  const { contentStrategies } = data;

  return (
    <section className="w-full px-6 lg:px-10 py-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <i className="ri-layout-masonry-line text-[15px]" style={{ color: "#7B61FF" }} />
          <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>内容策略</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
            Content Strategy
          </span>
        </div>
        <p className="text-[13px] mb-5" style={{ color: "#888888" }}>做什么内容 — 可直接执行的方向</p>

        {/* Strategy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentStrategies.map((cs, idx) => {
            const effortStyle = EFFORT_MAP[cs.effort];
            const potentialStyle = POTENTIAL_MAP[cs.potential];
            const isHighlight = cs.potential === "高";
            return (
              <div key={cs.id}
                className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-200 cursor-pointer"
                style={{
                  border: isHighlight ? "1.5px solid rgba(123,97,255,0.22)" : "1px solid #EAEAEA",
                  background: isHighlight ? "linear-gradient(135deg, rgba(123,97,255,0.03), rgba(91,140,255,0.03))" : "#ffffff",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isHighlight ? "rgba(123,97,255,0.22)" : "#EAEAEA"; }}>

                {/* Number badge */}
                <div className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "#F7F8FA", color: "#CCCCCC" }}>
                  {idx + 1}
                </div>

                {/* Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl"
                  style={{ background: "rgba(123,97,255,0.09)", border: "1px solid rgba(123,97,255,0.15)" }}>
                  <i className={`${cs.icon} text-[18px]`} style={{ color: "#7B61FF" }} />
                </div>

                {/* Title + Angle */}
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: "#111111" }}>{cs.title}</h3>
                  <p className="text-[12px] mt-0.5 font-medium" style={{ color: "#7B61FF" }}>{cs.angle}</p>
                </div>

                {/* Description */}
                <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#555555" }}>
                  {cs.description}
                </p>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: effortStyle.bg, color: effortStyle.color }}>
                      {effortStyle.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: potentialStyle.bg, color: potentialStyle.color }}>
                      潜力{cs.potential}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: "#AAAAAA" }}>{cs.platform}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
