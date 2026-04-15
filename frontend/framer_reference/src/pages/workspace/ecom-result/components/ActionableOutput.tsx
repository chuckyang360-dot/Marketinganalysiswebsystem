import { useState, useRef } from "react";
import type { EcomResultData } from "@/mocks/ecomResult";
import type { GalleryImage } from "./ProductImageGallery";

interface Props {
  data: EcomResultData;
  referenceImg?: GalleryImage | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getReferenceInsight(tag: string): string {
  const map: Record<string, string> = {
    main: "当前参考图为主图，建议分析构图焦点、背景处理与主体清晰度，直接作为新方案的对比基准。",
    lifestyle: "参考图为生活场景图，建议提取场景情绪与人物表情，在新主图中放大使用场景的代入感。",
    detail: "参考图为细节图，建议将产品材质感与工艺细节融入主图，强化视觉质感与品质信任。",
    feature: "参考图为功能示意图，建议把技术卖点可视化带入主图，让用户一眼感知核心差异化。",
    accessory: "参考图展示配件，建议在主图构图中加入充电盒/配件陪衬，体现产品完整性与价值感。",
    packaging: "参考图为包装图，建议借鉴品牌色调与质感，在主图中延续视觉语言提升品牌一致性。",
  };
  return map[tag] ?? "结合参考图的视觉风格，针对以下方向进行优化。";
}

function getReferenceKeywords(tag: string): string[] {
  const map: Record<string, string[]> = {
    main: ["构图优化", "背景简洁", "主体突出"],
    lifestyle: ["场景代入", "情绪表达", "人物互动"],
    detail: ["材质质感", "工艺细节", "近景特写"],
    feature: ["技术可视化", "功能示意", "信息层级"],
    accessory: ["产品全貌", "配件陪衬", "价值感"],
    packaging: ["品牌色调", "包装质感", "视觉一致"],
  };
  return map[tag] ?? ["视觉优化", "差异化表达"];
}

function getDirectionReferenceHint(dirId: string, refTag: string): string {
  if (dirId === "img1") {
    if (refTag === "lifestyle") return "参考图已是生活场景，可直接提取人物动作与环境氛围，强化真实感与情绪共鸣。";
    if (refTag === "main") return "原主图以产品为主，本方向建议在此基础上叠加城市通勤场景，增加使用语境。";
    return "建议以参考图为底稿，加入通勤/咖啡馆等城市场景元素，让产品更有生活感。";
  }
  if (dirId === "img2") {
    if (refTag === "detail") return "参考图已具备细节质感，建议进一步提升背景纯净度，用打光强调降噪结构的工艺感。";
    if (refTag === "main") return "在参考图角度基础上旋转 45°，搭配强调型侧光，突出产品腔体的高级材质感。";
    return "以参考图为参照，使用纯白背景 + 侧打光，重点呈现产品轮廓线条与材质层次。";
  }
  if (dirId === "img3") {
    if (refTag === "feature") return "参考图展示了技术原理，建议将其转化为直观对比：左噪声波形 / 右安静环境，感受更强烈。";
    if (refTag === "lifestyle") return "参考图情绪已到位，建议做分屏处理，左侧保留嘈杂场景，右侧叠加滤镜凸显安静效果。";
    return "基于参考图视觉，制作前后对比构图，直观传达 ANC 降噪的场景差异与效果落差。";
  }
  return "结合参考图风格，将此优化方向落地为可执行的视觉素材。";
}

function getDirectionPrompt(dirId: string, refImg: GalleryImage | null | undefined): string {
  const refNote = refImg ? ` Reference style from: ${refImg.label} (${refImg.tag} type image).` : "";
  const prompts: Record<string, string> = {
    img1: `Lifestyle product photo of premium wireless earbuds, person wearing them in a modern city commute scene — subway or cafe background, natural daylight, focused and calm expression. Shallow depth of field, warm editorial tones, no text overlay, high-end camera quality.${refNote}`,
    img2: `Clean studio product photo of wireless earbuds, 45-degree angle, pure white background, single-source side lighting to emphasize material texture and noise-cancelling structure detail. Minimal shadows, razor-sharp focus, premium luxury feel.${refNote}`,
    img3: `Split-screen product visual: left side shows chaotic noisy environment (crowded subway, visual sound waves), right side shows the same scene with earbuds worn — peaceful, quiet, clean atmosphere. Strong visual contrast, minimal design, editorial quality.${refNote}`,
  };
  return prompts[dirId] ?? `Professional product optimization photo based on the selected direction.${refNote}`;
}

const GENERATED_IMAGES: Record<string, string> = {
  img1: "https://readdy.ai/api/search-image?query=person%20wearing%20premium%20wireless%20earbuds%20in%20modern%20urban%20cafe%20environment%20natural%20daylight%20warm%20tones%20shallow%20depth%20of%20field%20focused%20calm%20editorial%20quality%20product%20lifestyle%20photo&width=600&height=600&seq=gen_dir1&orientation=squarish",
  img2: "https://readdy.ai/api/search-image?query=wireless%20earbuds%2045%20degree%20angle%20pure%20white%20background%20single%20source%20side%20lighting%20material%20texture%20detail%20minimal%20shadows%20sharp%20focus%20premium%20luxury%20product%20studio%20photo&width=600&height=600&seq=gen_dir2&orientation=squarish",
  img3: "https://readdy.ai/api/search-image?query=split%20screen%20product%20visual%20noisy%20subway%20crowd%20left%20side%20peaceful%20calm%20right%20side%20wearing%20earbuds%20strong%20contrast%20minimal%20editorial%20clean%20background&width=600&height=600&seq=gen_dir3&orientation=squarish",
};

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text, label = "复制", size = "default" }: { text: string; label?: string; size?: "default" | "sm" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const szCls = size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]";
  return (
    <button onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${szCls}`}
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

// ── RegenerateButton ──────────────────────────────────────────────────────────

function RegenerateButton({ onRegen, label = "重新生成", size = "default" }: { onRegen: () => void; label?: string; size?: "default" | "sm" }) {
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
    onRegen();
  };
  const szCls = size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]";
  return (
    <button onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${szCls}`}
      style={{
        background: loading ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.2)",
        color: "#d97706",
      }}>
      <i className={`${loading ? "ri-loader-4-line animate-spin" : "ri-refresh-line"} text-[11px]`} />
      {loading ? "生成中..." : label}
    </button>
  );
}

