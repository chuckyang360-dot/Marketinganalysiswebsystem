import type { StepFourAssetLibraryVm } from "../utils/stepFourAdapters";
import { SHORT_DRAMA_UI } from "../utils/shortDramaUiCopy";

interface AssetLibraryProps {
  library: StepFourAssetLibraryVm;
  onDragAsset?: (type: string, name: string) => void;
}

export function StepFourAssetLibrary({ library, onDragAsset: _onDragAsset }: AssetLibraryProps) {
  const { characters: CHAR_ASSETS, scenes: SCENE_ASSETS, products: PRODUCT_ASSETS } = library;
  const isEmpty =
    CHAR_ASSETS.length === 0 && SCENE_ASSETS.length === 0 && PRODUCT_ASSETS.length === 0;

  return (
    <aside
      className="flex flex-col w-56 shrink-0 overflow-y-auto"
      style={{ background: "#F7F8FA", borderRight: "1px solid #EAEAEA" }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#8E8E93" }}>
            资产库
          </h3>
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer transition-colors duration-150"
            style={{ color: "#8E8E93" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#EAEAEA";
              (e.currentTarget as HTMLElement).style.color = "#1D1D1F";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#8E8E93";
            }}
          >
            <i className="ri-add-line text-[14px]" />
          </button>
        </div>

        {isEmpty && (
          <p className="text-[10.5px] leading-relaxed mb-4" style={{ color: "#AEAEB2" }}>
            {SHORT_DRAMA_UI.stepFour.assetLibraryEmpty}
          </p>
        )}

        {/* Characters */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#AEAEB2" }}>
            <i className="ri-user-star-line text-[10px]" style={{ color: "#B45309" }} />
            角色 ({CHAR_ASSETS.length})
          </p>
          <div className="space-y-1">
            {CHAR_ASSETS.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 p-2 rounded-lg cursor-grab transition-all duration-150"
                style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                draggable
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid #B45309";
                  (e.currentTarget as HTMLElement).style.background = "rgba(180,83,9,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid #EAEAEA";
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                }}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                  {c.img ? (
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#ECEDEF]" />
                  )}
                </div>
                <div>
                  <p className="text-[11.5px] font-medium" style={{ color: "#1D1D1F" }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenes */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#AEAEB2" }}>
            <i className="ri-landscape-line text-[10px]" style={{ color: "#047857" }} />
            场景 ({SCENE_ASSETS.length})
          </p>
          <div className="space-y-1">
            {SCENE_ASSETS.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between p-2 rounded-lg cursor-grab transition-all duration-150"
                style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                draggable
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid #047857";
                  (e.currentTarget as HTMLElement).style.background = "rgba(4,120,87,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid #EAEAEA";
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                }}
              >
                <div>
                  <p className="text-[11.5px] font-medium" style={{ color: "#1D1D1F" }}>{s.name}</p>
                  <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{s.type}</p>
                </div>
                <i className="ri-landscape-line text-[12px]" style={{ color: "#D1D1D6" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#AEAEB2" }}>
            <i className="ri-archive-line text-[10px]" style={{ color: "#DC2626" }} />
            产品资产 ({PRODUCT_ASSETS.length})
          </p>
          <div className="space-y-1">
            {PRODUCT_ASSETS.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between p-2 rounded-lg cursor-grab transition-all duration-150"
                style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                draggable
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid #DC2626";
                  (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid #EAEAEA";
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                }}
              >
                <div>
                  <p className="text-[11.5px] font-medium" style={{ color: "#1D1D1F" }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{p.type}</p>
                </div>
                <i className="ri-archive-line text-[12px]" style={{ color: "#D1D1D6" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
