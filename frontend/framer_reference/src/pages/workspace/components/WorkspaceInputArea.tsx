import { useState, useEffect } from "react";

const TAGS = [
  { label: "市场分析", icon: "ri-radar-line", color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
  { label: "内容生成", icon: "ri-quill-pen-line", color: "#7B61FF", bg: "rgba(123,97,255,0.08)", border: "rgba(123,97,255,0.2)" },
  { label: "商品优化", icon: "ri-shopping-bag-3-line", color: "#0ea5e9", bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
];

const PLACEHOLDER_EXAMPLES = [
  "Shopify 无线耳机怎么做增长？",
  "TikTok 出海内容选题策略",
  "亚马逊 listing 优化建议",
  "SaaS 产品冷启动增长路径",
];

interface WorkspaceInputAreaProps {
  onAnalyze: (text: string) => void;
  inputValue?: string;
}

export default function WorkspaceInputArea({ onAnalyze, inputValue = "" }: WorkspaceInputAreaProps) {
  const [input, setInput] = useState(inputValue);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => { if (inputValue) setInput(inputValue); }, [inputValue]);

  const handleSubmit = () => { if (input.trim()) onAnalyze(input.trim()); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); };

  return (
    <section className="w-full px-6 lg:px-12 pt-16 pb-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.18)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-medium tracking-wide" style={{ color: "#7B61FF" }}>增长操作台 · GlobalPulseAI</span>
        </div>
        <h1 className="font-extrabold leading-[1.1] tracking-[-0.03em] mb-4"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 3.2vw, 42px)", color: "#111111" }}>
          你的增长，
          <span style={{ background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            从这里开始
          </span>
        </h1>
        <p className="mx-auto leading-[1.9] mb-6" style={{ fontSize: "clamp(14px, 1.1vw, 15px)", color: "#888888", maxWidth: "500px" }}>
          输入市场、产品或内容问题，系统将输出完整增长路径
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
          {["一次输入", "完整分析", "可执行结果"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: "#ffffff", border: "1px solid #EAEAEA", color: "#444444" }}>{step}</span>
              {i < 2 && <i className="ri-arrow-right-line text-[11px]" style={{ color: "#CCCCCC" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[720px] mx-auto">
        <div className="rounded-2xl transition-all duration-200"
          style={{ background: "#ffffff", border: focused ? "1.5px solid #7B61FF" : "1.5px solid #EAEAEA" }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={handleKeyDown}
            placeholder={"输入你的市场、产品或内容问题\n例如：\n· Shopify 无线耳机怎么做增长？\n· TikTok 出海内容选题\n· 亚马逊 listing 优化建议"}
            rows={6} className="w-full bg-transparent outline-none resize-none px-5 pt-5 pb-3"
            style={{ color: "#111111", fontSize: "14px", lineHeight: "1.8", fontFamily: "'Inter', sans-serif" }} />
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ borderTop: "1px solid #F0F0F0" }}>
            <div className="flex flex-wrap items-center gap-2">
              {TAGS.map((tag) => (
                <button key={tag.label} onClick={() => setActiveTag(activeTag === tag.label ? null : tag.label)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{
                    background: activeTag === tag.label ? tag.bg : "#F7F8FA",
                    border: activeTag === tag.label ? `1px solid ${tag.border}` : "1px solid #EAEAEA",
                    color: activeTag === tag.label ? tag.color : "#888888",
                  }}>
                  <i className={`${tag.icon} text-[10px]`} />{tag.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "#AAAAAA" }}>{input.length > 0 ? `${input.length} 字` : "⌘+Enter 提交"}</span>
              <button onClick={handleSubmit} disabled={!input.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-all duration-200"
                style={{ background: input.trim() ? "linear-gradient(135deg, #7B61FF 0%, #5B8CFF 100%)" : "#EAEAEA", color: input.trim() ? "#fff" : "#AAAAAA", cursor: input.trim() ? "pointer" : "not-allowed" }}>
                <i className="ri-play-circle-line text-[13px]" />开始分析
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
          <span className="text-[11px]" style={{ color: "#AAAAAA" }}>试试：</span>
          {PLACEHOLDER_EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setInput(ex)}
              className="text-[11px] px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA", color: "#888888" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#7B61FF"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
