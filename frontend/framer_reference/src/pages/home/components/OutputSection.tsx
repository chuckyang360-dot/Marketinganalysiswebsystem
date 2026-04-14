const marketInsights = [
  { topic: "跨境退款延迟首要痛点", platform: "Reddit", trend: "+340%", hot: true },
  { topic: "物流时效不明导致高弃单", platform: "Amazon Reviews", trend: "+218%", hot: false },
  { topic: "同日达期望正在快速上涨", platform: "X / Twitter", trend: "+187%", hot: false },
  { topic: "尺码不一致引发大量退货", platform: "Reddit", trend: "+156%", hot: false },
  { topic: "开箱体验内容需求激增", platform: "TikTok", trend: "+142%", hot: false },
];

const contentDirections = [
  { text: "你刚刚发现了顾客购买前说的那些话——而你的竞争对手完全不知道", est: "18K–32K 预估播放", tag: "高转化选题" },
  { text: "停止用老方法写产品标题。AI 从 50,000 条 Amazon 评论里找到了真正有效的写法", est: "24K–44K 预估播放", tag: "爆款钩子" },
  { text: "这个让跨境卖家损失 23% 营收的物流投诉，你今天就可以解决", est: "12K–28K 预估播放", tag: "痛点共鸣" },
];

const productActions = [
  { icon: "ri-file-edit-line", label: "标题重写（利益驱动版）", result: "CTR ↑ 278%", color: "#0ea5e9" },
  { icon: "ri-image-edit-line", label: "主图优化建议", result: "+12% 点击", color: "#7B61FF" },
  { icon: "ri-star-line", label: "评论关键词提炼", result: "32 条洞察", color: "#fb923c" },
  { icon: "ri-bar-chart-2-line", label: "竞品空白分析", result: "3 个机会点", color: "#8b5cf6" },
];

const workflowItems = [
  { icon: "ri-time-line", label: "耳机市场分析报告 · Q4", time: "2小时前", color: "#8b5cf6" },
  { icon: "ri-quill-pen-line", label: "出海内容选题库 · 32条方向", time: "昨天", color: "#7B61FF" },
  { icon: "ri-shopping-bag-3-line", label: "蓝牙产品系列优化建议", time: "3天前", color: "#0ea5e9" },
  { icon: "ri-lightbulb-flash-line", label: "竞品洞察 · 5个需求空白", time: "上周", color: "#fb923c" },
];

