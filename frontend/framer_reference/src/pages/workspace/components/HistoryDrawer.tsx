import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Types ─────────────────────────────────────────────── */
type RecordType = "ecom" | "marketing" | "content";
type PlatformKey = "amazon" | "shopee" | "lazada" | "tiktok" | "shopify" | "general" | "xiaohongshu" | "youtube" | "x";

interface HistoryRecord {
  id: string;
  type: RecordType;
  platform: PlatformKey;
  title: string;
  subtitle: string;
  time: string;
  route: string;
}

/* ─── Mock data ──────────────────────────────────────────── */
const HISTORY_RECORDS: HistoryRecord[] = [
  {
    id: "ec-001",
    type: "ecom",
    platform: "amazon",
    title: "TOZO T6 True Wireless Earbuds",
    subtitle: "Amazon · 评分 83 / 问题 3",
    time: "2分钟前",
    route: "/workspace/ecom-result/ec-001",
  },
  {
    id: "ec-002",
    type: "ecom",
    platform: "shopee",
    title: "韩系百褶长裙 A-line 夏季新款",
    subtitle: "Shopee · 评分 71 / 问题 5",
    time: "1小时前",
    route: "/workspace/ecom-result/ec-002",
  },
  {
    id: "ec-003",
    type: "ecom",
    platform: "tiktok",
    title: "Portable Mini Fan USB Rechargeable",
    subtitle: "TikTok Shop · 评分 66 / 问题 4",
    time: "昨天 14:30",
    route: "/workspace/ecom-result/ec-003",
  },
  {
    id: "ec-004",
    type: "ecom",
    platform: "lazada",
    title: "Ceramic Non-Stick Cookware Set 5pcs",
    subtitle: "Lazada · 评分 78 / 问题 2",
    time: "3天前",
    route: "/workspace/ecom-result/ec-004",
  },
  {
    id: "mk-001",
    type: "marketing",
    platform: "general",
    title: "TikTok 美妆出海内容选题方案",
    subtitle: "增长评分 68 · 渠道 TikTok · SEO",
    time: "2小时前",
    route: "/workspace/marketing-result",
  },
  {
    id: "mk-002",
    type: "marketing",
    platform: "shopify",
    title: "无线降噪耳机增长决策报告",
    subtitle: "增长评分 72 · 渠道 TikTok · Reddit",
    time: "昨天",
    route: "/workspace/marketing-result",
  },
  {
    id: "mk-003",
    type: "marketing",
    platform: "general",
    title: "SaaS 产品冷启动增长路径",
    subtitle: "增长评分 61 · 渠道 SEO · Reddit",
    time: "3天前",
    route: "/workspace/marketing-result",
  },
  {
    id: "mk-004",
    type: "marketing",
    platform: "general",
    title: "跨境电商选品竞争分析报告",
    subtitle: "增长评分 55 · 渠道 YouTube · Google",
    time: "上周",
    route: "/workspace/marketing-result",
  },
  {
    id: "ce-001",
    type: "content",
    platform: "tiktok",
    title: "降噪耳机对比测评爆款复制",
    subtitle: "TikTok · 点赞 24.7K · 内容已生成",
    time: "1小时前",
    route: "/workspace/content-engine",
  },
  {
    id: "ce-002",
    type: "content",
    platform: "xiaohongshu",
    title: "小红书美妆种草内容拆解",
    subtitle: "小红书 · 点赞 18.2K · 内容已生成",
    time: "昨天",
    route: "/workspace/content-engine",
  },
  {
    id: "ce-003",
    type: "content",
    platform: "youtube",
    title: "YouTube 测评视频爆款结构拆解",
    subtitle: "YouTube · 点赞 52.3K · 脚本已生成",
    time: "3天前",
    route: "/workspace/content-engine",
  },
];

/* ─── Platform config ────────────────────────────────────── */
const PLATFORM_CFG: Record<string, { icon: string; color: string; label: string }> = {
  amazon: { icon: "ri-amazon-line", color: "#FF9900", label: "Amazon" },
  shopee: { icon: "ri-shopping-bag-line", color: "#EE4D2D", label: "Shopee" },
  lazada: { icon: "ri-store-2-line", color: "#0F146D", label: "Lazada" },
  tiktok: { icon: "ri-tiktok-line", color: "#010101", label: "TikTok" },
  shopify: { icon: "ri-shopping-cart-2-line", color: "#96BF48", label: "Shopify" },
  general: { icon: "ri-bar-chart-box-line", color: "#7B61FF", label: "通用" },
  xiaohongshu: { icon: "ri-heart-line", color: "#FF2442", label: "小红书" },
  youtube: { icon: "ri-youtube-line", color: "#FF0000", label: "YouTube" },
  x: { icon: "ri-twitter-x-line", color: "#111111", label: "X" },
};

