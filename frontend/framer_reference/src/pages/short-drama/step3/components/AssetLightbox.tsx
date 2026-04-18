import { useEffect, useRef, useState } from "react";

export interface LightboxItem {
  img: string;
  name: string;
  subtitle: string;
  desc: string;
  tags?: string[];
  meta?: Array<{ icon: string; label: string; value: string }>;
  orientation?: "portrait" | "landscape";
}

interface Props {
  item: LightboxItem | null;
  onClose: () => void;
}

export default function AssetLightbox({ item, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Animate in when item appears */
  useEffect(() => {
    if (item) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [item]);

  /* ESC close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Lock body scroll */
  useEffect(() => {
    if (item) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  if (!item) return null;

  const isPortrait = item.orientation === "portrait";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{
        background: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(12px)" : "blur(0px)",
        transition: "background 0.3s ease, backdrop-filter 0.3s ease",
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative flex flex-col md:flex-row w-full overflow-hidden"
        style={{
          maxWidth: isPortrait ? "860px" : "1000px",
          maxHeight: "90vh",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #EAEAEA",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.94) translateY(16px)",
          transition: "opacity 0.28s ease, transform 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200"
          style={{ background: "rgba(0,0,0,0.06)", color: "#444444" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.14)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.06)"; }}
        >
          <i className="ri-close-line text-[15px]" />
        </button>

        {/* Image panel */}
        <div
          className="flex items-center justify-center overflow-hidden shrink-0"
          style={{
            background: "#F5F5F7",
            width: isPortrait ? "min(380px, 45%)" : "100%",
            minHeight: isPortrait ? "480px" : "360px",
            maxHeight: isPortrait ? "90vh" : "60vh",
            borderRadius: isPortrait ? "20px 0 0 20px" : "20px 20px 0 0",
          }}
        >
          <img
            src={item.img}
            alt={item.name}
            className="w-full h-full"
            style={{ objectFit: "contain", maxHeight: isPortrait ? "90vh" : "60vh" }}
          />
        </div>

        {/* Info panel */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{
            flex: 1,
            padding: "32px 28px",
            minWidth: 0,
          }}
        >
          {/* Subtitle badge */}
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full self-start mb-4"
            style={{ background: "#F5F5F7", color: "#6E6E73", border: "1px solid #EAEAEA" }}
          >
            {item.subtitle}
          </span>

          {/* Name */}
          <h2
            className="text-[26px] font-black mb-3 leading-tight"
            style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}
          >
            {item.name}
          </h2>

          {/* Description */}
          <p
            className="text-[13.5px] leading-relaxed mb-5"
            style={{ color: "#6E6E73" }}
          >
            {item.desc}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11.5px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#F0F0F5", color: "#444444" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta fields */}
          {item.meta && item.meta.length > 0 && (
            <div
              className="rounded-xl overflow-hidden mb-6"
              style={{ border: "1px solid #EAEAEA" }}
            >
              {item.meta.map((m, idx) => (
                <div
                  key={m.label}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: idx < item.meta!.length - 1 ? "1px solid #F5F5F7" : "none",
                    background: "#ffffff",
                  }}
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0" style={{ background: "#F5F5F7" }}>
                    <i className={`${m.icon} text-[12px]`} style={{ color: "#8E8E93" }} />
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{m.label}</p>
                    <p className="text-[12.5px] font-medium" style={{ color: "#1D1D1F" }}>{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
              style={{ background: "#F5F5F7", color: "#444444", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAEAEA"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F7"; }}
            >
              关闭
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
              style={{ background: "#1D1D1F", color: "#ffffff" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#374151"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
            >
              <i className="ri-edit-line text-[12px]" />
              编辑角色
            </button>
          </div>

          <p className="text-center text-[11px] mt-3" style={{ color: "#C7C7CC" }}>
            按 ESC 或点击背景关闭
          </p>
        </div>
      </div>
    </div>
  );
}
