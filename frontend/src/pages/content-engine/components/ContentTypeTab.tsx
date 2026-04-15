import type { ContentType } from "../../../mocks/contentEngine";

interface ContentTypeTabProps {
  activeType: ContentType;
  onChange: (type: ContentType) => void;
}

const TABS: Array<{
  key: ContentType;
  label: string;
  icon: string;
  desc: string;
  platforms: string[];
  color: string;
  accentBg: string;
}> = [
  {
    key: "video",
    label: "视频内容",
    icon: "ri-video-line",
    desc: "短视频脚本 · 分镜 · 切片",
    platforms: ["TikTok", "YouTube", "小红书"],
    color: "#7B61FF",
    accentBg: "rgba(123,97,255,0.08)",
  },
  {
    key: "image",
    label: "图文内容",
    icon: "ri-image-2-line",
    desc: "图文方案 · 封面标题 · 分页文案",
    platforms: ["小红书", "Instagram", "X"],
    color: "#FF2442",
    accentBg: "rgba(255,36,66,0.07)",
  },
  {
    key: "article",
    label: "文章内容",
    icon: "ri-article-line",
    desc: "SEO长文 · 大纲 · 深度测评",
    platforms: ["知乎", "微信公众号", "Medium"],
    color: "#3b82f6",
    accentBg: "rgba(59,130,246,0.07)",
  },
];

export default function ContentTypeTab({ activeType, onChange }: ContentTypeTabProps) {
  return (
    <section className="w-full px-6 py-6 lg:px-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[#888888]">分析内容类型</span>
          <div className="h-px flex-1 bg-[#EAEAEA]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TABS.map((tab) => {
            const active = activeType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className="relative flex flex-col gap-3 rounded-2xl p-4 text-left"
                style={{
                  background: active ? tab.accentBg : "#ffffff",
                  border: `1.5px solid ${active ? tab.color + "40" : "#EAEAEA"}`,
                }}
              >
                {active ? <span className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ background: tab.color }} /> : null}
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background: active ? `${tab.color}18` : "#F7F8FA",
                      border: `1px solid ${active ? tab.color + "25" : "transparent"}`,
                    }}
                  >
                    <i className={`${tab.icon} text-[15px]`} style={{ color: active ? tab.color : "#AAAAAA" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold leading-tight" style={{ color: active ? "#111111" : "#444444" }}>{tab.label}</p>
                    <p className="mt-0.5 text-[11px] text-[#AAAAAA]">{tab.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {tab.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: active ? `${tab.color}10` : "#F7F8FA",
                        color: active ? tab.color : "#AAAAAA",
                        border: `1px solid ${active ? tab.color + "20" : "transparent"}`,
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                {active ? (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${tab.color}, ${tab.color}50)` }} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
