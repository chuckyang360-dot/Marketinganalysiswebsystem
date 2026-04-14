interface ExampleCard {
  icon: string; iconColor: string; iconBg: string; title: string;
  description: string; outputs: string[]; tagColor: string;
}
const EXAMPLES: ExampleCard[] = [
  { icon: "ri-store-2-line", iconColor: "#0ea5e9", iconBg: "rgba(14,165,233,0.08)", title: "亚马逊卖家增长策略", description: "分析竞品差距，挖掘高转化关键词，优化 Listing 结构提升排名", outputs: ["关键词机会图谱", "Listing 优化清单"], tagColor: "#0ea5e9" },
  { icon: "ri-code-box-line", iconColor: "#7B61FF", iconBg: "rgba(123,97,255,0.08)", title: "SaaS 产品增长策略", description: "识别用户核心痛点，规划内容营销路径，设计冷启动获客方案", outputs: ["内容方向矩阵", "用户痛点洞察"], tagColor: "#7B61FF" },
  { icon: "ri-vidicon-line", iconColor: "#f472b6", iconBg: "rgba(244,114,182,0.08)", title: "TikTok 出海内容增长", description: "挖掘平台热门选题趋势，生成系列内容框架，提升账号影响力", outputs: ["内容选题日历", "爆款脚本框架"], tagColor: "#f472b6" },
  { icon: "ri-shopping-cart-2-line", iconColor: "#fb923c", iconBg: "rgba(251,146,60,0.08)", title: "跨境电商选品策略", description: "评估品类竞争格局，分析需求趋势，输出高潜力选品优先级建议", outputs: ["选品评分矩阵", "市场空间报告"], tagColor: "#fb923c" },
];
interface WorkspaceExamplesProps { onSelect: (title: string) => void; }
export default function WorkspaceExamples({ onSelect }: WorkspaceExamplesProps) {
  return (
    <section className="w-full px-6 lg:px-12 pb-10">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, #EAEAEA, transparent)" }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>热门分析场景</p>
          <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #EAEAEA)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLES.map((card) => (
            <button key={card.title} onClick={() => onSelect(card.title)}
              className="text-left p-4 rounded-xl cursor-pointer transition-all duration-200"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${card.tagColor}35`; (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0" style={{ background: card.iconBg }}>
                  <i className={`${card.icon} text-[14px]`} style={{ color: card.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold leading-tight mb-1" style={{ color: "#111111" }}>{card.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#888888" }}>{card.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
                <span className="text-[10px]" style={{ color: "#AAAAAA" }}>输出：</span>
                {card.outputs.map((out) => (
                  <span key={out} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: `${card.tagColor}10`, color: card.tagColor, border: `1px solid ${card.tagColor}25` }}>
                    {out}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
