import type { MarketingResultData } from "@/mocks/marketingResult";

interface Props {
  data: MarketingResultData;
}

export default function ExecutionPlan({ data }: Props) {
  const { executionPlan } = data;

  return (
    <section className="w-full px-6 lg:px-10 py-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <i className="ri-road-map-line text-[15px]" style={{ color: "#7B61FF" }} />
          <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>执行路径</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
            Execution Plan
          </span>
        </div>
        <p className="text-[13px] mb-5" style={{ color: "#888888" }}>怎么开始 — 5 个优先动作</p>

        {/* Timeline */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
          {executionPlan.map((step, idx) => {
            const isLast = idx === executionPlan.length - 1;
            return (
              <div key={step.step}
                className="flex items-start gap-0 group"
                style={{ borderBottom: isLast ? "none" : "1px solid #F5F5F5" }}>

                {/* Left: Step number + connector */}
                <div className="flex flex-col items-center shrink-0 pt-5 pb-3 pl-6 pr-4">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-[13px] text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${step.priorityColor}, ${step.priorityColor}AA)` }}>
                    {step.step}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 mt-2" style={{ background: "#EAEAEA", minHeight: "20px" }} />
                  )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 px-4 pt-4 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[14px] font-bold" style={{ color: "#111111" }}>{step.action}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${step.priorityColor}14`, color: step.priorityColor }}>
                          {step.priority}
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>{step.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end gap-1.5">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg"
                        style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA", whiteSpace: "nowrap" }}>
                        {step.platform}
                      </span>
                      <span className="text-[11px]" style={{ color: "#AAAAAA", whiteSpace: "nowrap" }}>
                        {step.timeframe}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kick-off banner */}
        <div className="mt-4 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.07), rgba(91,140,255,0.07))", border: "1.5px solid rgba(123,97,255,0.18)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(123,97,255,0.12)" }}>
              <i className="ri-rocket-line text-[18px]" style={{ color: "#7B61FF" }} />
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "#111111" }}>随时可以开始执行</p>
              <p className="text-[12px]" style={{ color: "#888888" }}>第1步仅需 1 部手机，0 预算即可启动</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white cursor-pointer transition-opacity duration-200 hover:opacity-88 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
            <i className="ri-flashlight-fill text-[14px]" />
            开始执行
          </button>
        </div>
      </div>
    </section>
  );
}
