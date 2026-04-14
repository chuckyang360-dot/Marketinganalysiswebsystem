const capabilities = [
  {
    icon: "ri-radar-line",
    num: "01",
    title: "营销分析",
    sub: "把分散信号整合成决策",
    desc: "整合 Reddit、X、SEO、Amazon 多平台数据，识别真实用户需求、趋势变化与竞争空白，不再靠直觉猜测市场。",
    points: ["实时需求趋势追踪", "用户痛点自动聚类", "竞品信号对比分析", "跨平台情报统一视图"],
    result: "每日处理 10,000+ 条市场信号",
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.1)",
    borderColor: "rgba(251,146,60,0.2)",
  },
  {
    icon: "ri-quill-pen-line",
    num: "02",
    title: "内容制作",
    sub: "把洞察转成可执行内容",
    desc: "基于真实数据生成选题方向、内容脚本、广告文案和 SEO 文章。每一条内容背后都有市场信号支撑。",
    points: ["TikTok 爆款钩子生成", "广告文案一键输出", "SEO 内容框架搭建", "多平台格式适配"],
    result: "内容产出效率提升 10 倍",
    iconColor: "#7B61FF",
    iconBg: "rgba(123,97,255,0.1)",
    borderColor: "rgba(123,97,255,0.2)",
  },
  {
    icon: "ri-shopping-bag-3-line",
    num: "03",
    title: "商品分析",
    sub: "把商品页转成转化建议",
    desc: "分析商品标题、评论、卖点与竞品数据，自动输出优化建议、改写标题、提升图片方向，直接提升 CTR。",
    points: ["标题与 Bullet 重写", "评论关键词提炼", "图片优化建议", "A/B 变体生成"],
    result: "平均 CTR 提升幅度 67%",
    iconColor: "#0ea5e9",
    iconBg: "rgba(14,165,233,0.1)",
    borderColor: "rgba(14,165,233,0.2)",
  },
  {
    icon: "ri-flow-chart",
    num: "04",
    title: "工作流沉淀",
    sub: "把分析结果留在工作台",
    desc: "每次分析自动归档，历史洞察随时调取。下一步动作清晰排列，团队协作不丢上下文。",
    points: ["分析报告自动归档", "历史洞察追踪回溯", "下一步动作沉淀", "多人协作共享工作流"],
    result: "告别反复重复相同分析",
    iconColor: "#8b5cf6",
    iconBg: "rgba(139,92,246,0.1)",
    borderColor: "rgba(139,92,246,0.2)",
  },
];

export default function ProblemSection() {
  return (
    <section id="product" className="relative py-28 lg:py-36 overflow-hidden" style={{ background: "#F7F8FA" }}>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <span
            className="inline-block text-[11.5px] uppercase tracking-[0.18em] font-bold mb-4 px-3.5 py-1 rounded-full"
            style={{ color: "#7B61FF", background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.18)" }}
          >
            产品能力
          </span>
          <h2
            className="font-extrabold tracking-[-0.03em] leading-[1.1] mb-4"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 4vw, 48px)", color: "#111111" }}
          >
            一套工作台，覆盖{" "}
            <span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              四类核心能力
            </span>
          </h2>
          <p className="text-[16px] max-w-[480px] mx-auto leading-relaxed" style={{ color: "#888888" }}>
            从市场信号到可执行输出，GlobalPulseAI 把出海团队最需要的四种能力整合进同一个工作流。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="group relative rounded-2xl p-6 cursor-default overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = cap.borderColor; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl" style={{ background: cap.iconBg }}>
                  <i className={`${cap.icon} text-[20px]`} style={{ color: cap.iconColor }} />
                </div>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: "#DDDDDD" }}>{cap.num}</span>
              </div>
              <h3 className="text-[16px] font-bold mb-0.5" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>{cap.title}</h3>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: cap.iconColor }}>{cap.sub}</p>
              <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#888888" }}>{cap.desc}</p>
              <ul className="space-y-2 mb-5">
                {cap.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[12px]" style={{ color: "#888888" }}>
                    <i className="ri-check-line text-[12px] shrink-0 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 pt-4" style={{ borderTop: "1px solid #EAEAEA" }}>
                <i className="ri-arrow-right-up-line text-[13px]" style={{ color: cap.iconColor }} />
                <span className="text-[12px] font-semibold" style={{ color: "#444444" }}>{cap.result}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
