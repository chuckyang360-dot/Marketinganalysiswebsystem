import { useState, useRef, useCallback } from "react";

export interface GalleryImage {
  id: string;
  url: string;
  label: string;
  tag: string;
}

interface Props {
  images: GalleryImage[];
  productTitle: string;
  onSetReference?: (img: GalleryImage) => void;
}

const TAG_LABEL_MAP: Record<string, string> = {
  main: "主图",
  detail: "细节",
  lifestyle: "场景",
  feature: "功能",
  accessory: "配件",
  packaging: "包装",
};

export default function ProductImageGallery({ images, productTitle, onSetReference }: Props) {
  const [activeId, setActiveId] = useState<string>(images[0]?.id ?? "");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeImg = images.find((i) => i.id === activeId) ?? images[0];

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleSelectThumb = (id: string) => {
    setActiveId(id);
    // scroll thumb into view
    const el = thumbsRef.current?.querySelector(`[data-thumb-id="${id}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const handleSaveCurrent = () => {
    if (!activeImg) return;
    const a = document.createElement("a");
    a.href = activeImg.url;
    a.download = `${productTitle.slice(0, 30)}-${activeImg.label}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    showToast("已开始下载当前图片");
  };

  const handleBatchDownload = () => {
    images.forEach((img, idx) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = img.url;
        a.download = `${productTitle.slice(0, 20)}-${img.label}-${idx + 1}.jpg`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      }, idx * 300);
    });
    showToast(`正在批量下载 ${images.length} 张图片...`);
  };

  const handleSetReference = () => {
    if (!activeImg) return;
    setReferenceId(activeImg.id);
    onSetReference?.(activeImg);
    showToast(`已将「${activeImg.label}」设为优化参考图`);
  };

  const handlePrev = () => {
    const idx = images.findIndex((i) => i.id === activeId);
    if (idx > 0) handleSelectThumb(images[idx - 1].id);
  };

  const handleNext = () => {
    const idx = images.findIndex((i) => i.id === activeId);
    if (idx < images.length - 1) handleSelectThumb(images[idx + 1].id);
  };

  const activeIndex = images.findIndex((i) => i.id === activeId);

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="relative w-full rounded-xl overflow-hidden group"
        style={{ height: "220px", background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
        {activeImg && !imgErrors[activeImg.id] ? (
          <img
            src={activeImg.url}
            alt={activeImg.label}
            className="w-full h-full object-contain p-3 transition-opacity duration-300"
            onError={() => handleImgError(activeImg.id)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <i className="ri-image-line text-[32px]" style={{ color: "#CCCCCC" }} />
            <span className="text-[11px]" style={{ color: "#CCCCCC" }}>图片加载失败</span>
          </div>
        )}

        {/* Overlay controls */}
        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid #EAEAEA" }}>
            <i className="ri-arrow-left-s-line text-[14px]" style={{ color: "#444" }} />
          </button>
          <button
            onClick={handleNext}
            disabled={activeIndex === images.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid #EAEAEA" }}>
            <i className="ri-arrow-right-s-line text-[14px]" style={{ color: "#444" }} />
          </button>
        </div>

        {/* Top-right: expand + tag */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {activeImg && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(255,255,255,0.92)", color: "#666", border: "1px solid #EAEAEA" }}>
              {TAG_LABEL_MAP[activeImg.tag] ?? activeImg.tag}
            </span>
          )}
          <button
            onClick={() => setLightboxOpen(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid #EAEAEA" }}>
            <i className="ri-fullscreen-line text-[11px]" style={{ color: "#666" }} />
          </button>
        </div>

        {/* Reference badge */}
        {referenceId === activeImg?.id && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: "rgba(123,97,255,0.12)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.25)" }}>
            <i className="ri-focus-3-line text-[10px]" />
            优化参考图
          </div>
        )}

        {/* Counter */}
        <div className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}>
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div ref={thumbsRef}
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}>
        {images.map((img) => {
          const isActive = img.id === activeId;
          const isRef = img.id === referenceId;
          return (
            <button
              key={img.id}
              data-thumb-id={img.id}
              onClick={() => handleSelectThumb(img.id)}
              className="relative shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-150"
              style={{
                width: "52px",
                height: "52px",
                border: isActive
                  ? "2px solid #7B61FF"
                  : "2px solid transparent",
                outline: isActive ? "none" : "1px solid #EAEAEA",
                background: "#F7F8FA",
              }}>
              {!imgErrors[img.id] ? (
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full h-full object-contain p-1"
                  onError={() => handleImgError(img.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="ri-image-line text-[14px]" style={{ color: "#CCC" }} />
                </div>
              )}
              {/* Reference dot */}
              {isRef && (
                <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                  style={{ background: "#7B61FF" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSaveCurrent}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap"
          style={{ background: "#F7F8FA", border: "1px solid #EAEAEA", color: "#555" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; (e.currentTarget as HTMLElement).style.color = "#111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.color = "#555"; }}>
          <i className="ri-download-line text-[12px]" />
          保存原图
        </button>
        <button
          onClick={handleBatchDownload}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap"
          style={{ background: "#F7F8FA", border: "1px solid #EAEAEA", color: "#555" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; (e.currentTarget as HTMLElement).style.color = "#111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.color = "#555"; }}>
          <i className="ri-folder-download-line text-[12px]" />
          批量下载
        </button>
        <button
          onClick={handleSetReference}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap"
          style={{
            background: referenceId === activeImg?.id ? "rgba(123,97,255,0.08)" : "#F7F8FA",
            border: referenceId === activeImg?.id ? "1px solid rgba(123,97,255,0.30)" : "1px solid #EAEAEA",
            color: referenceId === activeImg?.id ? "#7B61FF" : "#555",
          }}
          onMouseEnter={(e) => {
            if (referenceId !== activeImg?.id) {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.30)";
              (e.currentTarget as HTMLElement).style.color = "#7B61FF";
            }
          }}
          onMouseLeave={(e) => {
            if (referenceId !== activeImg?.id) {
              (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA";
              (e.currentTarget as HTMLElement).style.color = "#555";
            }
          }}>
          <i className={`${referenceId === activeImg?.id ? "ri-focus-3-fill" : "ri-focus-3-line"} text-[12px]`} />
          {referenceId === activeImg?.id ? "已设参考" : "设为参考"}
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white shadow-lg transition-all duration-300"
          style={{ background: "rgba(30,30,30,0.88)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2">
            <i className="ri-checkbox-circle-fill text-[14px]" style={{ color: "#7B61FF" }} />
            {toastMsg}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && activeImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setLightboxOpen(false)}>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ maxWidth: "680px", maxHeight: "680px", width: "90vw", height: "90vw", background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImg.url}
              alt={activeImg.label}
              className="w-full h-full object-contain p-6"
            />
            {/* Label */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                {activeImg.label}
              </span>
            </div>
            {/* Nav */}
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #EAEAEA" }}>
              <i className="ri-arrow-left-s-line text-[18px]" style={{ color: "#333" }} />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIndex === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #EAEAEA" }}>
              <i className="ri-arrow-right-s-line text-[18px]" style={{ color: "#333" }} />
            </button>
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: "rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <i className="ri-close-line text-[16px]" style={{ color: "#333" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
