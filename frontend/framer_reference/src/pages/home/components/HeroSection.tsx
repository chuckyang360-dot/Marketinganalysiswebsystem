import { useState, useEffect, useRef } from "react";

type TabKey = "market" | "content" | "product" | "workflow";

interface PanelTab {
  key: TabKey;
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TABS: PanelTab[] = [
  { key: "market", icon: "ri-radar-line", label: "营销分析", color: "#fb923c", bgColor: "rgba(251,146,60,0.1)", borderColor: "rgba(251,146,60,0.2)" },
  { key: "content", icon: "ri-quill-pen-line", label: "内容制作", color: "#7B61FF", bgColor: "rgba(123,97,255,0.1)", borderColor: "rgba(123,97,255,0.2)" },
  { key: "product", icon: "ri-shopping-bag-3-line", label: "商品分析", color: "#0ea5e9", bgColor: "rgba(14,165,233,0.1)", borderColor: "rgba(14,165,233,0.2)" },
  { key: "workflow", icon: "ri-flow-chart", label: "工作流", color: "#8b5cf6", bgColor: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.2)" },
];

const PANEL_CONTENT: Record<TabKey, React.ReactNode> = {
  market: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3 rounded-full bg-orange-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>
          市场需求洞察
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ color: "#fb923c", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
          Reddit + X + Amazon
        </span>
      </div>
      {[
        { text: "跨境退款延迟是首要痛点", score: "97%", src: "Reddit" },
        { text: "物流时效不明导致弃单率高", score: "91%", src: "Amazon" },
        { text: "尺码不一致引发大量退货", score: "88%", src: "Reviews" },
        { text: "⚠ 移动端结账转化偏低", score: "−23%", warn: true, src: "Analytics" },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{
            background: item.warn ? "rgba(239,68,68,0.04)" : "#F7F8FA",
            border: item.warn ? "1px solid rgba(239,68,68,0.15)" : "1px solid #EAEAEA",
          }}>
          {item.warn
            ? <span className="text-[11px] shrink-0 mt-0.5" style={{ color: "#ef4444" }}>⚠</span>
            : <span className="text-[9px] text-orange-400 shrink-0 mt-1">▲</span>
          }
          <span className="flex-1 text-[12px] leading-snug" style={{ color: item.warn ? "#ef4444" : "#444444" }}>
            {item.text}
          </span>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-[10.5px] font-bold" style={{ color: item.warn ? "#ef4444" : "#059669" }}>
              {item.score}{!item.warn ? " ↑" : ""}
            </span>
            <span className="text-[9.5px]" style={{ color: "#AAAAAA" }}>{item.src}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1.5 px-1" style={{ color: "#AAAAAA", fontSize: "11px" }}>
        <i className="ri-loader-4-line text-[11px]" style={{ color: "#fb923c" }} />
        <span style={{ fontFamily: "monospace" }}>正在分析 12,482 条帖子... (2.3s)</span>
      </div>
    </div>
  ),

  content: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3 rounded-full" style={{ background: "#7B61FF" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#7B61FF" }}>
          内容选题 · AI 生成
        </span>
      </div>
      {[
        { tag: "高热选题", text: "你的 Shopify 店用一个 AI 工具月销破 $50K，POV 视角记录全程", est: "预估 18K–32K 播放" },
        { tag: "转化型", text: "停止用老方法写产品标题——这是 50,000 条评论告诉我们真正有效的方式", est: "预估 24K–44K 播放" },
      ].map((hook, i) => (
        <div key={i} className="rounded-xl p-3.5"
          style={{ background: "rgba(123,97,255,0.05)", border: "1px solid rgba(123,97,255,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9.5px] font-bold uppercase tracking-wide" style={{ color: "#7B61FF", opacity: 0.7 }}>
              选题 #{i + 1} · {hook.tag}
            </span>
            <span className="ml-auto text-[10px]" style={{ color: "#059669" }}>
              {hook.est}
            </span>
          </div>
          <p className="text-[12.5px] leading-snug mb-2.5" style={{ color: "#444444" }}>
            &ldquo;{hook.text}&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{ color: "#888888", border: "1px solid #EAEAEA", background: "#F7F8FA" }}>
              <i className="ri-file-copy-line text-[10px]" /> 复制
            </button>
            <button className="inline-flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{ color: "#7B61FF", border: "1px solid rgba(123,97,255,0.25)", background: "rgba(123,97,255,0.06)" }}>
              <i className="ri-refresh-line text-[10px]" /> 重新生成
            </button>
          </div>
        </div>
      ))}
    </div>
  ),

  product: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3 rounded-full" style={{ background: "#0ea5e9" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0ea5e9" }}>
          商品标题优化
        </span>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #EAEAEA" }}>
        <div className="px-4 py-3" style={{ background: "rgba(239,68,68,0.04)", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
          <span className="block text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#ef4444", opacity: 0.7 }}>
            优化前
          </span>
          <p className="text-[12px] line-through leading-snug" style={{ color: "#AAAAAA" }}>
            Wireless Earbuds Bluetooth 5.0 Headphones TWS
          </p>
          <span className="mt-1.5 inline-block text-[10.5px] font-bold" style={{ color: "#ef4444", opacity: 0.7 }}>
            CTR 2.3%
          </span>
        </div>
        <div className="px-4 py-3" style={{ background: "rgba(5,150,105,0.04)" }}>
          <span className="block text-[9.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#059669" }}>
            优化后
          </span>
          <p className="text-[12px] font-medium leading-snug" style={{ color: "#111111" }}>
            无线耳机 2024 升级版 — 48H续航 主动降噪 USB-C快充
          </p>
          <span className="mt-1.5 inline-block text-[10.5px] font-bold" style={{ color: "#059669" }}>
            CTR 8.7% &nbsp;↑ +278%
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { icon: "ri-image-edit-line", label: "主图背景优化", score: "+12%点击" },
          { icon: "ri-star-line", label: "好评关键词提取", score: "32条洞察" },
          { icon: "ri-bar-chart-2-line", label: "竞品对比分析", score: "发现3个空白" },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#F7F8FA" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center rounded-md" style={{ background: "rgba(14,165,233,0.1)" }}>
                <i className={`${s.icon} text-[11px]`} style={{ color: "#0ea5e9" }} />
              </div>
              <span className="text-[11.5px]" style={{ color: "#444444" }}>{s.label}</span>
            </div>
            <span className="text-[11px] font-bold" style={{ color: "#059669" }}>{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  ),

  workflow: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[3px] h-3 rounded-full" style={{ background: "#8b5cf6" }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8b5cf6" }}>
          工作流沉淀
        </span>
      </div>
      {[
        { icon: "ri-time-line", label: "耳机市场分析报告", time: "2小时前", tag: "已归档", tagColor: "#8b5cf6" },
        { icon: "ri-file-text-line", label: "Q4出海内容选题库 · 32条方向", time: "昨天", tag: "进行中", tagColor: "#0ea5e9" },
        { icon: "ri-shopping-bag-3-line", label: "蓝牙产品系列优化建议", time: "3天前", tag: "已完成", tagColor: "#059669" },
        { icon: "ri-lightbulb-flash-line", label: "竞品洞察 · 发现5个需求空白", time: "上周", tag: "已归档", tagColor: "#8b5cf6" },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
          style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0" style={{ background: "rgba(139,92,246,0.1)" }}>
            <i className={`${item.icon} text-[13px]`} style={{ color: "#8b5cf6" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: "#444444" }}>{item.label}</p>
            <p className="text-[10.5px]" style={{ color: "#AAAAAA" }}>{item.time}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            style={{ color: item.tagColor, background: `${item.tagColor}14`, border: `1px solid ${item.tagColor}30` }}>
            {item.tag}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2 px-1" style={{ color: "#AAAAAA", fontSize: "11.5px" }}>
        <i className="ri-database-2-line text-[11px]" style={{ color: "rgba(139,92,246,0.5)" }} />
        <span>全部分析自动留存，随时调取回溯</span>
      </div>
    </div>
  ),
};

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("market");
  const [cursorBlink, setCursorBlink] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setCursorBlink((v) => !v), 530);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    const tabKeys: TabKey[] = ["market", "content", "product", "workflow"];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % tabKeys.length;
      setActiveTab(tabKeys[idx]);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative flex items-center overflow-hidden"
      style={{ minHeight: "90vh", background: "#ffffff" }}
    >
      {/* Subtle top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
        style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF)" }}
      />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 lg:px-10 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* LEFT 45% */}
          <div className="w-full lg:w-[45%] shrink-0">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7 cursor-default"
              style={{ background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.2)" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[11.5px] font-medium tracking-wide" style={{ color: "#7B61FF" }}>
                出海团队 · AI 营销增长工作台
              </span>
            </div>

            <h1
              className="font-bold leading-[1.08] tracking-[-0.025em] mb-5"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(40px, 4.4vw, 62px)", maxWidth: "560px", fontWeight: 800, color: "#111111" }}
            >
              面向出海团队的{" "}
              <span style={{ background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                AI 营销
              </span>
              <br />与商品增长工作台
            </h1>

            <p className="leading-[1.65] mb-8" style={{ fontSize: "clamp(14px, 1.05vw, 16px)", color: "#888888", maxWidth: "490px" }}>
              把市场洞察、内容制作、商品分析与执行承接放进同一套工作流，帮助团队更快发现机会、产出内容并优化商品。
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <a
                href="#workspace"
                className="inline-flex items-center gap-2 text-white font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 hover:opacity-90"
                style={{ fontSize: "15px", padding: "13px 26px", borderRadius: "10px", background: "linear-gradient(135deg, #7B61FF 0%, #5B8CFF 100%)" }}
              >
                <i className="ri-dashboard-line text-[14px]" />
                进入工作台
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-all duration-200 group"
                style={{ fontSize: "15px", color: "#888888" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}
              >
                查看定价
                <i className="ri-arrow-right-line text-[13px] transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>

            <p className="text-[12px] tracking-wide mb-4" style={{ color: "#AAAAAA" }}>
              无需配置 &nbsp;·&nbsp; 秒级响应 &nbsp;·&nbsp; 专为出海团队打造
            </p>

            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)" }}
            >
              <i className="ri-group-line text-[11px]" style={{ color: "#059669" }} />
              <span className="text-[12px] font-semibold" style={{ color: "#059669" }}>
                全球 2,000+ 团队正在使用
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <span
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    background: activeTab === tab.key ? tab.bgColor : "#F7F8FA",
                    border: activeTab === tab.key ? `1px solid ${tab.borderColor}` : "1px solid #EAEAEA",
                    color: activeTab === tab.key ? tab.color : "#888888",
                  }}
                >
                  <i className={`${tab.icon} text-[11px]`} />
                  {tab.label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT 55% — Product Panel */}
          <div className="w-full lg:w-[55%] relative">
            <div
              className="relative rounded-[16px] overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid #EAEAEA",
              }}
            >
              {/* Window header */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid #EAEAEA", background: "#F7F8FA" }}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[12px] font-semibold tracking-wide" style={{ color: "#444444" }}>GlobalPulseAI 工作台</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.2)" }}
                  >
                    ● 实时分析
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.5)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,0.5)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,0.5)" }} />
                </div>
              </div>

              {/* Command line */}
              <div className="px-5 py-2.5" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                <div className="flex items-center gap-2 font-mono" style={{ fontSize: "12px", color: "#AAAAAA" }}>
                  <span style={{ color: "#7B61FF" }}>›</span>
                  <span>正在分析：{" "}<span style={{ color: "#444444" }}>跨境无线耳机 · 出海市场 · 2024 Q4</span></span>
                  <span
                    className="ml-0.5 inline-block w-[2px] h-[12px] rounded-sm"
                    style={{ background: "#7B61FF", opacity: cursorBlink ? 0.9 : 0, transition: "opacity 0.1s" }}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-4 pt-3 pb-2" style={{ borderBottom: "1px solid #F0F0F0" }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                    style={{
                      background: activeTab === tab.key ? tab.bgColor : "transparent",
                      color: activeTab === tab.key ? tab.color : "#AAAAAA",
                      border: activeTab === tab.key ? `1px solid ${tab.borderColor}` : "1px solid transparent",
                    }}
                  >
                    <i className={`${tab.icon} text-[11px]`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div className="px-5 pt-4 pb-5" style={{ minHeight: "340px" }}>
                <div key={activeTab}>{PANEL_CONTENT[activeTab]}</div>
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-medium" style={{ color: "#AAAAAA" }}>Powered by</span>
                  <span className="text-[10.5px] font-bold" style={{ color: "#7B61FF" }}>GlobalPulseAI v2</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10.5px]" style={{ color: "#059669" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
