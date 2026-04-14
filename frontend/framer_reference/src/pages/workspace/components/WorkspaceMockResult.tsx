import { useState } from "react";

const RESULT_TABS = ["市场洞察", "内容方向", "商品优化", "行动建议"];

const RESULT_DATA: Record<string, { badge: string; badgeColor: string; items: { icon: string; color: string; title: string; desc: string }[] }> = {
  市场洞察: { badge: "市场分析", badgeColor: "#fb923c", items: [
    { icon: "ri-bar-chart-2-line", color: "#0ea5e9", title: "市场规模", desc: "无线耳机全球市场预计 2025 年突破 $420 亿，年增速 12.4%，Shopify 品牌集中在 $30–$80 价格区间" },
    { icon: "ri-fire-line", color: "#fb923c", title: "热门需求", desc: "主动降噪、超长续航、游戏低延迟是当前评论中出现频率 TOP 3 的需求关键词" },
    { icon: "ri-group-line", color: "#7B61FF", title: "竞争格局", desc: "头部品牌占据 60% 流量，但长尾词竞争度低，是新兴品牌的突破口" },
    { icon: "ri-map-pin-2-line", color: "#f472b6", title: "地域机会", desc: "东南亚与中东市场渗透率低，增速快，适合作为出海第二市场布局" },
  ]},
  内容方向: { badge: "内容生成", badgeColor: "#7B61FF", items: [
    { icon: "ri-video-line", color: "#f472b6", title: "短视频选题", desc: "「开箱测评 vs 竞品」「一周使用真实感受」「意外发现的隐藏功能」三类内容互动率高于平均 3x" },
    { icon: "ri-article-line", color: "#0ea5e9", title: "图文内容框架", desc: "「痛点场景 → 产品解决方案 → 真实用户证明」三段式结构转化效果最佳" },
    { icon: "ri-calendar-2-line", color: "#fb923c", title: "内容节奏", desc: "建议每周发布：2 条测评类 + 1 条对比类 + 1 条使用场景类" },
    { icon: "ri-hashtag", color: "#7B61FF", title: "话题标签策略", desc: "结合大词 + 中腰词 + 品类专属词，预计可提升曝光量 40–60%" },
  ]},
  商品优化: { badge: "商品优化", badgeColor: "#0ea5e9", items: [
    { icon: "ri-search-line", color: "#fb923c", title: "关键词优化", desc: "将「wireless earbuds」替换为「wireless earbuds noise cancelling long battery」，搜索覆盖度提升 2.3x" },
    { icon: "ri-image-line", color: "#0ea5e9", title: "主图优化", desc: "增加使用场景图（运动/通勤/睡眠），点击率预计提升 18–25%" },
    { icon: "ri-star-line", color: "#7B61FF", title: "评价引导", desc: "发货后第 7 天触发评价邀请，结合跟进邮件，评分可从 4.1 提升至 4.5+" },
    { icon: "ri-price-tag-3-line", color: "#f472b6", title: "定价建议", desc: "当前价格偏高 12%，建议设置 $59.99 锚点 + 首单优惠券，可提升加购率" },
  ]},
  行动建议: { badge: "执行计划", badgeColor: "#8b5cf6", items: [
    { icon: "ri-calendar-check-line", color: "#059669", title: "第一周", desc: "完成 Listing 关键词重写 + 主图更换 + 价格调整，设置 A/B 测试跟踪效果" },
    { icon: "ri-rocket-line", color: "#fb923c", title: "第二周", desc: "发布首批 2 条短视频 + 1 篇图文，投放 $200 小预算测试内容方向" },
    { icon: "ri-line-chart-line", color: "#7B61FF", title: "第三–四周", desc: "基于数据反馈加大内容投入，复制效果好的内容格式，建立内容素材库" },
    { icon: "ri-flag-2-line", color: "#f472b6", title: "一月目标", desc: "关键词自然排名进入 TOP 20，月销量增长目标 +35%，评价数量翻倍" },
  ]},
};

export default function WorkspaceMockResult() {
  const [activeTab, setActiveTab] = useState("市场洞察");
  const current = RESULT_DATA[activeTab];
  return (
    <section className="w-full px-6 lg:px-12 pb-12">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, #EAEAEA, transparent)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>分析结果预览</p>
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #EAEAEA)" }} />
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.5)" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,0.5)" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,0.5)" }} />
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-sparkling-line text-[12px]" style={{ color: "#7B61FF" }} />
                <span className="text-[12px] font-medium" style={{ color: "#444444" }}>Shopify 无线耳机增长策略 — 分析报告</span>
              </div>
            </div>
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${current.badgeColor}10`, color: current.badgeColor, border: `1px solid ${current.badgeColor}28` }}>
              {current.badge}
            </span>
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-0" style={{ borderBottom: "1px solid #F0F0F0" }}>
            {RESULT_TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-3 pb-2.5 text-[12px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap relative"
                style={{ color: activeTab === tab ? "#111111" : "#888888" }}>
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF)" }} />
                )}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.items.map((item) => (
              <div key={item.title} className="p-3.5 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0" style={{ background: `${item.color}12` }}>
                    <i className={`${item.icon} text-[11px]`} style={{ color: item.color }} />
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>{item.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "#888888" }}>{item.desc}</p>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: "1px solid #F0F0F0" }}>
            <span className="text-[11px]" style={{ color: "#AAAAAA" }}>示例报告 · 完整报告包含 20+ 项分析维度</span>
            <button className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", color: "#7B61FF" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.08)"; }}>
              <i className="ri-play-circle-line text-[11px]" />立即启动分析
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
