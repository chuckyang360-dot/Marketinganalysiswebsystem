import { useState } from "react";
import type { MarketingResultData } from "@/mocks/marketingResult";

interface Props {
  data: MarketingResultData;
}

function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
      style={{
        background: copied ? "rgba(22,163,74,0.08)" : "rgba(123,97,255,0.07)",
        border: copied ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(123,97,255,0.15)",
        color: copied ? "#16a34a" : "#7B61FF",
      }}>
      <i className={`${copied ? "ri-check-line" : "ri-clipboard-line"} text-[11px]`} />
      {copied ? "已复制" : label}
    </button>
  );
}

export default function MarketingAssets({ data }: Props) {
  const { assets } = data;
  const [selectedTitle, setSelectedTitle] = useState(assets.titleList[0]?.id ?? "");
  const [selectedScript, setSelectedScript] = useState(assets.videoScripts[0]?.id ?? "");
  const [selectedAdCopy, setSelectedAdCopy] = useState(assets.adCopies[0]?.id ?? "");

  const currentScript = assets.videoScripts.find((s) => s.id === selectedScript);
  const currentAdCopy = assets.adCopies.find((a) => a.id === selectedAdCopy);
  const currentTitle = assets.titleList.find((t) => t.id === selectedTitle);

  return (
    <section className="w-full px-6 lg:px-10 py-6 pb-16">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <i className="ri-file-copy-2-line text-[15px]" style={{ color: "#7B61FF" }} />
          <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>可执行内容输出</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
            Assets
          </span>
        </div>
        <p className="text-[13px] mb-5" style={{ color: "#888888" }}>直接给你可用的内容素材，一键复制开始创作</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Video Scripts ── */}
          <div className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: "rgba(239,68,68,0.08)" }}>
                <i className="ri-movie-line text-[14px]" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>视频脚本</span>
                <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.07)", color: "#ef4444" }}>
                  {assets.videoScripts.length} 个脚本
                </span>
              </div>
            </div>

            {/* Script tabs */}
            <div className="flex gap-2">
              {assets.videoScripts.map((s) => (
                <button key={s.id} onClick={() => setSelectedScript(s.id)}
                  className="flex-1 py-2 px-3 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200 text-center"
                  style={{
                    background: selectedScript === s.id ? "rgba(239,68,68,0.07)" : "#F7F8FA",
                    border: selectedScript === s.id ? "1.5px solid rgba(239,68,68,0.25)" : "1px solid #EAEAEA",
                    color: selectedScript === s.id ? "#ef4444" : "#888888",
                  }}>
                  {s.title.split("（")[0]}
                </button>
              ))}
            </div>

            {currentScript && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: "#555555" }}>{currentScript.title}</span>
                  <CopyButton text={currentScript.content} label="复制脚本" />
                </div>
                <div className="rounded-xl p-4 flex-1"
                  style={{ background: "#F7F8FA", border: "1px solid #EAEAEA", minHeight: "140px" }}>
                  <pre className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "#444444", fontFamily: "inherit" }}>
                    {currentScript.content}
                  </pre>
                </div>
              </>
            )}
          </div>

          {/* ── Title List ── */}
          <div className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(14,165,233,0.08)" }}>
                  <i className="ri-text text-[14px]" style={{ color: "#0ea5e9" }} />
                </div>
                <div>
                  <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>标题清单</span>
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(14,165,233,0.07)", color: "#0ea5e9" }}>
                    {assets.titleList.length} 个方案
                  </span>
                </div>
              </div>
              {currentTitle && <CopyButton text={currentTitle.text} label="复制标题" />}
            </div>

            <div className="flex flex-col gap-2">
              {assets.titleList.map((t, idx) => (
                <button key={t.id} onClick={() => setSelectedTitle(t.id)}
                  className="w-full text-left p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-start gap-2.5"
                  style={{
                    background: selectedTitle === t.id ? "rgba(14,165,233,0.05)" : "#F7F8FA",
                    border: selectedTitle === t.id ? "1.5px solid rgba(14,165,233,0.25)" : "1px solid #EAEAEA",
                  }}>
                  <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 text-white mt-0.5"
                    style={{ background: selectedTitle === t.id ? "#0ea5e9" : "#CCCCCC" }}>
                    {idx + 1}
                  </span>
                  <p className="text-[12px] leading-relaxed" style={{ color: selectedTitle === t.id ? "#333333" : "#666666" }}>
                    {t.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── SEO Article Outline ── */}
          <div className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(16,185,129,0.08)" }}>
                  <i className="ri-article-line text-[14px]" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>SEO 文章结构</span>
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.07)", color: "#10b981" }}>
                    可直接创作
                  </span>
                </div>
              </div>
              <CopyButton
                text={`${assets.seoOutline.title}\n\n${assets.seoOutline.sections.join("\n")}`}
                label="复制大纲" />
            </div>

            <div className="rounded-xl p-4" style={{ background: "#F7FFF9", border: "1px solid rgba(16,185,129,0.15)" }}>
              <p className="text-[12px] font-semibold mb-3" style={{ color: "#10b981" }}>
                <i className="ri-file-text-line mr-1.5" />
                {assets.seoOutline.title}
              </p>
              <div className="flex flex-col gap-2">
                {assets.seoOutline.sections.map((sec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 text-white"
                      style={{ background: "#10b981" }}>
                      {idx + 1}
                    </span>
                    <p className="text-[12px] leading-relaxed" style={{ color: "#444444" }}>{sec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Ad Copies ── */}
          <div className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: "rgba(245,158,11,0.08)" }}>
                <i className="ri-megaphone-line text-[14px]" style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>广告文案</span>
                <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.07)", color: "#f59e0b" }}>
                  {assets.adCopies.length} 套文案
                </span>
              </div>
            </div>

            {/* Ad type tabs */}
            <div className="flex gap-2 flex-wrap">
              {assets.adCopies.map((ac) => (
                <button key={ac.id} onClick={() => setSelectedAdCopy(ac.id)}
                  className="py-1.5 px-3 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: selectedAdCopy === ac.id ? "rgba(245,158,11,0.08)" : "#F7F8FA",
                    border: selectedAdCopy === ac.id ? "1.5px solid rgba(245,158,11,0.3)" : "1px solid #EAEAEA",
                    color: selectedAdCopy === ac.id ? "#d97706" : "#888888",
                  }}>
                  {ac.type}
                </button>
              ))}
            </div>

            {currentAdCopy && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: "#555555" }}>{currentAdCopy.type}</span>
                  <CopyButton text={currentAdCopy.content} label="复制文案" />
                </div>
                <div className="rounded-xl p-4 flex-1"
                  style={{ background: "#FFFBF0", border: "1px solid rgba(245,158,11,0.18)" }}>
                  <pre className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "#444444", fontFamily: "inherit" }}>
                    {currentAdCopy.content}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.06), rgba(91,140,255,0.06))", border: "1px solid rgba(123,97,255,0.15)" }}>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "#111111" }}>内容素材已全部就绪</p>
            <p className="text-[12px] mt-0.5" style={{ color: "#888888" }}>
              复制内容直接投入使用，或保存报告后续参考
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA", color: "#555555" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
              <i className="ri-save-line text-[13px]" />
              保存报告
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-opacity duration-200 hover:opacity-88 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
              <i className="ri-flashlight-fill text-[13px]" />
              开始执行
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
