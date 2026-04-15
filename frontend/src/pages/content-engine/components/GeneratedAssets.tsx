import { useState } from "react";
import type { ContentType } from "../../../mocks/contentEngine";
import type { ImageAssetsData, ArticleAssetsData } from "../../../mocks/contentEngine";

interface GeneratedAssetsData {
  videoScript: {
    hook: string;
    scenes: Array<{ id: number; duration: string; shot: string; script: string }>;
    cta: string;
  };
  titles: string[];
  seoOutline: { title: string; h2List: string[] };
  prompts: { imagePrompt: string; videoPrompt: string };
  clips: Array<{ id: number; timeRange: string; title: string; desc: string; engagement: string }>;
  imagePosts: Array<{ page: number; title: string; copy: string }>;
}

interface GeneratedAssetsProps {
  data: GeneratedAssetsData;
  sourceImages?: string[];
  contentType?: ContentType;
}

export default function GeneratedAssets({ data, sourceImages = [], contentType = "video" }: GeneratedAssetsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const isImage = contentType === "image";
  const isArticle = contentType === "article";

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cardStyle = (idx: number): React.CSSProperties => ({
    animation: `assetFadeUp 0.5s ease both`,
    animationDelay: `${idx * 120}ms`,
  });

  const assetCount = isImage ? 2 : isArticle ? 3 : 5;

  return (
    <section className="w-full px-6 lg:px-10 py-10" style={{ background: "#F7F8FA" }}>
      <style>{`
        @keyframes assetFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8" style={{ animation: "assetFadeUp 0.4s ease both" }}>
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #7B61FF, #5B8CFF)" }} />
          <h3 className="text-[16px] font-bold" style={{ color: "#111111" }}>可执行内容输出</h3>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }}>
            直接可用
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ml-1"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}>
            <i className="ri-magic-line text-[10px]" />
            AI 已生成 {assetCount} 项资产
          </span>
        </div>

        {isImage ? (
          <ImageOutputLayout
            data={data as unknown as ImageAssetsData}
            sourceImages={sourceImages}
            copy={copy}
            copiedKey={copiedKey}
            cardStyle={cardStyle}
          />
        ) : isArticle ? (
          <ArticleOutputLayout
            data={data as unknown as ArticleAssetsData}
            copy={copy}
            copiedKey={copiedKey}
            cardStyle={cardStyle}
          />
        ) : (
          <VideoOutputLayout
            data={data}
            copy={copy}
            copiedKey={copiedKey}
            cardStyle={cardStyle}
          />
        )}
      </div>
    </section>
  );
}

/* ─── Copy Button ───────────────────────────────────────── */
function CopyBtn({ label, onClick, copied }: { label: string; onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
      style={{
        background: copied ? "rgba(16,185,129,0.08)" : "rgba(123,97,255,0.08)",
        color: copied ? "#10b981" : "#7B61FF",
        border: `1px solid ${copied ? "rgba(16,185,129,0.2)" : "rgba(123,97,255,0.15)"}`,
      }}
    >
      <i className={`${copied ? "ri-check-line" : "ri-clipboard-line"} text-[11px]`} />
      {copied ? "已复制" : label}
    </button>
  );
}

function VideoScriptCard({
  data, copy, copiedKey,
}: {
  data: GeneratedAssetsData["videoScript"];
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  const fullScript = data.scenes.map((s) => `[${s.duration}] ${s.shot}\n${s.script}`).join("\n\n") + `\n\nCTA: ${data.cta}`;
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 h-full" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(123,97,255,0.08)" }}>
            <i className="ri-video-line text-[13px]" style={{ color: "#7B61FF" }} />
          </div>
          <p className="text-[13px] font-bold" style={{ color: "#111111" }}>视频脚本</p>
        </div>
        <CopyBtn label="复制全文" onClick={() => copy(fullScript, "script")} copied={copiedKey === "script"} />
      </div>
      <div className="rounded-xl p-3" style={{ background: "rgba(123,97,255,0.04)", border: "1px solid rgba(123,97,255,0.1)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#7B61FF" }}>Hook</p>
        <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>{data.hook}</p>
      </div>
      <div className="flex flex-col gap-2">
        {data.scenes.map((scene) => (
          <div key={scene.id} className="flex gap-3 p-3 rounded-xl" style={{ background: "#F7F8FA" }}>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full h-fit whitespace-nowrap mt-0.5"
              style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
              {scene.duration}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium" style={{ color: "#888888" }}>{scene.shot}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "#111111" }}>{scene.script}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
        <i className="ri-megaphone-line text-[12px]" style={{ color: "#ef4444" }} />
        <p className="text-[12px] font-medium" style={{ color: "#ef4444" }}>{data.cta}</p>
      </div>
    </div>
  );
}

function TitlesCard({
  data, copy, copiedKey,
}: {
  data: string[];
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 h-full" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(251,146,60,0.1)" }}>
            <i className="ri-text text-[13px]" style={{ color: "#fb923c" }} />
          </div>
          <p className="text-[13px] font-bold" style={{ color: "#111111" }}>标题生成</p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#888888" }}>
            {data.length} 个方案
          </span>
        </div>
        <CopyBtn label="全部复制" onClick={() => copy(data.join("\n"), "titles-all")} copied={copiedKey === "titles-all"} />
      </div>
      <div className="flex flex-col gap-2">
        {data.map((title, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-150"
            style={{ background: "#F7F8FA" }}
            onClick={() => copy(title, `title-${idx}`)}
          >
            <span className="text-[11px] font-bold w-5 text-center" style={{ color: "#CCCCCC" }}>{idx + 1}</span>
            <p className="flex-1 text-[12px] font-medium" style={{ color: "#111111" }}>{title}</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <i className={`${copiedKey === `title-${idx}` ? "ri-check-line" : "ri-clipboard-line"} text-[12px]`}
                style={{ color: copiedKey === `title-${idx}` ? "#10b981" : "#AAAAAA" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptsCard({
  data, copy, copiedKey,
}: {
  data: GeneratedAssetsData["prompts"];
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(59,130,246,0.08)" }}>
          <i className="ri-ai-generate text-[13px]" style={{ color: "#3b82f6" }} />
        </div>
        <p className="text-[13px] font-bold" style={{ color: "#111111" }}>AI 生成 Prompt</p>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#888888" }}>
          直接用于 AI 工具
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "#888888" }}>
              <i className="ri-image-2-line text-[11px]" />封面图 Prompt
            </span>
            <CopyBtn label="复制" onClick={() => copy(data.imagePrompt, "img-prompt")} copied={copiedKey === "img-prompt"} />
          </div>
          <div className="rounded-xl p-3 flex-1" style={{ background: "#F7F8FA" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: "#555555", fontFamily: "monospace" }}>{data.imagePrompt}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "#888888" }}>
              <i className="ri-film-line text-[11px]" />视频风格 Prompt
            </span>
            <CopyBtn label="复制" onClick={() => copy(data.videoPrompt, "vid-prompt")} copied={copiedKey === "vid-prompt"} />
          </div>
          <div className="rounded-xl p-3 flex-1" style={{ background: "#F7F8FA" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: "#555555", fontFamily: "monospace" }}>{data.videoPrompt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageOutputLayout({
  data,
  sourceImages,
  copy,
  copiedKey,
  cardStyle,
}: {
  data: ImageAssetsData;
  sourceImages: string[];
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
  cardStyle: (idx: number) => React.CSSProperties;
}) {
  const [selectedImg, setSelectedImg] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (url: string, id: number, label: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `AI生成图-${label}.jpg`;
      a.click();
    } catch {
      window.open(url, "_blank");
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const handleDownloadAll = async () => {
    for (const img of data.generatedImages) {
      await handleDownload(img.url, img.id, img.label);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div style={cardStyle(0)}>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F7F8FA" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(255,36,66,0.08)" }}>
                <i className="ri-image-2-line text-[13px]" style={{ color: "#FF2442" }} />
              </div>
              <p className="text-[13px] font-bold" style={{ color: "#111111" }}>生成图片</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                {data.generatedImages.length} 张
              </span>
            </div>
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "rgba(255,36,66,0.06)", color: "#FF2442", border: "1px solid rgba(255,36,66,0.15)" }}
            >
              <i className="ri-download-2-line text-[11px]" />
              全部下载
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }}>
                  原始图片
                </span>
                <span className="text-[11px]" style={{ color: "#BBBBBB" }}>共 {sourceImages.length} 张</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.12), rgba(91,140,255,0.12))", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.18)" }}>
                  AI 重新生成
                </span>
                <span className="text-[11px]" style={{ color: "#BBBBBB" }}>同款 {data.generatedImages.length} 张</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={`grid gap-2 ${sourceImages.length <= 2 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {sourceImages.map((src, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden group"
                      style={{ height: sourceImages.length <= 2 ? "200px" : "130px", background: "#F7F8FA" }}>
                      <img src={src} alt={`原图${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: "rgba(0,0,0,0.3)" }}>
                        <span className="text-white text-[11px] font-semibold">原图 {idx + 1}</span>
                      </div>
                      <div className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: "rgba(0,0,0,0.5)" }}>{idx + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className={`grid gap-2 ${data.generatedImages.length <= 2 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {data.generatedImages.map((img) => (
                    <div key={img.id} className="relative rounded-xl overflow-hidden group cursor-pointer"
                      style={{ height: data.generatedImages.length <= 2 ? "200px" : "130px", background: "#F7F8FA" }}
                      onClick={() => setSelectedImg(img.id)}>
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: "rgba(0,0,0,0.45)" }}>
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white cursor-pointer whitespace-nowrap"
                          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
                          onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.id, img.label); }}
                        >
                          {downloadingId === img.id
                            ? <><i className="ri-loader-4-line text-[11px]" /> 下载中</>
                            : <><i className="ri-download-2-line text-[11px]" /> 下载</>
                          }
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", color: "#fff" }}>
                        {img.label}
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(123,97,255,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}>
                        <i className="ri-magic-line text-[9px]" />AI
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${data.generatedImages.length}, 1fr)` }}>
              {data.generatedImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => handleDownload(img.url, img.id, img.label)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
                  style={{
                    background: downloadingId === img.id ? "rgba(16,185,129,0.08)" : "#F7F8FA",
                    color: downloadingId === img.id ? "#10b981" : "#555555",
                    border: "1px solid #EAEAEA",
                  }}
                >
                  {downloadingId === img.id
                    ? <><i className="ri-check-line text-[11px]" /> 已下载</>
                    : <><i className="ri-download-line text-[11px]" /> {img.label}</>
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={cardStyle(1)}>
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(255,36,66,0.08)" }}>
                <i className="ri-article-line text-[13px]" style={{ color: "#FF2442" }} />
              </div>
              <p className="text-[13px] font-bold" style={{ color: "#111111" }}>生成文案</p>
            </div>
            <CopyBtn label="复制文案" onClick={() => copy(data.generatedCaption, "caption")} copied={copiedKey === "caption"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }}>
                  原始文案
                </span>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#F7F8FA", minHeight: "160px" }}>
                <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: "#888888" }}>
                  大家好！今天来分享我花了3周整理的降噪耳机选购指南 🎧{"\n\n"}市面上耳机太多了真的选不过来，我帮大家踩了坑总结成9张图，从基础知识到实测推荐，按预算帮你选最适合的那款。{"\n\n"}✅ 200元档 / 500元档 / 旗舰档分别推荐{"\n"}✅ 降噪数据实测对比{"\n"}✅ 哪些功能是伪需求一次说清{"\n\n"}记得收藏备用！有问题评论区问我 👇{"\n\n"}#耳机推荐 #降噪耳机 #数码好物
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.12), rgba(91,140,255,0.12))", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.18)" }}>
                  AI 优化文案
                </span>
              </div>
              <div className="rounded-xl p-4 relative" style={{ background: "rgba(123,97,255,0.03)", border: "1px solid rgba(123,97,255,0.1)", minHeight: "160px" }}>
                <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: "#333333" }}>
                  {data.generatedCaption}
                </p>
                <button
                  onClick={() => copy(data.generatedCaption, "caption-float")}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150"
                  style={{
                    background: copiedKey === "caption-float" ? "rgba(16,185,129,0.1)" : "rgba(123,97,255,0.08)",
                    border: `1px solid ${copiedKey === "caption-float" ? "rgba(16,185,129,0.2)" : "rgba(123,97,255,0.15)"}`,
                  }}
                >
                  <i className={`${copiedKey === "caption-float" ? "ri-check-line" : "ri-clipboard-line"} text-[11px]`}
                    style={{ color: copiedKey === "caption-float" ? "#10b981" : "#7B61FF" }} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: "ri-flashlight-line", color: "#fb923c", label: "Hook 更强", desc: "开头句直接戳痛点，增加「帮你踩坑」代入感" },
              { icon: "ri-list-check-2", color: "#10b981", label: "结构更清晰", desc: "4张图逐一对应，读者知道每张图的价值" },
              { icon: "ri-hashtag", color: "#FF2442", label: "标签优化", desc: "增加「避坑指南」「小红书购物」高流量标签" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ background: "#F7F8FA" }}>
                <div className="flex items-center gap-1.5">
                  <i className={`${item.icon} text-[12px]`} style={{ color: item.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: "#111111" }}>{item.label}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "#888888" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedImg !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setSelectedImg(null)}
        >
          {(() => {
            const img = data.generatedImages.find((g) => g.id === selectedImg);
            if (!img) return null;
            return (
              <div className="relative max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <img src={img.url} alt={img.label} className="w-full rounded-2xl" style={{ maxHeight: "80vh", objectFit: "contain" }} />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer text-white whitespace-nowrap"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
                    onClick={() => handleDownload(img.url, img.id, img.label)}
                  >
                    <i className="ri-download-2-line text-[11px]" /> 下载
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                    onClick={() => setSelectedImg(null)}>
                    <i className="ri-close-line text-white text-[16px]" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[12px] font-semibold px-3 py-1.5 rounded-full text-white"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
                  {img.label} · AI 生成
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function ArticleOutputLayout({
  data,
  copy,
  copiedKey,
  cardStyle,
}: {
  data: ArticleAssetsData;
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
  cardStyle: (idx: number) => React.CSSProperties;
}) {
  const [activeTitle, setActiveTitle] = useState(0);

  const renderArticle = (text: string, muted: boolean) =>
    text.split("\n").map((line, idx) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-[16px] font-bold mt-1 mb-2" style={{ color: muted ? "#AAAAAA" : "#111111" }}>
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-[14px] font-bold mt-4 mb-1.5" style={{ color: muted ? "#BBBBBB" : "#222222" }}>
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-[13px] font-semibold mt-3 mb-1" style={{ color: muted ? "#BBBBBB" : "#333333" }}>
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-2 pl-3 my-2 text-[12px] italic leading-relaxed"
            style={{ borderColor: muted ? "#DDDDDD" : "#7B61FF", color: muted ? "#BBBBBB" : "#555555" }}>
            {line.replace("> ", "")}
          </blockquote>
        );
      }
      if (line.startsWith("---")) {
        return <hr key={idx} className="my-3" style={{ border: "none", borderTop: "1px solid #EAEAEA" }} />;
      }
      if (line.startsWith("| ")) {
        return (
          <div key={idx} className="text-[11px] font-mono py-0.5 leading-relaxed" style={{ color: muted ? "#CCCCCC" : "#555555" }}>
            {line}
          </div>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const parts = line.slice(2).split(/(\*\*[^*]+\*\*)/g);
        return (
          <li key={idx} className="text-[12px] leading-relaxed ml-3 list-disc list-inside my-0.5"
            style={{ color: muted ? "#CCCCCC" : "#444444" }}>
            {parts.map((p, i) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={i} style={{ color: muted ? "#BBBBBB" : "#111111" }}>{p.slice(2, -2)}</strong>
                : p
            )}
          </li>
        );
      }
      if (line === "") return <div key={idx} className="h-2" />;

      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={idx} className="text-[12px] leading-relaxed" style={{ color: muted ? "#BBBBBB" : "#444444" }}>
          {parts.map((p, i) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={i} style={{ color: muted ? "#AAAAAA" : "#111111" }}>{p.slice(2, -2)}</strong>
              : p
          )}
        </p>
      );
    });

  return (
    <div className="flex flex-col gap-6">
      <div style={cardStyle(0)}>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F7F8FA" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(123,97,255,0.08)" }}>
                <i className="ri-file-text-line text-[13px]" style={{ color: "#7B61FF" }} />
              </div>
              <p className="text-[13px] font-bold" style={{ color: "#111111" }}>生成文章</p>
            </div>
            <CopyBtn label="复制全文" onClick={() => copy(data.generatedArticle, "article-full")} copied={copiedKey === "article-full"} />
          </div>
          <div className="grid grid-cols-2 gap-0" style={{ borderBottom: "1px solid #F7F8FA" }}>
            <div className="flex items-center gap-1.5 px-5 py-2.5" style={{ borderRight: "1px solid #F7F8FA" }}>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }}>
                原始文章
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.12), rgba(91,140,255,0.12))", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.18)" }}>
                AI 优化版本
              </span>
              <button
                onClick={() => copy(data.generatedArticle, "article-copy-btn")}
                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150"
                style={{
                  background: copiedKey === "article-copy-btn" ? "rgba(16,185,129,0.08)" : "rgba(123,97,255,0.08)",
                  border: `1px solid ${copiedKey === "article-copy-btn" ? "rgba(16,185,129,0.2)" : "rgba(123,97,255,0.15)"}`,
                }}
              >
                <i className={`${copiedKey === "article-copy-btn" ? "ri-check-line" : "ri-clipboard-line"} text-[11px]`}
                  style={{ color: copiedKey === "article-copy-btn" ? "#10b981" : "#7B61FF" }} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-0">
            <div
              className="overflow-y-auto px-5 py-4"
              style={{ height: "480px", borderRight: "1px solid #F7F8FA", scrollbarWidth: "thin", scrollbarColor: "#EAEAEA transparent" }}
            >
              {renderArticle(data.originalArticle, true)}
            </div>
            <div
              className="overflow-y-auto px-5 py-4 relative"
              style={{ height: "480px", scrollbarWidth: "thin", scrollbarColor: "#EAEAEA transparent", background: "rgba(123,97,255,0.015)" }}
            >
              {renderArticle(data.generatedArticle, false)}
            </div>
          </div>
        </div>
      </div>
      <div style={cardStyle(1)}>
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(251,146,60,0.1)" }}>
                <i className="ri-text text-[13px]" style={{ color: "#fb923c" }} />
              </div>
              <p className="text-[13px] font-bold" style={{ color: "#111111" }}>标题方案</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#888888" }}>
                {data.titles.length} 个
              </span>
            </div>
            <CopyBtn label="全部复制" onClick={() => copy(data.titles.join("\n"), "titles-all-art")} copied={copiedKey === "titles-all-art"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {data.titles.map((title, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-150"
                style={{
                  background: activeTitle === idx ? "rgba(123,97,255,0.05)" : "#F7F8FA",
                  border: `1px solid ${activeTitle === idx ? "rgba(123,97,255,0.2)" : "transparent"}`,
                }}
                onClick={() => { setActiveTitle(idx); copy(title, `art-title-${idx}`); }}
              >
                <span className="text-[11px] font-bold w-5 text-center" style={{ color: "#CCCCCC" }}>{idx + 1}</span>
                <p className="flex-1 text-[12px] font-medium leading-snug" style={{ color: "#111111" }}>{title}</p>
                <div className={`transition-opacity duration-150 ${activeTitle === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <i className={`${copiedKey === `art-title-${idx}` ? "ri-check-line" : "ri-clipboard-line"} text-[12px]`}
                    style={{ color: copiedKey === `art-title-${idx}` ? "#10b981" : "#AAAAAA" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={cardStyle(2)}>
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(59,130,246,0.08)" }}>
                <i className="ri-search-line text-[13px]" style={{ color: "#3b82f6" }} />
              </div>
              <p className="text-[13px] font-bold" style={{ color: "#111111" }}>SEO 大纲</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F7F8FA", color: "#888888" }}>
                结构规划
              </span>
            </div>
            <CopyBtn
              label="复制大纲"
              onClick={() => copy([data.seoOutline.title, ...data.seoOutline.h2List].join("\n"), "seo-outline")}
              copied={copiedKey === "seo-outline"}
            />
          </div>
          <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#3b82f6" }}>H1 标题</p>
            <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>{data.seoOutline.title}</p>
          </div>
          <div className="flex flex-col gap-2">
            {data.seoOutline.h2List.map((h2, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all duration-150"
                style={{ background: "#F7F8FA" }}
                onClick={() => copy(h2, `h2-${idx}`)}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>H2</span>
                <p className="flex-1 text-[12px]" style={{ color: "#333333" }}>{h2}</p>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <i className={`${copiedKey === `h2-${idx}` ? "ri-check-line" : "ri-clipboard-line"} text-[11px]`}
                    style={{ color: copiedKey === `h2-${idx}` ? "#10b981" : "#AAAAAA" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CLIP_COVERS = [
  "https://readdy.ai/api/search-image?query=tech%20reviewer%20holding%20two%20headphones%20dramatic%20lighting%20product%20comparison%20dark%20background%20professional%20studio&width=640&height=360&seq=clip-cover-01&orientation=landscape",
  "https://readdy.ai/api/search-image?query=multiple%20headphones%20arranged%20on%20table%20product%20comparison%20photography%20white%20background%20data%20chart%20overlay&width=640&height=360&seq=clip-cover-02&orientation=landscape",
  "https://readdy.ai/api/search-image?query=tech%20reviewer%20speaking%20to%20camera%20product%20recommendation%20close%20up%20engaging%20expression%20studio%20lighting&width=640&height=360&seq=clip-cover-03&orientation=landscape",
];

function ClipsCard({ data }: { data: GeneratedAssetsData["clips"] }) {
  const [previewClip, setPreviewClip] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const engagementColor: Record<string, string> = {
    极高: "#ef4444",
    高: "#fb923c",
    中: "#10b981",
  };

  const handleDownload = async (clipId: number, title: string) => {
    setDownloadingId(clipId);
    const coverUrl = CLIP_COVERS[(clipId - 1) % CLIP_COVERS.length];
    try {
      const res = await fetch(coverUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `切片-${title}.jpg`;
      a.click();
    } catch {
      window.open(coverUrl, "_blank");
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const activeClip = previewClip !== null ? data.find((c) => c.id === previewClip) : null;

  return (
    <>
      <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: "rgba(16,185,129,0.08)" }}>
              <i className="ri-scissors-cut-line text-[13px]" style={{ color: "#10b981" }} />
            </div>
            <p className="text-[13px] font-bold" style={{ color: "#111111" }}>短视频切片方案</p>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
              {data.length} 个切片
            </span>
          </div>
          <span className="text-[11px]" style={{ color: "#AAAAAA" }}>点击预览 · 支持下载封面</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.map((clip, idx) => {
            const color = engagementColor[clip.engagement] ?? "#888888";
            const coverUrl = CLIP_COVERS[idx % CLIP_COVERS.length];
            return (
              <div key={clip.id} className="rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-150"
                style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                <div className="relative overflow-hidden" style={{ height: "130px" }}
                  onClick={() => setPreviewClip(clip.id)}>
                  <img src={coverUrl} alt={clip.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "rgba(0,0,0,0.45)" }}>
                    <div className="w-11 h-11 flex items-center justify-center rounded-full"
                      style={{ background: "rgba(255,255,255,0.9)" }}>
                      <i className="ri-play-fill text-[18px]" style={{ color: "#7B61FF", marginLeft: "2px" }} />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
                    {clip.timeRange}
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(123,97,255,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}>
                    Clip {clip.id}
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: "#111111" }}>{clip.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#888888" }}>{clip.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: "1px solid #EAEAEA" }}>
                    <div className="flex items-center gap-1">
                      <i className="ri-fire-line text-[11px]" style={{ color }} />
                      <span className="text-[11px] font-semibold" style={{ color }}>互动预期：{clip.engagement}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150"
                        style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.15)" }}
                        onClick={(e) => { e.stopPropagation(); setPreviewClip(clip.id); }}
                        title="预览"
                      >
                        <i className="ri-eye-line text-[12px]" style={{ color: "#7B61FF" }} />
                      </button>
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          border: `1px solid ${downloadingId === clip.id ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"}`,
                        }}
                        onClick={(e) => { e.stopPropagation(); handleDownload(clip.id, clip.title); }}
                        title="下载封面"
                      >
                        {downloadingId === clip.id
                          ? <i className="ri-check-line text-[12px]" style={{ color: "#10b981" }} />
                          : <i className="ri-download-line text-[12px]" style={{ color: "#10b981" }} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {previewClip !== null && activeClip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.88)" }}
          onClick={() => setPreviewClip(null)}
        >
          <div className="relative w-full mx-4" style={{ maxWidth: "720px" }} onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#111" }}>
              <img
                src={CLIP_COVERS[(activeClip.id - 1) % CLIP_COVERS.length]}
                alt={activeClip.title}
                className="w-full h-full object-cover"
                style={{ opacity: 0.92 }}
              />
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="w-16 h-16 flex items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.9)" }}>
                  <i className="ri-play-fill text-[24px]" style={{ color: "#7B61FF", marginLeft: "3px" }} />
                </div>
              </div>
              <div className="absolute bottom-3 right-4 px-3 py-1 rounded-lg text-[12px] font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
                {activeClip.timeRange}
              </div>
              <div className="absolute top-3 left-4 px-3 py-1 rounded-full text-[11px] font-bold"
                style={{ background: "rgba(123,97,255,0.88)", color: "#fff" }}>
                Clip {activeClip.id}
              </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[15px] font-bold text-white">{activeClip.title}</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{activeClip.desc}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <i className="ri-fire-line text-[12px]" style={{ color: engagementColor[activeClip.engagement] ?? "#888" }} />
                  <span className="text-[12px] font-semibold" style={{ color: engagementColor[activeClip.engagement] ?? "#888" }}>
                    互动预期：{activeClip.engagement}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer whitespace-nowrap text-white transition-all duration-150"
                  style={{ background: "rgba(16,185,129,0.85)", backdropFilter: "blur(6px)" }}
                  onClick={() => handleDownload(activeClip.id, activeClip.title)}
                >
                  {downloadingId === activeClip.id
                    ? <><i className="ri-check-line text-[12px]" /> 已下载</>
                    : <><i className="ri-download-2-line text-[12px]" /> 下载封面</>
                  }
                </button>
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                  onClick={() => setPreviewClip(null)}
                >
                  <i className="ri-close-line text-white text-[18px]" />
                </button>
              </div>
            </div>
            {data.length > 1 && (
              <div className="mt-4 flex gap-2 justify-center">
                {data.map((c) => (
                  <button
                    key={c.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
                    style={{
                      background: previewClip === c.id ? "rgba(123,97,255,0.85)" : "rgba(255,255,255,0.12)",
                      color: previewClip === c.id ? "#fff" : "rgba(255,255,255,0.7)",
                    }}
                    onClick={() => setPreviewClip(c.id)}
                  >
                    <i className="ri-film-line text-[10px]" />
                    Clip {c.id}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function VideoOutputLayout({
  data,
  copy,
  copiedKey,
  cardStyle,
}: {
  data: GeneratedAssetsData;
  copy: (text: string, key: string) => void;
  copiedKey: string | null;
  cardStyle: (idx: number) => React.CSSProperties;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div style={cardStyle(0)}>
          <VideoScriptCard data={data.videoScript} copy={copy} copiedKey={copiedKey} />
        </div>
        <div style={cardStyle(1)}>
          <TitlesCard data={data.titles} copy={copy} copiedKey={copiedKey} />
        </div>
      </div>
      <div style={cardStyle(2)}>
        <PromptsCard data={data.prompts} copy={copy} copiedKey={copiedKey} />
      </div>
      <div style={cardStyle(3)}>
        <ClipsCard data={data.clips} />
      </div>
    </div>
  );
}
