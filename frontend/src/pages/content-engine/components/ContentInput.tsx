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
    <section className="w-full px-6 py-10 lg:px-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        <div className="mb-6 text-center">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}
          >
            <i className="ri-magic-line text-[11px]" />
            内容复制引擎
          </div>
          <h2 className="mb-2 text-2xl font-bold lg:text-3xl" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>
            输入爆款，一键复制增长
          </h2>
          <p className="text-[14px] text-[#888888]">粘贴任意平台爆款链接，AI 拆解结构并生成同款内容</p>
        </div>

        <div
          className="relative rounded-2xl transition-all duration-200"
          style={{
            background: "#ffffff",
            border: `1.5px solid ${focused ? "#7B61FF" : "#EAEAEA"}`,
            boxShadow: focused ? "0 0 0 3px rgba(123,97,255,0.08)" : "none",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(123,97,255,0.08)]">
              <i className="ri-link-m text-[15px] text-[#7B61FF]" />
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
              className="whitespace-nowrap rounded-xl bg-[linear-gradient(135deg,#7B61FF,#5B8CFF)] px-5 py-2 text-sm font-semibold text-white"
            >
              <i className="ri-flashlight-line mr-1.5 text-[13px]" />
              开始分析
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-[#CCCCCC]">支持：</span>
          {PLATFORM_TAGS.map((p) => (
            <div
              key={p.label}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-[#EAEAEA] bg-[#F7F8FA] px-2.5 py-1 text-[11px] font-medium text-[#888888]"
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