// ── Image Lightbox ─────────────────────────────────────────────────────────────

function ImageLightbox({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}-generated.jpg`;
    a.click();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.82)" }}
      onClick={onClose}>
      <div className="relative max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <img src={url} alt={label} className="w-full h-auto object-contain" style={{ maxHeight: "70vh" }} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[13px] font-medium text-white/80">{label} · 生成主图</span>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200"
              style={{ background: "#16a34a", color: "#ffffff" }}>
              <i className="ri-download-2-line text-[13px]" />
              下载图片
            </button>
            <button onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff" }}>
              <i className="ri-close-line text-[13px]" />
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compare Modal ─────────────────────────────────────────────────────────────

interface CompareModalProps {
  refImg: GalleryImage;
  generatedUrl: string;
  dirLabel: string;
  onClose: () => void;
}

function CompareModal({ refImg, generatedUrl, dirLabel, onClose }: CompareModalProps) {
  const [sliderX, setSliderX] = useState(50);
  const [mode, setMode] = useState<"split" | "slider">("split");
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(95, Math.max(5, x)));
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = generatedUrl;
    a.download = `${dirLabel}-generated.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}>
      <div className="w-full flex flex-col" style={{ maxWidth: "960px" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-semibold text-white">{dirLabel} · 对比预览</h3>
            {/* Mode toggle */}
            <div className="flex items-center rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setMode("split")}
                className="px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  background: mode === "split" ? "rgba(255,255,255,0.16)" : "transparent",
                  color: mode === "split" ? "#ffffff" : "rgba(255,255,255,0.5)",
                }}>
                <i className="ri-layout-column-line mr-1 text-[11px]" />
                并排对比
              </button>
              <button
                onClick={() => setMode("slider")}
                className="px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  background: mode === "slider" ? "rgba(255,255,255,0.16)" : "transparent",
                  color: mode === "slider" ? "#ffffff" : "rgba(255,255,255,0.5)",
                }}>
                <i className="ri-drag-move-line mr-1 text-[11px]" />
                滑动对比
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer whitespace-nowrap"
              style={{ background: "#16a34a", color: "#ffffff" }}>
              <i className="ri-download-2-line text-[13px]" />
              下载新图
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              <i className="ri-close-line text-[16px]" />
            </button>
          </div>
        </div>

        {/* ── Split mode ── */}
        {mode === "split" && (
          <div className="grid grid-cols-2 gap-3">
            {/* Left: Reference */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "#7B61FF" }} />
                <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  参考图 · {refImg.label}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden"
                style={{ border: "1.5px solid rgba(123,97,255,0.35)", background: "#111", aspectRatio: "1/1" }}>
                <img src={refImg.url} alt={refImg.label} className="w-full h-full object-contain" />
              </div>
            </div>
            {/* Right: Generated */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
                <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  AI 生成 · {dirLabel}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                  style={{ background: "rgba(245,158,11,0.18)", color: "#f59e0b" }}>
                  NEW
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden relative"
                style={{ border: "1.5px solid rgba(245,158,11,0.4)", background: "#111", aspectRatio: "1/1" }}>
                <img src={generatedUrl} alt={`${dirLabel} 生成主图`} className="w-full h-full object-contain" />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-semibold"
                  style={{ background: "rgba(245,158,11,0.85)", color: "#ffffff" }}>
                  AI 优化版
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Slider mode ── */}
        {mode === "slider" && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
              拖动中间分割线查看对比效果
            </p>
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden select-none"
              style={{ aspectRatio: "16/9", background: "#111", border: "1px solid rgba(255,255,255,0.1)", cursor: "col-resize" }}
              onMouseMove={handleMouseMove}
              onMouseUp={() => { isDragging.current = false; }}
              onMouseLeave={() => { isDragging.current = false; }}>

              {/* Right (generated) — full width base */}
              <img src={generatedUrl} alt="generated"
                className="absolute inset-0 w-full h-full object-contain" />

              {/* Left (reference) — clipped */}
              <div className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderX}%` }}>
                <img src={refImg.url} alt="reference"
                  className="absolute inset-0 h-full object-contain"
                  style={{ width: `${100 / (sliderX / 100)}%`, maxWidth: "none" }} />
              </div>

              {/* Divider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 z-10"
                style={{ left: `${sliderX}%`, background: "rgba(255,255,255,0.9)", transform: "translateX(-50%)" }}>
                {/* Handle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-col-resize"
                  style={{ background: "#ffffff", border: "2px solid rgba(0,0,0,0.15)" }}
                  onMouseDown={() => { isDragging.current = true; }}>
                  <i className="ri-drag-move-line text-[14px]" style={{ color: "#444" }} />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[11px] font-semibold"
                style={{ background: "rgba(123,97,255,0.85)", color: "#fff", opacity: sliderX > 15 ? 1 : 0, transition: "opacity 0.2s" }}>
                参考图
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[11px] font-semibold"
                style={{ background: "rgba(245,158,11,0.85)", color: "#fff", opacity: sliderX < 85 ? 1 : 0, transition: "opacity 0.2s" }}>
                AI 优化版
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-3 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          点击空白区域关闭 · 可切换「并排」或「滑动」对比模式
        </p>
      </div>
    </div>
  );
}

// ── Direction Image Generation Panel ─────────────────────────────────────────

interface GenerationPanelProps {
  dirId: string;
  dirLabel: string;
  referenceImg: GalleryImage | null | undefined;
}

function DirectionGenerationPanel({ dirId, dirLabel, referenceImg }: GenerationPanelProps) {
  const defaultPrompt = getDirectionPrompt(dirId, referenceImg);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generatedUrl = GENERATED_IMAGES[dirId] ?? GENERATED_IMAGES.img1;

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = generatedUrl;
    a.download = `${dirLabel}-generated.jpg`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Generated image result */}
      {(generating || generated) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold" style={{ color: "#111" }}>生成结果</span>
            {generated && (
              <div className="flex items-center gap-2">
                {referenceImg && (
                  <button onClick={() => setCompareOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
                    style={{ background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.2)", color: "#7B61FF" }}>
                    <i className="ri-layout-column-line text-[10px]" />
                    预览对比
                  </button>
                )}
                <button onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
                  style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)", color: "#0ea5e9" }}>
                  <i className="ri-zoom-in-line text-[10px]" />
                  放大预览
                </button>
                <button onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
                  style={{
                    background: downloaded ? "rgba(22,163,74,0.1)" : "rgba(22,163,74,0.07)",
                    border: downloaded ? "1px solid rgba(22,163,74,0.3)" : "1px solid rgba(22,163,74,0.2)",
                    color: downloaded ? "#15803d" : "#16a34a",
                  }}>
                  <i className={`${downloaded ? "ri-check-line" : "ri-download-2-line"} text-[10px]`} />
                  {downloaded ? "已下载" : "下载"}
                </button>
              </div>
            )}
          </div>

          {/* Image box */}
          <div className="relative rounded-xl overflow-hidden"
            style={{ border: "1.5px solid #EAEAEA", background: "#F7F8FA", aspectRatio: "1/1", maxWidth: "280px" }}>
            {generating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full"
                  style={{ background: "rgba(245,158,11,0.08)" }}>
                  <i className="ri-magic-line text-[18px] animate-pulse" style={{ color: "#f59e0b" }} />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold" style={{ color: "#333" }}>AI 正在生成主图</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#999" }}>基于优化 Prompt 生成中...</p>
                </div>
                <div className="flex gap-1.5 mt-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "#f59e0b",
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <img src={generatedUrl} alt={`${dirLabel} 生成主图`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxOpen(true)} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.35)" }}
                  onClick={() => setLightboxOpen(true)}>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.9)" }}>
                    <i className="ri-zoom-in-line text-[13px]" style={{ color: "#333" }} />
                    <span className="text-[12px] font-medium" style={{ color: "#333" }}>点击放大</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Prompt input area */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "#FFFBF0" }}>
        <div className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
          <span className="text-[11px] font-semibold" style={{ color: "#d97706" }}>
            <i className="ri-sparkling-line mr-1" />
            {generated ? "调整 Prompt 重新生成" : "优化 Prompt"}
          </span>
          <CopyButton text={prompt} label="复制" size="sm" />
        </div>
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full text-[11px] leading-relaxed resize-none outline-none bg-transparent"
            style={{ color: "#555", fontFamily: "inherit" }}
            placeholder="在此编辑 Prompt，然后点击生成主图..."
          />
        </div>
        <div className="px-3 pb-3 flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "#BBBBBB" }}>
            可二次编辑后重新生成
          </span>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200"
            style={{
              background: generating ? "rgba(245,158,11,0.1)" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: generating ? "#d97706" : "#ffffff",
              border: generating ? "1px solid rgba(245,158,11,0.3)" : "none",
            }}>
            <i className={`${generating ? "ri-loader-4-line animate-spin" : "ri-magic-line"} text-[12px]`} />
            {generating ? "生成中..." : generated ? "重新生成" : "生成主图"}
          </button>
        </div>
      </div>

      {lightboxOpen && generated && (
        <ImageLightbox url={generatedUrl} label={dirLabel} onClose={() => setLightboxOpen(false)} />
      )}
      {compareOpen && generated && referenceImg && (
        <CompareModal
          refImg={referenceImg}
          generatedUrl={generatedUrl}
          dirLabel={dirLabel}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ActionableOutput({ data, referenceImg }: Props) {
  const { actionable } = data;

  // Titles: max 3, each with copy + regen
  const displayTitles = actionable.titles.slice(0, 3);
  const [selectedTitle, setSelectedTitle] = useState("t1");
  const [titleVersions, setTitleVersions] = useState<Record<string, number>>({});

  // Bullets: max 3, each with copy + regen
  const displayBullets = actionable.bullets.slice(0, 3);
  const [bulletVersions, setBulletVersions] = useState<Record<string, number>>({});

  // Image directions
  const [activeDirectionId, setActiveDirectionId] = useState<string | null>(null);
  const [refImgError, setRefImgError] = useState(false);

  const selectedTitleObj = displayTitles.find((t) => t.id === selectedTitle);

  const handleRegenTitle = (id: string) => {
    setTitleVersions((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleRegenBullet = (id: string) => {
    setBulletVersions((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  return (
    <section className="w-full px-6 lg:px-10 py-6 pb-16">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>
            可执行输出
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "#888888" }}>
            直接可用的优化资产，一键复制或生成
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Block 1: Title Optimization ── */}
          <div className="rounded-2xl p-5" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(123,97,255,0.08)" }}>
                  <i className="ri-text text-[14px]" style={{ color: "#7B61FF" }} />
                </div>
                <div>
                  <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>标题优化</span>
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(123,97,255,0.07)", color: "#7B61FF" }}>
                    {displayTitles.length} 个方案
                  </span>
                </div>
              </div>
              {selectedTitleObj && <CopyButton text={selectedTitleObj.text} label="复制选中标题" />}
            </div>

            <div className="flex flex-col gap-2">
              {displayTitles.map((title, idx) => {
                const isSelected = selectedTitle === title.id;
                const version = titleVersions[title.id] ?? 0;
                return (
                  <div key={title.id}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{
                      background: isSelected ? "rgba(123,97,255,0.04)" : "#F7F8FA",
                      border: isSelected ? "1.5px solid rgba(123,97,255,0.25)" : "1px solid #EAEAEA",
                    }}
                    onClick={() => setSelectedTitle(title.id)}>
                    <div className="flex items-start gap-2.5 p-3.5">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5 text-white"
                        style={{ background: isSelected ? "#7B61FF" : "#CCCCCC" }}>
                        {idx + 1}
                      </span>
                      <p className="text-[12px] leading-relaxed flex-1" style={{ color: isSelected ? "#333333" : "#666666" }}>
                        {title.text}
                        {version > 0 && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a" }}>
                            已优化 v{version + 1}
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Per-card actions */}
                    <div className="flex items-center gap-2 px-3.5 pb-3 border-t"
                      style={{ borderColor: isSelected ? "rgba(123,97,255,0.1)" : "#EFEFEF" }}
                      onClick={(e) => e.stopPropagation()}>
                      <span className="flex-1" />
                      <CopyButton text={title.text} label="复制" size="sm" />
                      <RegenerateButton onRegen={() => handleRegenTitle(title.id)} label="重新生成" size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>


          </div>

          {/* ── Block 2: Bullet Points ── */}
          <div className="rounded-2xl p-5" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(14,165,233,0.08)" }}>
                  <i className="ri-list-check-3 text-[14px]" style={{ color: "#0ea5e9" }} />
                </div>
                <div>
                  <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>核心卖点</span>
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(14,165,233,0.07)", color: "#0ea5e9" }}>
                    Bullet Points
                  </span>
                </div>
              </div>
              <CopyButton
                text={displayBullets.map((b) => b.text).join("\n\n")}
                label="复制全部" />
            </div>

            <div className="flex flex-col gap-2">
              {displayBullets.map((bullet, idx) => {
                const version = bulletVersions[bullet.id] ?? 0;
                return (
                  <div key={bullet.id}
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid #EAEAEA", background: "#F7F8FA" }}>
                    <div className="flex items-start gap-2.5 p-3.5">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5 text-white"
                        style={{ background: "#0ea5e9" }}>
                        {idx + 1}
                      </span>
                      <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#333333" }}>
                        {bullet.text}
                        {version > 0 && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a" }}>
                            已优化 v{version + 1}
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Per-card actions */}
                    <div className="flex items-center gap-2 px-3.5 pb-3 border-t"
                      style={{ borderColor: "#EFEFEF" }}>
                      <span className="flex-1" />
                      <CopyButton text={bullet.text} label="复制" size="sm" />
                      <RegenerateButton onRegen={() => handleRegenBullet(bullet.id)} label="重新生成" size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Block 3: Image Directions ── */}
          <div className="rounded-2xl p-5 lg:col-span-2" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(245,158,11,0.08)" }}>
                  <i className="ri-image-line text-[14px]" style={{ color: "#f59e0b" }} />
                </div>
                <div>
                  <span className="text-[14px] font-semibold" style={{ color: "#111111" }}>主图优化方向</span>
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(245,158,11,0.07)", color: "#f59e0b" }}>
                    {actionable.imageDirections.length} 个方向
                  </span>
                </div>
              </div>
              {referenceImg && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(123,97,255,0.06)", border: "1px solid rgba(123,97,255,0.18)" }}>
                  <i className="ri-focus-3-fill text-[11px]" style={{ color: "#7B61FF" }} />
                  <span className="text-[11px] font-medium" style={{ color: "#7B61FF" }}>已绑定参考图</span>
                </div>
              )}
            </div>

            {/* Reference image panel */}
            {referenceImg ? (
              <div className="mb-4 rounded-xl overflow-hidden"
                style={{ border: "1.5px solid rgba(123,97,255,0.22)", background: "rgba(123,97,255,0.03)" }}>
                <div className="flex items-center gap-3 px-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(123,97,255,0.12)" }}>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-focus-3-fill text-[13px]" style={{ color: "#7B61FF" }} />
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: "#7B61FF" }}>当前参考图</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto"
                    style={{ background: "rgba(123,97,255,0.10)", color: "#7B61FF" }}>
                    {referenceImg.label}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3">
                  <div className="shrink-0 rounded-lg overflow-hidden"
                    style={{ width: "72px", height: "72px", background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                    {!refImgError ? (
                      <img src={referenceImg.url} alt={referenceImg.label}
                        className="w-full h-full object-contain p-1"
                        onError={() => setRefImgError(true)} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-[20px]" style={{ color: "#CCC" }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium mb-1" style={{ color: "#333" }}>
                      基于「{referenceImg.label}」的优化建议
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#777" }}>
                      {getReferenceInsight(referenceImg.tag)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {getReferenceKeywords(referenceImg.tag).map((kw) => (
                        <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(123,97,255,0.07)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
                style={{ background: "#F7F8FA", border: "1px dashed #D0D0D0" }}>
                <i className="ri-focus-3-line text-[15px]" style={{ color: "#AAAAAA" }} />
                <div>
                  <p className="text-[12px] font-medium" style={{ color: "#888" }}>未选择参考图</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA" }}>
                    在上方商品图画廊中点击「设为参考」，优化方向将与实际图片挂钩
                  </p>
                </div>
              </div>
            )}

            {/* Direction cards — horizontal row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actionable.imageDirections.map((dir) => {
                const isActive = activeDirectionId === dir.id;
                return (
                  <div key={dir.id}
                    className="rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      border: isActive ? "1.5px solid rgba(245,158,11,0.4)" : "1px solid #EAEAEA",
                      background: isActive ? "rgba(245,158,11,0.02)" : "#F7F8FA",
                    }}>
                    {/* Card header row */}
                    <div className="flex items-start gap-3 p-4 cursor-pointer"
                      onClick={() => setActiveDirectionId(isActive ? null : dir.id)}>
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0"
                        style={{ background: isActive ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.08)" }}>
                        <i className={`${dir.icon} text-[15px]`} style={{ color: "#f59e0b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold" style={{ color: "#111111" }}>{dir.direction}</p>
                        <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "#666666" }}>{dir.description}</p>
                      </div>
                      <i className={`${isActive ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} text-[14px] shrink-0 mt-1`}
                        style={{ color: "#AAAAAA" }} />
                    </div>

                    {/* Generate button */}
                    {!isActive && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => setActiveDirectionId(dir.id)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200"
                          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#ffffff" }}>
                          <i className="ri-magic-line text-[12px]" />
                          生成主图
                        </button>
                      </div>
                    )}

                    {/* Expanded panel */}
                    {isActive && (
                      <div className="px-4 pb-4"
                        style={{ borderTop: "1px solid rgba(245,158,11,0.12)" }}>
                        {/* Reference hint */}
                        {referenceImg && (
                          <div className="flex items-start gap-2.5 mt-3 p-3 rounded-xl mb-3"
                            style={{ background: "rgba(123,97,255,0.04)", border: "1px solid rgba(123,97,255,0.14)" }}>
                            <div className="shrink-0 rounded-lg overflow-hidden"
                              style={{ width: "40px", height: "40px", background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                              {!refImgError ? (
                                <img src={referenceImg.url} alt={referenceImg.label}
                                  className="w-full h-full object-contain p-0.5"
                                  onError={() => setRefImgError(true)} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="ri-image-line text-[12px]" style={{ color: "#CCC" }} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium" style={{ color: "#7B61FF" }}>
                                基于参考图「{referenceImg.label}」
                              </p>
                              <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "#666" }}>
                                {getDirectionReferenceHint(dir.id, referenceImg.tag)}
                              </p>
                            </div>
                          </div>
                        )}

                        <DirectionGenerationPanel
                          dirId={dir.id}
                          dirLabel={dir.direction}
                          referenceImg={referenceImg}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom CTA Bar */}
        <div className="mt-6 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.06), rgba(91,140,255,0.06))", border: "1px solid rgba(123,97,255,0.15)" }}>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "#111111" }}>已完成所有优化资产导出</p>
            <p className="text-[12px] mt-0.5" style={{ color: "#888888" }}>
              你可以将以上内容直接应用到商品页面，或保存到分析历史中
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA", color: "#555555" }}>
              <i className="ri-save-line text-[13px]" />
              保存报告
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-opacity duration-200 hover:opacity-88 whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
              <i className="ri-send-plane-line text-[13px]" />
              应用全部优化
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
