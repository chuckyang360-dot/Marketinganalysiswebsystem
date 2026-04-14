const useCases = [
  {
    icon: "ri-store-2-line",
    role: "Amazon 卖家",
    tagline: "找到差距，赢得排名，扩大营收。",
    desc: "跨越评论、Reddit、竞品数据发现真实用户需求，自动优化商品标题与卖点，挖掘竞品盲区——都在一个工作台里。",
    points: ["商品机会探索", "标题与 Bullet 重写", "评论情绪分析", "竞品空白识别"],
    metric: "平均 CTR 提升 67%",
    metricIcon: "ri-arrow-up-line",
    accentColor: "#7B61FF",
    badgeColor: "#7B61FF",
  },
  {
    icon: "ri-shopping-bag-3-line",
    role: "DTC 出海品牌",
    tagline: "在受众开口之前，先读懂他们。",
    desc: "通过社交监听转化为内容策略。精准了解受众在各平台的真实需求，产出数据驱动的营销内容与推广方向。",
    points: ["多平台信号整合", "内容日历自动生成", "品牌定位洞察", "受众痛点地图"],
    metric: "内容产出效率提升 3 倍",
    metricIcon: "ri-timer-flash-line",
    accentColor: "#0ea5e9",
    badgeColor: "#0ea5e9",
  },
  {
    icon: "ri-video-line",
    role: "内容创作者",
    tagline: "创作已经有人在搜索的内容。",
    desc: "不再猜测什么会火。从 TikTok、Reddit、X 的真实趋势信号中，获取数据支撑的钩子、脚本和内容创意。",
    points: ["爆款选题预测", "钩子与脚本生成", "跨平台趋势发现", "垂类受众地图"],
    metric: "内容创意量提升 10 倍",
    metricIcon: "ri-lightbulb-flash-line",
    accentColor: "#059669",
    badgeColor: "#059669",
  },
];

export default function GrowthEngineSection() {
  return (
    <section id="cases" className="py-28 lg:py-36 relative overflow-hidden" style={{ background: "#ffffff" }}>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <span
            className="inline-block text-[11.5px] uppercase tracking-[0.18em] font-bold mb-4 px-3.5 py-1 rounded-full"
            style={{ color: "#7B61FF", background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.15)" }}
          >
            适用团队
          </span>
          <h2
            className="font-extrabold tracking-[-0.03em] leading-[1.1] mb-5"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 4vw, 48px)", color: "#111111" }}
          >
            谁在使用{" "}
            <span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              GlobalPulseAI
            </span>
          </h2>
          <p className="text-[16px] max-w-[480px] mx-auto leading-relaxed" style={{ color: "#888888" }}>
            无论你做产品销售还是内容创作，GlobalPulseAI 都能随你的增长目标扩展。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {useCases.map((c) => (
            <div
              key={c.role}
              className="group rounded-2xl overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${c.accentColor}30`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}
            >
              <div className="p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: `${c.accentColor}12`, border: `1px solid ${c.accentColor}25` }}
                  >
                    <i className={`${c.icon} text-[17px]`} style={{ color: c.accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold leading-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>{c.role}</h3>
                    <p className="text-[12px] font-medium" style={{ color: "#888888" }}>{c.tagline}</p>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "#888888" }}>{c.desc}</p>
                <ul className="space-y-2.5 mb-6">
                  {c.points.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-[13px]" style={{ color: "#444444" }}>
                      <i className="ri-check-line text-[13px] shrink-0 text-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 pt-5" style={{ borderTop: "1px solid #EAEAEA" }}>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: `${c.accentColor}12` }}>
                    <i className={`${c.metricIcon} text-[11px]`} style={{ color: c.badgeColor }} />
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: c.badgeColor }}>{c.metric}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
