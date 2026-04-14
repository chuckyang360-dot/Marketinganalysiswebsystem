const CAPABILITIES = [
  {
    num: "01",
    title: "营销分析",
    desc: "从分散信号中判断需求、趋势与竞争，而不是停留在讨论层。",
    accentColor: "#fb923c",
    accentBg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.18)",
  },
  {
    num: "02",
    title: "内容制作",
    desc: "直接基于洞察生成选题与表达，而不是从零开始反复试错。",
    accentColor: "#7B61FF",
    accentBg: "rgba(123,97,255,0.08)",
    border: "rgba(123,97,255,0.18)",
  },
  {
    num: "03",
    title: "商品分析",
    desc: "把商品页与评论转成优化建议，而不是凭经验调整。",
    accentColor: "#0ea5e9",
    accentBg: "rgba(14,165,233,0.08)",
    border: "rgba(14,165,233,0.18)",
  },
  {
    num: "04",
    title: "工作流沉淀",
    desc: "所有分析、结论与动作留在同一系统里，而不是散落在工具与文档中。",
    accentColor: "#8b5cf6",
    accentBg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.18)",
  },
];

export default function CapabilityOverview() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#F7F8FA", borderBottom: "1px solid #EAEAEA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-col lg:flex-row lg:gap-24">
          {/* Left */}
          <div className="lg:w-64 shrink-0 mb-12 lg:mb-0">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1.5 rounded-full"
              style={{ color: "#7B61FF", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.18)" }}>
              产品能力
            </span>
            <h2 className="font-bold leading-[1.2] tracking-[-0.02em] mb-5"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(20px, 2.2vw, 28px)", color: "#111111" }}>
              不是更多工具，<br />而是一条跑通的<br />增长链路
            </h2>
            <p style={{ fontSize: "13.5px", color: "#888888", lineHeight: 1.8 }}>
              大多数团队把市场分析、内容制作和商品优化拆开做，结果是信息割裂、决策滞后、执行断层。
            </p>
            <p className="mt-3" style={{ fontSize: "13.5px", color: "#888888", lineHeight: 1.8 }}>
              GlobalPulseAI 把这四个关键环节，收敛到同一个工作台里。
            </p>
          </div>

          {/* Right list */}
          <div className="flex-1">
            {CAPABILITIES.map((cap) => (
              <div key={cap.num} className="flex items-start gap-8 py-7 group transition-all duration-200"
                style={{ borderTop: "1px solid #EAEAEA" }}>
                <span className="shrink-0 font-mono text-[12px] font-bold pt-0.5 w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: cap.accentBg, color: cap.accentColor, border: `1px solid ${cap.border}`, minWidth: "32px" }}>
                  {cap.num}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2.5" style={{ fontSize: "16px", color: "#111111", fontWeight: 600 }}>{cap.title}</h3>
                  <p style={{ fontSize: "14.5px", color: "#888888", lineHeight: 1.75 }}>
                    {cap.desc.split("而不是").map((part, i) =>
                      i === 0 ? <span key={i}>{part}</span> : <span key={i}><span style={{ color: "#CCCCCC" }}>而不是{part}</span></span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #EAEAEA" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
