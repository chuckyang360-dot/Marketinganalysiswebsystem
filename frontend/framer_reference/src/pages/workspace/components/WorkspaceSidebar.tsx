import { useState } from "react";

interface HistoryItem {
  id: string; title: string; time: string; status: "done" | "running"; tag: string; tagColor: string;
}

const HISTORY: HistoryItem[] = [
  { id: "h1", title: "Shopify 无线耳机增长策略", time: "刚刚", status: "running", tag: "市场分析", tagColor: "#fb923c" },
  { id: "h2", title: "TikTok 美妆出海内容选题", time: "2小时前", status: "done", tag: "内容生成", tagColor: "#7B61FF" },
  { id: "h3", title: "亚马逊卖家 Listing 优化", time: "昨天", status: "done", tag: "商品优化", tagColor: "#0ea5e9" },
  { id: "h4", title: "SaaS 产品冷启动增长路径", time: "昨天", status: "done", tag: "市场分析", tagColor: "#fb923c" },
  { id: "h5", title: "跨境电商选品竞争分析", time: "3天前", status: "done", tag: "市场分析", tagColor: "#fb923c" },
  { id: "h6", title: "小红书品牌内容矩阵搭建", time: "3天前", status: "done", tag: "内容生成", tagColor: "#7B61FF" },
  { id: "h7", title: "独立站用户留存优化策略", time: "上周", status: "done", tag: "商品优化", tagColor: "#0ea5e9" },
];

interface WorkspaceSidebarProps {
  activeId: string; onSelect: (id: string) => void; onNew: () => void;
}

export default function WorkspaceSidebar({ activeId, onSelect, onNew }: WorkspaceSidebarProps) {
  const [starred, setStarred] = useState<string[]>(["h2", "h4"]);
  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  return (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0"
      style={{ width: "240px", background: "#ffffff", borderRight: "1px solid #EAEAEA" }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid #EAEAEA" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
            <i className="ri-global-line text-white text-[13px]" />
          </div>
          <span className="font-bold text-[14px] tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>
            增长操作台
          </span>
        </div>
      </div>
      {/* New button */}
      <div className="px-3 py-3">
        <button onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
          style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.08)"; }}>
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-add-line text-[14px]" style={{ color: "#7B61FF" }} />
          </div>
          <span className="text-[13px] font-medium" style={{ color: "#7B61FF" }}>新建分析</span>
        </button>
      </div>
      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
          <i className="ri-search-line text-[12px]" style={{ color: "#AAAAAA" }} />
          <input type="text" placeholder="搜索分析记录" className="bg-transparent outline-none w-full text-[12px]" style={{ color: "#444444" }} />
        </div>
      </div>
      {/* History */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {HISTORY.filter(h => h.status === "running").length > 0 && (
          <div className="mb-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>进行中</p>
            {HISTORY.filter(h => h.status === "running").map(item => (
              <SidebarItem key={item.id} item={item} active={activeId === item.id} starred={starred.includes(item.id)} onSelect={onSelect} onStar={toggleStar} />
            ))}
          </div>
        )}
        <div>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>历史分析</p>
          {HISTORY.filter(h => h.status === "done").map(item => (
            <SidebarItem key={item.id} item={item} active={activeId === item.id} starred={starred.includes(item.id)} onSelect={onSelect} onStar={toggleStar} />
          ))}
        </div>
        {starred.length > 0 && (
          <div className="mt-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#AAAAAA" }}>已收藏</p>
            {HISTORY.filter(h => starred.includes(h.id)).map(item => (
              <SidebarItem key={item.id + "-star"} item={item} active={false} starred onSelect={onSelect} onStar={toggleStar} />
            ))}
          </div>
        )}
      </div>
      {/* User */}
      <div className="px-3 py-3 flex items-center gap-2.5" style={{ borderTop: "1px solid #EAEAEA" }}>
        <div className="w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>C</div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: "#111111" }}>chuck</p>
          <p className="text-[10px] truncate" style={{ color: "#AAAAAA" }}>Free Plan · 8/10 次</p>
        </div>
        <button className="w-5 h-5 flex items-center justify-center cursor-pointer rounded-md transition-colors duration-150"
          style={{ color: "#AAAAAA" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AAAAAA"; }}>
          <i className="ri-settings-3-line text-[13px]" />
        </button>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  item: HistoryItem; active: boolean; starred: boolean;
  onSelect: (id: string) => void; onStar: (id: string, e: React.MouseEvent) => void;
}

function SidebarItem({ item, active, starred, onSelect, onStar }: SidebarItemProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={() => onSelect(item.id)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 text-left"
      style={{
        background: active ? "#F0EEFF" : hovered ? "#F7F8FA" : "transparent",
        borderLeft: active ? "2px solid #7B61FF" : "2px solid transparent",
      }}>
      <div className="w-4 h-4 flex items-center justify-center mt-0.5 shrink-0">
        {item.status === "running" ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        ) : (
          <i className="ri-checkbox-circle-line text-[12px]" style={{ color: "#CCCCCC" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium leading-tight truncate" style={{ color: active ? "#7B61FF" : "#444444" }}>{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px]" style={{ color: "#AAAAAA" }}>{item.time}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ background: `${item.tagColor}12`, color: item.tagColor, border: `1px solid ${item.tagColor}28` }}>
            {item.tag}
          </span>
        </div>
      </div>
      {(hovered || starred) && (
        <button onClick={(e) => onStar(item.id, e)} className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
          style={{ color: starred ? "#f59e0b" : "#CCCCCC" }}>
          <i className={`${starred ? "ri-star-fill" : "ri-star-line"} text-[11px]`} />
        </button>
      )}
    </button>
  );
}
