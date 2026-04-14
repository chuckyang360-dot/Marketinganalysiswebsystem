interface AnalysisRecord {
  id: string; title: string; status: "done" | "running" | "draft"; time: string; progress?: number;
  tags: { label: string; color: string }[]; summary: string;
}
const RECENT: AnalysisRecord[] = [
  { id: "r1", title: "Shopify 无线耳机增长策略", status: "running", time: "分析中", progress: 65, tags: [{ label: "市场分析", color: "#fb923c" }, { label: "商品优化", color: "#0ea5e9" }], summary: "正在生成关键词机会图谱 + Listing 优化建议…" },
  { id: "r2", title: "TikTok 美妆出海内容选题", status: "done", time: "2小时前", tags: [{ label: "内容生成", color: "#7B61FF" }], summary: "已输出：内容选题日历 × 30 + 爆款脚本框架 × 5 + 话题标签矩阵" },
  { id: "r3", title: "SaaS 产品冷启动增长路径", status: "done", time: "昨天", tags: [{ label: "市场分析", color: "#fb923c" }, { label: "内容生成", color: "#7B61FF" }], summary: "已输出：用户痛点洞察报告 + SEO 内容方向矩阵 + 冷启动 30 天计划" },
  { id: "r4", title: "跨境电商选品竞争分析", status: "draft", time: "草稿", tags: [{ label: "市场分析", color: "#fb923c" }], summary: "输入已保存，尚未开始分析" },
];
const STATUS_CONFIG = {
  done: { label: "已完成", color: "#059669", bg: "rgba(5,150,105,0.07)", icon: "ri-checkbox-circle-line" },
  running: { label: "进行中", color: "#f59e0b", bg: "rgba(245,158,11,0.07)", icon: "ri-loader-4-line" },
  draft: { label: "草稿", color: "#888888", bg: "#F7F8FA", icon: "ri-draft-line" },
};
export default function WorkspaceRecentAnalysis() {
  return (
    <section className="w-full px-6 lg:px-12 pb-16">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ background: "#EAEAEA" }} />
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>最近分析</p>
          </div>
          <button className="text-[11px] cursor-pointer transition-colors duration-150 whitespace-nowrap" style={{ color: "#7B61FF" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
            查看全部 <i className="ri-arrow-right-s-line" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {RECENT.map((record) => {
            const statusCfg = STATUS_CONFIG[record.status];
            return (
              <div key={record.id} className="p-4 rounded-xl cursor-pointer transition-all duration-200"
                style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-semibold truncate" style={{ color: "#111111" }}>{record.title}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}>
                        <i className={`${statusCfg.icon} text-[9px] ${record.status === "running" ? "animate-spin" : ""}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#888888" }}>{record.summary}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {record.tags.map((tag) => (
                        <span key={tag.label} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${tag.color}10`, color: tag.color, border: `1px solid ${tag.color}25` }}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] whitespace-nowrap" style={{ color: "#AAAAAA" }}>{record.time}</span>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150"
                      style={{ background: "#F7F8FA", border: "1px solid #EAEAEA", color: "#888888" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#7B61FF"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.2)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLElement).style.color = "#888888"; (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
                      <i className="ri-arrow-right-line text-[12px]" />
                    </button>
                  </div>
                </div>
                {record.status === "running" && record.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: "#AAAAAA" }}>分析进度</span>
                      <span className="text-[10px] font-medium" style={{ color: "#f59e0b" }}>{record.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#EAEAEA" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${record.progress}%`, background: "linear-gradient(90deg, #7B61FF, #f59e0b)" }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
