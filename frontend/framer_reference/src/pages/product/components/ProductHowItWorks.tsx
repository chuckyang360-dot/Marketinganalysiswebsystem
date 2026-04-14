const STEPS = [
  { num: "1", title: "输入你的市场、内容或商品问题", desc: "可以是方向、链接或已有素材，而不是固定格式的关键词。", accentColor: "#fb923c", accentBg: "rgba(251,146,60,0.08)" },
  { num: "2", title: "系统整合多来源信号并完成结构化分析", desc: "自动对齐不同来源数据，输出可判断的结论，而不是信息堆叠。", accentColor: "#7B61FF", accentBg: "rgba(123,97,255,0.08)" },
  { num: "3", title: "直接得到可执行的内容、商品与下一步动作", desc: "不是分析报告，而是可以立即使用的方向与优化建议。", accentColor: "#059669", accentBg: "rgba(5,150,105,0.08)" },
];

export default function ProductHowItWorks() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-col lg:flex-row lg:gap-24">
          <div className="lg:w-64 shrink-0 mb-10 lg:mb-0">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1.5 rounded-full"
              style={{ color: "#7B61FF", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.18)" }}>
              工作流程
            </span>
            <h2 className="font-bold leading-[1.2] tracking-[-0.02em]"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(20px, 2.2vw, 28px)", color: "#111111" }}>
              不是一次分析，<br />而是一套可复用<br />的方法
            </h2>
          </div>
          <div className="flex-1 flex flex-col gap-0">
            {STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-6 py-8" style={{ borderTop: "1px solid #EAEAEA" }}>
                <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-bold"
                  style={{ background: step.accentBg, color: step.accentColor, border: `1px solid ${step.accentColor}25`, fontFamily: "'Syne', sans-serif" }}>
                  {step.num}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold mb-2" style={{ fontSize: "16px", color: "#111111", fontWeight: 600 }}>{step.title}</h3>
                  <p style={{ fontSize: "14.5px", color: "#888888", lineHeight: 1.75 }}>
                    {step.desc.split("而不是").map((part, i) =>
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
