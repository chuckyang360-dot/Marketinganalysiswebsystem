import { ReactNode } from "react";

interface FeatureSplitProps {
  index: number; tag: string; tagColor: string; tagBg: string;
  title: string; desc: string; mockContent: ReactNode; accentColor: string;
}

function MockWindow({ label, labelColor, accentColor, children }: { label: string; labelColor: string; accentColor: string; children: ReactNode }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
      <div className="relative flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.5)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,0.5)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,0.5)" }} />
        </div>
        <span className="text-[11px] ml-2 font-medium" style={{ color: labelColor }}>{label}</span>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: labelColor, background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}>
          ● Live
        </span>
      </div>
      <div className="relative p-5 lg:p-6">{children}</div>
    </div>
  );
}

function FeatureSplit({ index, tag, tagColor, tagBg, title, desc, mockContent, accentColor }: FeatureSplitProps) {
  const isEven = index % 2 === 0;
  return (
    <div className="relative w-full overflow-hidden" style={{ borderBottom: "1px solid #EAEAEA", background: isEven ? "#ffffff" : "#F7F8FA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "1100px" }}>
        <div className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-start gap-16 lg:gap-20`}>
          <div className="w-full lg:w-[40%] shrink-0">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
              style={{ color: tagColor, background: tagBg, border: `1px solid ${tagColor}28` }}>
              {tag}
            </span>
            <h2 className="font-bold leading-[1.2] tracking-[-0.02em] mb-5 whitespace-pre-line"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(22px, 2.4vw, 32px)", color: "#111111" }}>
              {title}
            </h2>
            <p style={{ fontSize: "15px", color: "#888888", lineHeight: 1.85, maxWidth: "380px" }}>
              {desc.split("而不是").map((part, i) =>
                i === 0 ? <span key={i}>{part}</span> : <span key={i}><span style={{ color: "#CCCCCC" }}>而不是{part}</span></span>
              )}
            </p>
          </div>
          <div className="w-full lg:flex-1">
            <MockWindow label={tag} labelColor={tagColor} accentColor={accentColor}>{mockContent}</MockWindow>
          </div>
        </div>
      </div>
    </div>
  );
}

const MarketingMock = (
  <div className="space-y-2.5">
    <div className="text-[10.5px] font-bold uppercase tracking-widest mb-4" style={{ color: "#fb923c" }}>信号整合 · 需求判断输出</div>
    {[
      { label: "用户对退款流程的不满持续上升", source: "社交平台", strength: 92 },
      { label: "\"无线充电\"需求在 Q4 搜索量增长 38%", source: "搜索趋势", strength: 85 },
      { label: "竞品在高端市场存在明显供给空白", source: "竞品分析", strength: 78 },
      { label: "移动端购物车放弃率高于桌面端 41%", source: "电商数据", strength: 71 },
    ].map((row, i) => (
      <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.15)" }}>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] leading-snug mb-2" style={{ color: "#444444" }}>{row.label}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#888888" }}>{row.source}</span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[13px] font-bold" style={{ color: "#fb923c" }}>{row.strength}%</span>
          <div className="w-16 h-1.5 rounded-full" style={{ background: "#EAEAEA" }}>
            <div className="h-full rounded-full" style={{ width: `${row.strength}%`, background: "#fb923c" }} />
          </div>
        </div>
      </div>
    ))}
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mt-1" style={{ background: "#F7F8FA" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-[11.5px]" style={{ color: "#888888" }}>已识别 4 个可判断信号，2 个竞争空白</span>
    </div>
  </div>
);

const ContentMock = (
  <div className="space-y-3">
    <div className="text-[10.5px] font-bold uppercase tracking-widest mb-4" style={{ color: "#7B61FF" }}>内容方向 · 基于洞察生成</div>
    {[
      { type: "痛点驱动", title: "用户在等什么？这 3 个真实痛点是你内容的入口", tags: ["高转化", "UGC 友好"] },
      { type: "趋势借势", title: "Q4 最值得押注的内容形式：短视频 vs 图文对比", tags: ["时效性强", "适合矩阵"] },
      { type: "竞品切入", title: "他们在说什么你没说？从竞品评论中找到内容空白", tags: ["差异化", "可复用"] },
    ].map((item, i) => (
      <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(123,97,255,0.05)", border: "1px solid rgba(123,97,255,0.15)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7B61FF", opacity: 0.7 }}>{item.type}</span>
        </div>
        <p className="text-[12.5px] leading-snug mb-3" style={{ color: "#444444" }}>{item.title}</p>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.18)" }}>{tag}</span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ProductMock = (
  <div className="space-y-3">
    <div className="text-[10.5px] font-bold uppercase tracking-widest mb-4" style={{ color: "#0ea5e9" }}>商品分析 · 可执行优化建议</div>
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #EAEAEA" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)", background: "rgba(239,68,68,0.04)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ef4444", opacity: 0.7 }}>当前标题</p>
        <p className="text-[12.5px] line-through" style={{ color: "#AAAAAA" }}>Wireless Earbuds Bluetooth 5.0 Headphones TWS</p>
      </div>
      <div className="px-4 py-3" style={{ background: "rgba(5,150,105,0.04)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#059669" }}>优化建议</p>
        <p className="text-[12.5px] font-medium" style={{ color: "#111111" }}>无线耳机 2024升级版 — 48H续航 主动降噪 USB-C快充</p>
        <span className="mt-1.5 inline-block text-[11px] font-bold" style={{ color: "#059669" }}>CTR 8.7% ↑ +278%</span>
      </div>
    </div>
    {[
      { label: "主图背景影响首屏点击", status: "建议更换", ok: false },
      { label: "卖点顺序不符合决策路径", status: "已重新排序", ok: true },
      { label: "差评关键词未在描述中回应", status: "发现 3 项", ok: false },
    ].map((row) => (
      <div key={row.label} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
        <span className="text-[12px]" style={{ color: "#444444" }}>{row.label}</span>
        <span className="text-[11px] font-semibold" style={{ color: row.ok ? "#059669" : "#f59e0b" }}>{row.status}</span>
      </div>
    ))}
  </div>
);

const WorkflowMock = (
  <div className="space-y-2.5">
    <div className="text-[10.5px] font-bold uppercase tracking-widest mb-4" style={{ color: "#8b5cf6" }}>历史记录 · 持续迭代</div>
    {[
      { icon: "ri-bar-chart-2-line", title: "Q4 无线耳机市场分析", meta: "2小时前 · 营销分析", badge: "已完成", badgeColor: "#059669" },
      { icon: "ri-quill-pen-line", title: "TikTok 出海选题库 · 32条方向", meta: "昨天 · 内容制作", badge: "进行中", badgeColor: "#f59e0b" },
      { icon: "ri-shopping-bag-3-line", title: "蓝牙音箱系列商品优化", meta: "3天前 · 商品分析", badge: "已完成", badgeColor: "#059669" },
      { icon: "ri-lightbulb-flash-line", title: "竞品空白机会报告 v2", meta: "上周 · 营销分析", badge: "待处理", badgeColor: "#888888" },
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150"
        style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.05)"; }}>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0" style={{ background: "rgba(139,92,246,0.1)" }}>
          <i className={`${item.icon} text-[13px]`} style={{ color: "#8b5cf6" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-medium truncate" style={{ color: "#444444" }}>{item.title}</p>
          <p className="text-[11px]" style={{ color: "#888888" }}>{item.meta}</p>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
          style={{ background: `${item.badgeColor}12`, color: item.badgeColor, border: `1px solid ${item.badgeColor}30` }}>
          {item.badge}
        </span>
      </div>
    ))}
  </div>
);

const FEATURES = [
  { tag: "营销分析", tagColor: "#fb923c", tagBg: "rgba(251,146,60,0.08)", accentColor: "#fb923c", title: "你看到的是热闹，\n还是机会？", desc: "大多数团队能看到讨论，却无法判断哪些信号值得投入。GlobalPulseAI 整合多平台数据，直接输出需求、趋势与竞争空白，帮你做出判断，而不是收集信息。", mock: MarketingMock },
  { tag: "内容制作", tagColor: "#7B61FF", tagBg: "rgba(123,97,255,0.08)", accentColor: "#7B61FF", title: "不是缺内容，\n而是不知道该做什么内容", desc: "从真实需求出发，生成可执行的选题与表达，让内容生产不再依赖灵感，而是有依据地推进。", mock: ContentMock },
  { tag: "商品分析", tagColor: "#0ea5e9", tagBg: "rgba(14,165,233,0.08)", accentColor: "#0ea5e9", title: "商品问题，往往不在\n你以为的地方", desc: "从标题、主图到评论结构，拆解影响转化的关键因素，给出可以直接执行的优化建议，而不是模糊方向。", mock: ProductMock },
  { tag: "工作流沉淀", tagColor: "#8b5cf6", tagBg: "rgba(139,92,246,0.08)", accentColor: "#8b5cf6", title: "增长不是一次分析，\n而是持续迭代", desc: "历史分析、内容方向与优化动作全部沉淀在同一个工作台里，支持团队持续优化，而不是每次重新开始。", mock: WorkflowMock },
];

export default function FeatureSplitSection() {
  return (
    <div>
      {FEATURES.map((f, i) => (
        <FeatureSplit key={f.tag} index={i} tag={f.tag} tagColor={f.tagColor} tagBg={f.tagBg} title={f.title} desc={f.desc} mockContent={f.mock} accentColor={f.accentColor} />
      ))}
    </div>
  );
}
