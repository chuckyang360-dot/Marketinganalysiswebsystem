import { useState } from "react";

const PLATFORM_TAGS = [
  { icon: "ri-tiktok-line", label: "TikTok", color: "#010101" },
  { icon: "ri-heart-line", label: "小红书", color: "#FF2442" },
  { icon: "ri-youtube-line", label: "YouTube", color: "#FF0000" },
  { icon: "ri-twitter-x-line", label: "X", color: "#111111" },
  { icon: "ri-zhihu-line", label: "知乎", color: "#0084FF" },
];

interface ContentInputProps {
  defaultValue?: string;
}

export default function ContentInput({ defaultValue = "" }: ContentInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  return (
    <section className="w-full px-6 lg:px-10 py-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-3"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}>
            <i className="ri-magic-line text-[11px]" />
            内容复制引擎
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>
            输入爆款，一键复制增长
          </h2>
          <p className="text-[14px]" style={{ color: "#888888" }}>
            粘贴任意平台爆款链接，AI 拆解结构 → 直接生成你的同款内容
          </p>
        </div>

        {/* Input box */}
        <div
          className="relative rounded-2xl transition-all duration-200"
          style={{
            background: "#ffffff",
            border: `1.5px solid ${focused ? "#7B61FF" : "#EAEAEA"}`,
            boxShadow: focused ? "0 0 0 3px rgba(123,97,255,0.08)" : "none",
          }}
        >
          <div className="flex items-center px-4 py-3 gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
              style={{ background: "rgba(123,97,255,0.08)" }}>
              <i className="ri-link-m text-[15px]" style={{ color: "#7B61FF" }} />
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="粘贴内容链接（小红书 / TikTok / YouTube / X）或输入关键词"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#111111", fontSize: "14px" }}
            />
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <i className="ri-flashlight-line text-[13px]" />
              开始分析
            </button>
          </div>
        </div>

        {/* Platform tags */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="text-[11px]" style={{ color: "#CCCCCC" }}>支持：</span>
          {PLATFORM_TAGS.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer"
              style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }}
              onClick={() => setValue(`https://${p.label.toLowerCase()}.com/`)}
            >
              <i className={`${p.icon} text-[11px]`} style={{ color: p.color }} />
              {p.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
