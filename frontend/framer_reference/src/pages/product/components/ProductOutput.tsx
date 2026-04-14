const OUTPUT_ITEMS = [
  { key: "市场洞察", desc: "明确需求、趋势与竞争空白，而不是零散信息。", accentColor: "#fb923c", accentBg: "rgba(251,146,60,0.07)" },
  { key: "内容方向", desc: "可直接执行的选题与表达结构，而不是抽象建议。", accentColor: "#7B61FF", accentBg: "rgba(123,97,255,0.07)" },
  { key: "商品建议", desc: "针对标题、主图与卖点的具体优化方向。", accentColor: "#0ea5e9", accentBg: "rgba(14,165,233,0.07)" },
  { key: "行动路径", desc: "下一步该做什么，以及如何持续迭代。", accentColor: "#8b5cf6", accentBg: "rgba(139,92,246,0.07)" },
];

function OutputMock() {
  return (
    <div className="space-y-2.5">
      <div className="text-[10.5px] font-bold uppercase tracking-widest mb-4" style={{ color: "#AAAAAA" }}>本次分析输出 · 可直接使用</div>
      {OUTPUT_ITEMS.map((item, i) => (
        <div key={i} className="flex items-start gap-4 px-4 py-3.5 rounded-xl"
          style={{ background: item.accentBg, border: `1px solid ${item.accentColor}20` }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 text-[11px] font-bold"
            style={{ background: `${item.accentColor}15`, color: item.accentColor, fontFamily: "'Syne', sans-serif" }}>
            {String(i + 1).padStart(2, "0")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#111111" }}>{item.key}</p>
            <p className="text-[12px]" style={{ color: "#888888", lineHeight: 1.6 }}>
              {item.desc.split("而不是").map((part, j) =>
                j === 0 ? <span key={j}>{part}</span> : <span key={j}><span style={{ color: "#CCCCCC" }}>而不是{part}</span></span>
              )}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10.5px]" style={{ color: "#059669" }}>已生成</span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl mt-2" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
        <span className="text-[12px]" style={{ color: "#888888" }}>导出完整分析</span>
        <div className="flex items-center gap-2">
          {["导出 PDF", "复制链接"].map((btn) => (
            <button key={btn} className="text-[11px] px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "#ffffff", color: "#444444", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLElement).style.color = "#111111"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; (e.currentTarget as HTMLElement).style.color = "#444444"; }}>
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductOutput() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#F7F8FA", borderBottom: "1px solid #EAEAEA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-20">
          <div className="w-full lg:w-[40%] shrink-0">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-5 px-3.5 py-1.5 rounded-full"
              style={{ color: "#7B61FF", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.18)" }}>
              分析结果
            </span>
            <h2 className="font-bold leading-[1.2] tracking-[-0.02em] mb-5"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(22px, 2.4vw, 32px)", color: "#111111" }}>
              你拿到的不是报告，<br />而是可以直接用的结果
            </h2>
            <p style={{ fontSize: "15px", color: "#888888", lineHeight: 1.8, maxWidth: "340px" }}>不是决策参考，而是决策本身和下一步动作。</p>
            <div className="mt-8 flex flex-col gap-5">
              {OUTPUT_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: item.accentColor }} />
                  <div>
                    <p className="text-[14px] font-semibold mb-0.5" style={{ color: "#111111" }}>{item.key}</p>
                    <p className="text-[13px]" style={{ color: "#888888", lineHeight: 1.65 }}>
                      {item.desc.split("而不是").map((part, j) =>
                        j === 0 ? <span key={j}>{part}</span> : <span key={j}><span style={{ color: "#CCCCCC" }}>而不是{part}</span></span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:flex-1">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
              <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.5)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,0.5)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,0.5)" }} />
                </div>
                <span className="text-[11px] ml-2 font-medium" style={{ color: "#7B61FF" }}>分析输出</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)" }}>
                  ● 已完成
                </span>
              </div>
              <div className="p-5 lg:p-6"><OutputMock /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
