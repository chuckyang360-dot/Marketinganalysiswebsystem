import { useState } from "react";
import GeneratingOverlay from "./GeneratingOverlay";

interface GenerationControlsData {
  types: Array<{ id: string; label: string; icon: string; selected: boolean }>;
  styles: string[];
  platforms: Array<{ id: string; label: string; icon: string }>;
}

interface GenerationControlsProps {
  data: GenerationControlsData;
  onGenerate?: () => void;
}

export default function GenerationControls({ data, onGenerate }: GenerationControlsProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    data.types.filter((t) => t.selected).map((t) => t.id)
  );
  const [selectedStyle, setSelectedStyle] = useState<string>(data.styles[0]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "xiaohongshu"]);
  const [generating, setGenerating] = useState(false);

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setGenerating(true);
  };

  const handleOverlayComplete = () => {
    setGenerating(false);
    onGenerate?.();
  };

  return (
    <section className="w-full px-6 lg:px-10 py-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Section title */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #7B61FF, #5B8CFF)" }} />
          <h3 className="text-[16px] font-bold" style={{ color: "#111111" }}>生成控制</h3>
          <span className="text-[11px]" style={{ color: "#AAAAAA" }}>— 定制你的内容方案</span>
        </div>

        <div
          className="relative rounded-2xl p-6"
          style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
        >
          {/* Generating overlay */}
          <GeneratingOverlay visible={generating} onComplete={handleOverlayComplete} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content types */}
            <div>
              <p className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#111111" }}>
                <i className="ri-layout-grid-line text-[12px]" style={{ color: "#7B61FF" }} />
                生成类型
              </p>
              <div className="flex flex-col gap-2">
                {data.types.map((type) => {
                  const selected = selectedTypes.includes(type.id);
                  return (
                    <div
                      key={type.id}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                      style={{
                        background: selected ? "rgba(123,97,255,0.06)" : "#F7F8FA",
                        border: `1px solid ${selected ? "rgba(123,97,255,0.2)" : "transparent"}`,
                      }}
                      onClick={() => toggleType(type.id)}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                        style={{
                          background: selected ? "linear-gradient(135deg, #7B61FF, #5B8CFF)" : "#EAEAEA",
                        }}
                      >
                        {selected && <i className="ri-check-line text-white text-[10px]" />}
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i className={`${type.icon} text-[13px]`} style={{ color: selected ? "#7B61FF" : "#888888" }} />
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: selected ? "#111111" : "#888888" }}>
                        {type.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Style selection */}
            <div>
              <p className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#111111" }}>
                <i className="ri-palette-line text-[12px]" style={{ color: "#fb923c" }} />
                内容风格
              </p>
              <div className="flex flex-col gap-2">
                {data.styles.map((style) => {
                  const styleConfig: Record<string, { icon: string; desc: string; color: string }> = {
                    "干货": { icon: "ri-book-open-line", desc: "数据驱动，专业可信", color: "#3b82f6" },
                    "情绪": { icon: "ri-emotion-line", desc: "共鸣优先，情感共情", color: "#ef4444" },
                    "对比": { icon: "ri-scales-line", desc: "强对比，引发好奇", color: "#10b981" },
                  };
                  const cfg = styleConfig[style] ?? { icon: "ri-star-line", desc: "", color: "#7B61FF" };
                  const selected = selectedStyle === style;
                  return (
                    <div
                      key={style}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                      style={{
                        background: selected ? `${cfg.color}0a` : "#F7F8FA",
                        border: `1px solid ${selected ? `${cfg.color}30` : "transparent"}`,
                      }}
                      onClick={() => setSelectedStyle(style)}
                    >
                      <div
                        className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                        style={{ background: selected ? `${cfg.color}15` : "#EAEAEA" }}
                      >
                        <i className={`${cfg.icon} text-[12px]`} style={{ color: selected ? cfg.color : "#AAAAAA" }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>{style}</p>
                        <p className="text-[11px]" style={{ color: "#888888" }}>{cfg.desc}</p>
                      </div>
                      {selected && (
                        <div className="ml-auto w-4 h-4 flex items-center justify-center rounded-full"
                          style={{ background: cfg.color }}>
                          <i className="ri-check-line text-white text-[9px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform selection */}
            <div>
              <p className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#111111" }}>
                <i className="ri-global-line text-[12px]" style={{ color: "#10b981" }} />
                目标平台
              </p>
              <div className="flex flex-col gap-2">
                {data.platforms.map((platform) => {
                  const pColors: Record<string, string> = {
                    tiktok: "#010101",
                    xiaohongshu: "#FF2442",
                    youtube: "#FF0000",
                    x: "#111111",
                  };
                  const color = pColors[platform.id] ?? "#888";
                  const selected = selectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                      style={{
                        background: selected ? `${color}08` : "#F7F8FA",
                        border: `1px solid ${selected ? `${color}20` : "transparent"}`,
                      }}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <div
                        className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                        style={{ background: selected ? `${color}15` : "#EAEAEA" }}
                      >
                        <i className={`${platform.icon} text-[13px]`} style={{ color: selected ? color : "#AAAAAA" }} />
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: "#111111" }}>{platform.label}</span>
                      {selected && (
                        <div className="ml-auto w-4 h-4 flex items-center justify-center rounded-full"
                          style={{ background: color }}>
                          <i className="ri-check-line text-white text-[9px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid #EAEAEA" }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#111111" }}>
                  已选择 <span style={{ color: "#7B61FF" }}>{selectedTypes.length}</span> 种类型 ·{" "}
                  <span style={{ color: "#7B61FF" }}>{selectedPlatforms.length}</span> 个平台
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#888888" }}>
                  预计生成 {selectedTypes.length * selectedPlatforms.length * 2} 个内容资产
                </p>
              </div>
              <button
                className="flex items-center gap-2.5 px-8 py-3 rounded-xl font-semibold text-[14px] text-white cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #7B61FF, #5B8CFF)",
                  opacity: generating ? 0.5 : 1,
                  pointerEvents: generating ? "none" : "auto",
                }}
                onClick={handleGenerate}
              >
                <i className="ri-magic-line text-[14px]" />
                一键生成同款内容
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
