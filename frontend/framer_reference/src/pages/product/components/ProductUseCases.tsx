import { useNavigate } from "react-router-dom";

const CASES = [
  { category: "电商出海", title: "Shopify SEO 优化", desc: "整合搜索趋势与用户评论，优化标题与内容结构", result: "自然流量提升 3x+", accentColor: "#fb923c", accentBg: "rgba(251,146,60,0.07)", icon: "ri-shopping-cart-2-line" },
  { category: "产品增长", title: "SaaS 增长策略", desc: "从用户需求与竞品切入，找到内容与产品突破口", result: "内容产出效率提升 5x", accentColor: "#7B61FF", accentBg: "rgba(123,97,255,0.07)", icon: "ri-rocket-2-line" },
  { category: "内容营销", title: "B2B 内容营销", desc: "建立稳定内容输出体系，持续覆盖目标用户", result: "转化率显著提升", accentColor: "#0ea5e9", accentBg: "rgba(14,165,233,0.07)", icon: "ri-file-text-line" },
];

export default function ProductUseCases() {
  const navigate = useNavigate();
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-6">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1.5 rounded-full"
              style={{ color: "#7B61FF", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.18)" }}>
              应用场景
            </span>
            <h2 className="font-bold leading-[1.2] tracking-[-0.02em]"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(22px, 2.4vw, 32px)", color: "#111111" }}>
              适用于需要增长结果的团队
            </h2>
          </div>
          <button onClick={() => navigate("/case")}
            className="inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-all duration-200 shrink-0"
            style={{ fontSize: "14px", color: "#888888" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}>
            查看全部案例<i className="ri-arrow-right-line text-[13px]" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CASES.map((c) => (
            <div key={c.title} className="group relative flex flex-col gap-4 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${c.accentColor}40`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: c.accentBg, border: `1px solid ${c.accentColor}22` }}>
                    <i className={`${c.icon} text-[17px]`} style={{ color: c.accentColor }} />
                  </div>
                  <span className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: c.accentColor }}>{c.category}</span>
                </div>
                <h3 className="font-semibold leading-snug mb-2" style={{ fontSize: "17px", color: "#111111" }}>{c.title}</h3>
                <p style={{ fontSize: "13.5px", color: "#888888", lineHeight: 1.75 }}>{c.desc}</p>
                <div className="pt-4 mt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${c.accentColor}15` }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span style={{ fontSize: "12.5px", color: "#059669", fontWeight: 600 }}>{c.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