type TabKey = "all" | "ecom" | "marketing" | "content";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState<HistoryRecord[]>(HISTORY_RECORDS);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleOpen = (record: HistoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(record.route);
    onClose();
  };

  const ecomRecords = records.filter((r) => r.type === "ecom");
  const marketingRecords = records.filter((r) => r.type === "marketing");
  const contentRecords = records.filter((r) => r.type === "content");

  const tabs: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: "all", label: "全部", count: records.length, color: "#7B61FF" },
    { key: "ecom", label: "商品", count: ecomRecords.length, color: "#7B61FF" },
    { key: "marketing", label: "营销", count: marketingRecords.length, color: "#fb923c" },
    { key: "content", label: "内容", count: contentRecords.length, color: "#10b981" },
  ];

  const visibleEcom = activeTab === "marketing" || activeTab === "content" ? [] : ecomRecords;
  const visibleMarketing = activeTab === "ecom" || activeTab === "content" ? [] : marketingRecords;
  const visibleContent = activeTab === "ecom" || activeTab === "marketing" ? [] : contentRecords;
  const isEmpty = visibleEcom.length === 0 && visibleMarketing.length === 0 && visibleContent.length === 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.18)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: "340px",
          background: "#ffffff",
          borderLeft: "1px solid #EAEAEA",
          transform: open ? "translateX(0)" : "translateX(100%)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #EAEAEA" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.15)" }}
            >
              <i className="ri-history-line text-[13px]" style={{ color: "#7B61FF" }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold leading-tight" style={{ color: "#111111" }}>分析历史</p>
              <p className="text-[11px]" style={{ color: "#AAAAAA" }}>{records.length} 条记录</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-150"
            style={{ color: "#888888", border: "1px solid #EAEAEA" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#111111";
              (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#888888";
              (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA";
            }}
          >
            <i className="ri-close-line text-[14px]" />
          </button>
        </div>

        {/* Tabs — 4 tabs */}
        <div className="px-4 pt-3 pb-0 shrink-0">
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{
                    background: active ? "#ffffff" : "transparent",
                    color: active ? "#111111" : "#888888",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {tab.label}
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded-full"
                    style={{
                      background: active ? `${tab.color}15` : "#EAEAEA",
                      color: active ? tab.color : "#AAAAAA",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">

          {/* Ecom group */}
          {visibleEcom.length > 0 && (
            <GroupSection
              icon="ri-shopping-cart-2-line"
              iconColor="#7B61FF"
              badgeBg="rgba(123,97,255,0.08)"
              badgeColor="#7B61FF"
              label="商品分析"
              count={visibleEcom.length}
            >
              {visibleEcom.map((r) => (
                <RecordItem key={r.id} record={r} onOpen={handleOpen} onDelete={handleDelete} />
              ))}
            </GroupSection>
          )}

          {/* Marketing group */}
          {visibleMarketing.length > 0 && (
            <GroupSection
              icon="ri-bar-chart-2-line"
              iconColor="#fb923c"
              badgeBg="rgba(251,146,60,0.1)"
              badgeColor="#fb923c"
              label="营销报告"
              count={visibleMarketing.length}
            >
              {visibleMarketing.map((r) => (
                <RecordItem key={r.id} record={r} onOpen={handleOpen} onDelete={handleDelete} />
              ))}
            </GroupSection>
          )}

          {/* Content Engine group */}
          {visibleContent.length > 0 && (
            <GroupSection
              icon="ri-magic-line"
              iconColor="#10b981"
              badgeBg="rgba(16,185,129,0.08)"
              badgeColor="#10b981"
              label="内容引擎"
              count={visibleContent.length}
            >
              {visibleContent.map((r) => (
                <RecordItem key={r.id} record={r} onOpen={handleOpen} onDelete={handleDelete} />
              ))}
            </GroupSection>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center rounded-2xl"
                style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}
              >
                <i className="ri-inbox-line text-[20px]" style={{ color: "#CCCCCC" }} />
              </div>
              <p className="text-[13px]" style={{ color: "#AAAAAA" }}>暂无分析记录</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: "1px solid #EAEAEA" }}
        >
          <p className="text-[11px]" style={{ color: "#CCCCCC" }}>仅保留最近 30 条</p>
          <button
            className="text-[11px] cursor-pointer transition-colors duration-150"
            style={{ color: "#AAAAAA" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AAAAAA"; }}
            onClick={() => setRecords([])}
          >
            清空全部
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── GroupSection ───────────────────────────────────────── */
interface GroupSectionProps {
  icon: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  label: string;
  count: number;
  children: React.ReactNode;
}

function GroupSection({ icon, iconColor, badgeBg, badgeColor, label, count, children }: GroupSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 px-2 mb-2">
        <div className="w-4 h-4 flex items-center justify-center">
          <i className={`${icon} text-[11px]`} style={{ color: iconColor }} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#AAAAAA" }}>
          {label}
        </span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: badgeBg, color: badgeColor }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/* ─── RecordItem ─────────────────────────────────────────── */
interface RecordItemProps {
  record: HistoryRecord;
  onOpen: (record: HistoryRecord, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function RecordItem({ record, onOpen, onDelete }: RecordItemProps) {
  const [hovered, setHovered] = useState(false);
  const platform = PLATFORM_CFG[record.platform] ?? PLATFORM_CFG.general;

  return (
    <div
      className="relative flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: hovered ? "#F7F8FA" : "transparent",
        border: `1px solid ${hovered ? "#EAEAEA" : "transparent"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => onOpen(record, e)}
    >
      {/* Platform icon */}
      <div
        className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
        style={{ background: `${platform.color}12`, border: `1px solid ${platform.color}22` }}
      >
        <i className={`${platform.icon} text-[14px]`} style={{ color: platform.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[13px] font-medium leading-snug truncate" style={{ color: "#111111", maxWidth: "200px" }}>
          {record.title}
        </p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "#888888" }}>{record.subtitle}</p>
        <p className="text-[10px] mt-1" style={{ color: "#CCCCCC" }}>{record.time}</p>
      </div>

      {/* Hover actions */}
      {hovered && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}
            onClick={(e) => onOpen(record, e)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(123,97,255,0.08)"; }}
          >
            <i className="ri-external-link-line text-[10px]" />
            打开
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150"
            style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.12)" }}
            onClick={(e) => onDelete(record.id, e)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
          >
            <i className="ri-delete-bin-6-line text-[10px]" />
          </button>
        </div>
      )}
    </div>
  );
}