export default function OutputSection() {
  return (
    <section id="output" className="relative py-28 lg:py-36 overflow-hidden" style={{ background: "#ffffff" }}>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-16">
          <span
            className="inline-block text-[11.5px] uppercase tracking-[0.18em] font-bold mb-4 px-3.5 py-1 rounded-full"
            style={{ color: "#7B61FF", background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.18)" }}
          >
            输出结果
          </span>
          <h2
            className="font-extrabold tracking-[-0.03em] leading-[1.1] mb-4"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 4vw, 48px)", color: "#111111" }}
          >
            你最终会得到{" "}
            <span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              这些可执行结果
            </span>
          </h2>
          <p className="text-[16px] max-w-[480px] leading-relaxed" style={{ color: "#888888" }}>
            不是报告，不是建议，是直接可用的内容、商品方向和执行动作。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Market Insights */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400" />
                </span>
                <span className="text-[13px] font-semibold" style={{ color: "#444444" }}>市场洞察</span>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                style={{ color: "#fb923c", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />实时数据
              </span>
            </div>
            <div className="p-4 space-y-2.5 flex-1">
              {marketInsights.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background: "#F7F8FA", border: t.hot ? "1px solid rgba(251,146,60,0.2)" : "1px solid transparent" }}
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium leading-snug truncate" style={{ color: "#444444" }}>{t.topic}</p>
                    <span className="text-[11px]" style={{ color: "#AAAAAA" }}>{t.platform}</span>
                  </div>
                  <span className="text-[12px] font-bold shrink-0" style={{ color: t.hot ? "#fb923c" : "#7B61FF" }}>{t.trend}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 flex items-center gap-1.5" style={{ borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <i className="ri-refresh-line text-[11px]" style={{ color: "#AAAAAA" }} />
              <span className="text-[11px]" style={{ color: "#AAAAAA" }}>2 分钟前更新</span>
            </div>
          </div>

          {/* Content Direction */}
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
            <div className="relative px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <div className="flex items-center gap-2">
                <i className="ri-quill-pen-line text-[14px]" style={{ color: "#7B61FF" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#444444" }}>内容方向</span>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                style={{ color: "#7B61FF", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)" }}
              >
                <i className="ri-sparkling-2-fill text-[10px]" />AI 生成
              </span>
            </div>
            <div className="relative p-5 space-y-3">
              {contentDirections.map((c, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>方向 #{i + 1} · {c.tag}</span>
                    <span className="text-[10.5px] font-semibold" style={{ color: "#059669" }}>{c.est}</span>
                  </div>
                  <p className="text-[12.5px] leading-[1.55] mb-2.5" style={{ color: "#444444" }}>&ldquo;{c.text}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                      style={{ color: "#888888", border: "1px solid #EAEAEA", background: "#ffffff" }}
                    >
                      <i className="ri-file-copy-line text-[11px]" /> 复制
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                      style={{ color: "#888888", border: "1px solid #EAEAEA", background: "#ffffff" }}
                    >
                      <i className="ri-refresh-line text-[11px]" /> 重新生成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product suggestions */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <div className="flex items-center gap-2">
                <i className="ri-shopping-bag-3-line text-[14px]" style={{ color: "#0ea5e9" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#444444" }}>商品建议</span>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                style={{ color: "#0ea5e9", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)" }}
              >
                <i className="ri-sparkling-2-fill text-[10px]" /> AI 生成
              </span>
            </div>
            <div>
              <div className="px-5 py-3.5" style={{ background: "rgba(239,68,68,0.03)", borderBottom: "1px solid rgba(239,68,68,0.08)" }}>
                <span className="block text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#ef4444", opacity: 0.7 }}>优化前</span>
                <p className="text-[12.5px] line-through" style={{ color: "#AAAAAA" }}>Wireless Earbuds Bluetooth 5.0 TWS</p>
                <span className="text-[11px] font-bold" style={{ color: "#ef4444", opacity: 0.7 }}>CTR 2.3%</span>
              </div>
              <div className="px-5 py-3.5" style={{ background: "rgba(5,150,105,0.03)", borderBottom: "1px solid #F0F0F0" }}>
                <span className="block text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#059669" }}>优化后</span>
                <p className="text-[12.5px] font-medium" style={{ color: "#111111" }}>无线耳机 2024 — 48H续航 主动降噪 USB-C快充</p>
                <span className="text-[11px] font-bold" style={{ color: "#059669" }}>CTR 8.7% ↑ +278%</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {productActions.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl" style={{ background: "#F7F8FA" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 flex items-center justify-center rounded-md" style={{ background: `${s.color}12` }}>
                      <i className={`${s.icon} text-[12px]`} style={{ color: s.color }} />
                    </div>
                    <span className="text-[12px]" style={{ color: "#444444" }}>{s.label}</span>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: "#059669" }}>{s.result}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow archive */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <div className="flex items-center gap-2">
                <i className="ri-flow-chart text-[14px]" style={{ color: "#8b5cf6" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#444444" }}>执行承接</span>
              </div>
              <span className="text-[11px] font-medium" style={{ color: "#AAAAAA" }}>自动归档</span>
            </div>
            <div className="p-4 space-y-2.5">
              {workflowItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0" style={{ background: `${item.color}12` }}>
                    <i className={`${item.icon} text-[13px]`} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: "#444444" }}>{item.label}</p>
                    <p className="text-[10.5px]" style={{ color: "#AAAAAA" }}>{item.time}</p>
                  </div>
                  <i className="ri-arrow-right-s-line text-[14px] shrink-0" style={{ color: "#DDDDDD" }} />
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}>
              <i className="ri-database-2-line text-[11px]" style={{ color: "rgba(139,92,246,0.5)" }} />
              <span className="text-[11.5px]" style={{ color: "#AAAAAA" }}>全部分析自动留存，随时调取回溯</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
