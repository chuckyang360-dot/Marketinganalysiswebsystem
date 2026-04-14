import { useNavigate } from "react-router-dom";

export default function ProductHero() {
  const navigate = useNavigate();
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#ffffff", minHeight: "60vh", display: "flex", alignItems: "center" }}>
      <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF)" }} />
      <div className="relative z-10 w-full mx-auto px-6 lg:px-10 pt-36 pb-20 text-center" style={{ maxWidth: "820px" }}>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 cursor-default"
          style={{ background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.2)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-medium tracking-wide" style={{ color: "#7B61FF" }}>产品介绍 · GlobalPulseAI</span>
        </span>
        <h1 className="font-extrabold leading-[1.1] tracking-[-0.03em] mb-6"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(34px, 4.8vw, 58px)", color: "#111111" }}>
          大多数团队卡在分析之后，
          <br />
          <span style={{ background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            GlobalPulseAI 让增长继续发生
          </span>
        </h1>
        <p className="mx-auto leading-[1.85] mb-10" style={{ fontSize: "clamp(15px, 1.15vw, 17px)", color: "#888888", maxWidth: "580px" }}>
          把市场判断、内容生产、商品优化与执行承接放进同一套工作流，不再停在"看懂"，而是直接推进下一步增长。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button onClick={() => navigate("/workspace")}
            className="inline-flex items-center gap-2 font-semibold text-white whitespace-nowrap cursor-pointer transition-all duration-200 hover:opacity-90"
            style={{ fontSize: "15px", padding: "13px 28px", borderRadius: "10px", background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
            <i className="ri-dashboard-line text-[14px]" />进入工作台
          </button>
          <button onClick={() => navigate("/pricing")}
            className="inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-all duration-200"
            style={{ fontSize: "15px", padding: "13px 28px", borderRadius: "10px", color: "#444444", border: "1px solid #EAEAEA", background: "#ffffff" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; (e.currentTarget as HTMLElement).style.color = "#111111"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.color = "#444444"; }}>
            查看定价<i className="ri-arrow-right-line text-[13px]" />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { icon: "ri-radar-line", label: "营销分析", color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
            { icon: "ri-quill-pen-line", label: "内容制作", color: "#7B61FF", bg: "rgba(123,97,255,0.08)" },
            { icon: "ri-shopping-bag-3-line", label: "商品分析", color: "#0ea5e9", bg: "rgba(14,165,233,0.08)" },
            { icon: "ri-flow-chart", label: "工作流沉淀", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
          ].map((pill) => (
            <span key={pill.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap"
              style={{ padding: "6px 14px", borderRadius: "999px", background: pill.bg, border: `1px solid ${pill.color}22`, color: pill.color }}>
              <i className={`${pill.icon} text-[11px]`} />{pill.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
