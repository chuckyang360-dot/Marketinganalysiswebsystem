import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SDSharedNav from "@/pages/short-drama/components/SDSharedNav";
import RegenOverlay, { RegenPhase } from "@/pages/short-drama/step3/components/RegenOverlay";
import AssetLightbox, { LightboxItem } from "@/pages/short-drama/step3/components/AssetLightbox";

type TabType = "characters" | "scenes" | "assets";

const CHARACTERS = [
  {
    id: 1, name: "林晓", role: "主角",
    desc: "26岁独立设计师，刚搬入新公寓，性格细腻、有品位，内心渴望建立属于自己的生活空间",
    tags: ["情绪型演员", "写实风格", "25-30岁女性"],
    voice: "温柔知性",
    img: "https://readdy.ai/api/search-image?query=young%20chinese%20professional%20woman%20confident%20elegant%20modern%20outfit%20neutral%20expression%20studio%20portrait%20clean%20white%20background%20cinematic%20lighting%20lifestyle%20advertisement%20commercial%20photography%20realistic&width=200&height=260&seq=char01&orientation=portrait",
  },
  {
    id: 2, name: "Sarah", role: "朋友/配角",
    desc: "林晓的闺蜜，活泼外向，是剧情中重要的情绪反馈角色，负责触发 Twist 段落的高光反应",
    tags: ["配角", "欧洲风格", "自然表演"],
    voice: "活泼亮丽",
    img: "https://readdy.ai/api/search-image?query=european%20young%20woman%20friend%20casual%20cheerful%20genuine%20smile%20natural%20lifestyle%20portrait%20warm%20lighting%20clean%20background%20commercial%20advertisement%20photography%20authentic%20expression&width=200&height=260&seq=char02&orientation=portrait",
  },
];

const SCENES = [
  {
    id: 101, name: "空旷公寓", type: "室内 · 夜晚",
    desc: "全空的新公寓，只有地板和窗帘，冷白色调，强调孤独感，对应 Hook 段落",
    img: "https://readdy.ai/api/search-image?query=empty%20minimalist%20apartment%20interior%20night%20cold%20white%20light%20bare%20wooden%20floor%20large%20windows%20city%20lights%20outside%20cinematic%20lonely%20atmosphere%20wide%20angle%20shot%20realistic%20photography&width=320&height=200&seq=scene01&orientation=landscape",
  },
  {
    id: 102, name: "家居展厅", type: "室内 · 日间",
    desc: "北欧风格家具展厅，大量自然光，产品展示区，对应 Conflict 产品探索段落",
    img: "https://readdy.ai/api/search-image?query=scandinavian%20furniture%20showroom%20interior%20natural%20daylight%20wooden%20furniture%20display%20clean%20bright%20minimalist%20lifestyle%20store%20wide%20shot%20professional%20photography%20elegant%20retail%20space&width=320&height=200&seq=scene02&orientation=landscape",
  },
  {
    id: 103, name: "完整新家", type: "室内 · 黄金时段",
    desc: "完成布置的温暖公寓，暖橙色调，北欧家具全貌，对应 Resolution 情绪高潮",
    img: "https://readdy.ai/api/search-image?query=cozy%20nordic%20home%20interior%20golden%20hour%20light%20warm%20wooden%20furniture%20complete%20living%20room%20atmospheric%20lifestyle%20photography%20cinematic%20amber%20tones%20elegant%20comfortable%20premium%20home%20decor&width=320&height=200&seq=scene03&orientation=landscape",
  },
];

const PRODUCT_ASSETS = [
  {
    id: 201, name: "Fjord 实木餐桌", placement: "餐厅主视觉", cameraHint: "45° 俯拍 + 特写木纹",
    img: "https://readdy.ai/api/search-image?query=scandinavian%20natural%20wood%20dining%20table%20clean%20white%20background%20product%20photography%20oak%20grain%20detail%20minimalist%20nordic%20design%20premium%20furniture%20studio%20lighting&width=240&height=180&seq=prod01&orientation=landscape",
  },
  {
    id: 202, name: "Lund 布艺沙发", placement: "客厅焦点", cameraHint: "正面全景 + 材质特写",
    img: "https://readdy.ai/api/search-image?query=modern%20scandinavian%20fabric%20sofa%20clean%20background%20product%20shot%20linen%20texture%20nordic%20minimalist%20furniture%20professional%20studio%20photography%20warm%20light%20elegant&width=240&height=180&seq=prod02&orientation=landscape",
  },
  {
    id: 203, name: "Birch 落地灯", placement: "情绪烘托道具", cameraHint: "逆光剪影 + 氛围",
    img: "https://readdy.ai/api/search-image?query=minimalist%20scandinavian%20floor%20lamp%20natural%20wood%20base%20white%20shade%20product%20photography%20clean%20background%20nordic%20design%20warm%20ambient%20light%20elegant%20home%20decor&width=240&height=180&seq=prod03&orientation=landscape",
  },
];

const TABS: Array<{ key: TabType; label: string; count: number; icon: string }> = [
  { key: "characters", label: "角色", count: CHARACTERS.length, icon: "ri-user-star-line" },
  { key: "scenes", label: "场景", count: SCENES.length, icon: "ri-landscape-line" },
  { key: "assets", label: "产品资产", count: PRODUCT_ASSETS.length, icon: "ri-archive-line" },
];

export default function Step3Page() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("characters");
  const [regenPhases, setRegenPhases] = useState<Record<number, RegenPhase>>({});
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const handleRegenerate = useCallback((id: number) => {
    setRegenPhases((p) => ({ ...p, [id]: "analyzing" }));
    setTimeout(() => setRegenPhases((p) => ({ ...p, [id]: "rendering" })), 900);
    setTimeout(() => setRegenPhases((p) => ({ ...p, [id]: "refining" })), 2200);
    setTimeout(() => setRegenPhases((p) => ({ ...p, [id]: "complete" })), 3200);
    setTimeout(() => {
      setRegenPhases((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }, 4000);
  }, []);

  const openCharLightbox = useCallback((char: typeof CHARACTERS[0]) => {
    setLightbox({
      img: char.img,
      name: char.name,
      subtitle: char.role,
      desc: char.desc,
      tags: char.tags,
      orientation: "portrait",
      meta: [
        { icon: "ri-mic-line", label: "音色风格", value: char.voice },
        { icon: "ri-film-line", label: "出镜片段", value: "Segment 1 · Segment 3" },
        { icon: "ri-palette-line", label: "视觉风格", value: "写实电影感 · 日光白平衡" },
      ],
    });
  }, []);

  const openSceneLightbox = useCallback((scene: typeof SCENES[0]) => {
    setLightbox({
      img: scene.img,
      name: scene.name,
      subtitle: scene.type,
      desc: scene.desc,
      orientation: "landscape",
      meta: [
        { icon: "ri-sun-line", label: "光线设定", value: scene.type.split("·")[1]?.trim() || "自然光" },
        { icon: "ri-film-line", label: "对应片段", value: "Segment 1" },
        { icon: "ri-camera-line", label: "推荐镜头", value: "广角全景 · 慢推" },
      ],
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <SDSharedNav currentStep={3} projectName="北欧家居欧洲市场短剧" />

      <div className="pt-14">
        {/* Page header */}
        <div
          className="px-6 lg:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderBottom: "1px solid #EAEAEA", background: "#ffffff" }}
        >
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#8E8E93" }}>STEP 03</span>
            <h1 className="text-2xl font-black mt-0.5" style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}>
              角色与场景资产
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "#8E8E93" }}>
              构建可复用的视觉资产库，统一整部短剧的视觉风格
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{ background: "#F7F8FA", color: "#444444", border: "1px solid #EAEAEA" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAEAEA"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
          >
            <i className="ri-refresh-line text-[12px]" />
            全部重新生成
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 lg:px-10 pt-5 pb-0">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F5F5F7", border: "1px solid #EAEAEA" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  background: activeTab === tab.key ? "#ffffff" : "transparent",
                  color: activeTab === tab.key ? "#1D1D1F" : "#8E8E93",
                  border: activeTab === tab.key ? "1px solid #EAEAEA" : "1px solid transparent",
                  boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <i className={`${tab.icon} text-[13px]`} />
                {tab.label}
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.key ? "#F5F5F7" : "#EAEAEA",
                    color: activeTab === tab.key ? "#444444" : "#8E8E93",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 lg:px-10 py-7">

          {/* ── Characters ── */}
          {activeTab === "characters" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {CHARACTERS.map((char) => {
                const phase = regenPhases[char.id];
                const isRegenerating = !!phase;
                return (
                  <div
                    key={char.id}
                    className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                  >
                    {/* Image area */}
                    <div
                      className="relative w-full h-52 overflow-hidden flex items-center justify-center group"
                      style={{ background: "#F5F5F7", cursor: isRegenerating ? "default" : "pointer" }}
                      onClick={() => { if (!isRegenerating) openCharLightbox(char); }}
                    >
                      {/* Base image — always rendered, hidden by overlay during regen */}
                      {!isRegenerating && (
                        <img src={char.img} alt={char.name} className="w-full h-full object-contain" />
                      )}

                      {/* Regen overlay */}
                      {isRegenerating && (
                        <RegenOverlay phase={phase} img={char.img} />
                      )}

                      {/* Hover magnify (only when not regenerating) */}
                      {!isRegenerating && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end justify-end p-2.5">
                          <div
                            className="w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.08)" }}
                          >
                            <i className="ri-zoom-in-line text-[12px]" style={{ color: "#1D1D1F" }} />
                          </div>
                        </div>
                      )}

                      {/* Role badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className="text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.92)", color: "#444444", border: "1px solid rgba(0,0,0,0.06)" }}
                        >
                          {char.role}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-[15px] font-bold mb-1.5" style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}>
                        {char.name}
                      </h3>
                      <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#6E6E73" }}>{char.desc}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {char.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-1 rounded-full" style={{ background: "#F5F5F7", color: "#6E6E73" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                        <i className="ri-mic-line text-[12px]" style={{ color: "#8E8E93" }} />
                        <span className="text-[11.5px]" style={{ color: "#6E6E73" }}>音色：{char.voice}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegenerate(char.id)}
                          disabled={isRegenerating}
                          className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                          style={{
                            background: isRegenerating ? "#F0F0F5" : "#F7F8FA",
                            color: isRegenerating ? "#AEAEB2" : "#444444",
                            border: "1px solid #EAEAEA",
                          }}
                          onMouseEnter={(e) => { if (!isRegenerating) (e.currentTarget as HTMLElement).style.background = "#EAEAEA"; }}
                          onMouseLeave={(e) => { if (!isRegenerating) (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
                        >
                          {isRegenerating
                            ? <><i className="ri-loader-4-line text-[10px] mr-1 animate-spin" />生成中...</>
                            : <><i className="ri-refresh-line text-[11px] mr-1" />重新生成</>
                          }
                        </button>
                        <button
                          onClick={() => openCharLightbox(char)}
                          className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                          style={{ background: "#1D1D1F", color: "#ffffff" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#374151"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
                        >
                          <i className="ri-zoom-in-line text-[11px] mr-1" />
                          查看详情
                        </button>
                      </div>
                      <button
                        className="w-full mt-2 py-2 rounded-lg text-[11.5px] cursor-pointer transition-all duration-200 whitespace-nowrap"
                        style={{ background: "#F7F8FA", color: "#8E8E93", border: "1.5px dashed #D1D1D6" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1D1D1F"; (e.currentTarget as HTMLElement).style.color = "#1D1D1F"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D1D1D6"; (e.currentTarget as HTMLElement).style.color = "#8E8E93"; }}
                      >
                        <i className="ri-upload-2-line text-[11px] mr-1" />
                        上传参考图
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add character card */}
              <button
                className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 min-h-[320px]"
                style={{ border: "1.5px dashed #D1D1D6", background: "#F7F8FA" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1D1D1F"; (e.currentTarget as HTMLElement).style.background = "#F5F5F7"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D1D1D6"; (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl" style={{ background: "#EAEAEA" }}>
                  <i className="ri-user-add-line text-[20px]" style={{ color: "#8E8E93" }} />
                </div>
                <span className="text-[13px]" style={{ color: "#8E8E93" }}>添加角色</span>
              </button>
            </div>
          )}

          {/* ── Scenes ── */}
          {activeTab === "scenes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SCENES.map((scene) => {
                const phase = regenPhases[scene.id];
                const isRegenerating = !!phase;
                return (
                  <div
                    key={scene.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                  >
                    <div
                      className="relative w-full h-48 overflow-hidden group"
                      style={{ background: "#F7F8FA", cursor: isRegenerating ? "default" : "pointer" }}
                      onClick={() => { if (!isRegenerating) openSceneLightbox(scene); }}
                    >
                      {!isRegenerating && (
                        <img src={scene.img} alt={scene.name} className="w-full h-full object-cover object-center" />
                      )}
                      {isRegenerating && <RegenOverlay phase={phase} img={scene.img} />}

                      {/* Hover magnify */}
                      {!isRegenerating && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/18 transition-all duration-200 flex items-end justify-end p-2.5">
                          <div
                            className="w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.08)" }}
                          >
                            <i className="ri-zoom-in-line text-[12px]" style={{ color: "#1D1D1F" }} />
                          </div>
                        </div>
                      )}

                      <span
                        className="absolute top-3 left-3 text-[10px] font-medium px-2 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.9)", color: "#444444", border: "1px solid rgba(0,0,0,0.06)" }}
                      >
                        {scene.type}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[14px] font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}>
                        {scene.name}
                      </h3>
                      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#6E6E73" }}>{scene.desc}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegenerate(scene.id)}
                          disabled={isRegenerating}
                          className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                          style={{
                            background: isRegenerating ? "#F0F0F5" : "#F7F8FA",
                            color: isRegenerating ? "#AEAEB2" : "#444444",
                            border: "1px solid #EAEAEA",
                          }}
                          onMouseEnter={(e) => { if (!isRegenerating) (e.currentTarget as HTMLElement).style.background = "#EAEAEA"; }}
                          onMouseLeave={(e) => { if (!isRegenerating) (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
                        >
                          {isRegenerating
                            ? <><i className="ri-loader-4-line text-[10px] mr-1 animate-spin" />生成中...</>
                            : <><i className="ri-refresh-line text-[11px] mr-1" />重新生成</>
                          }
                        </button>
                        <button
                          onClick={() => openSceneLightbox(scene)}
                          className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                          style={{ background: "#1D1D1F", color: "#ffffff" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#374151"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
                        >
                          <i className="ri-zoom-in-line text-[11px] mr-1" />
                          查看详情
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Product assets ── */}
          {activeTab === "assets" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {PRODUCT_ASSETS.map((asset) => {
                const phase = regenPhases[asset.id];
                const isRegenerating = !!phase;
                return (
                  <div key={asset.id} className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
                    <div className="relative w-full h-44 overflow-hidden" style={{ background: "#F7F8FA" }}>
                      {!isRegenerating && (
                        <img src={asset.img} alt={asset.name} className="w-full h-full object-cover object-center" />
                      )}
                      {isRegenerating && <RegenOverlay phase={phase} img={asset.img} />}
                    </div>
                    <div className="p-4">
                      <h3 className="text-[14px] font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}>
                        {asset.name}
                      </h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <i className="ri-camera-line text-[11px] mt-0.5" style={{ color: "#AEAEB2" }} />
                          <div>
                            <p className="text-[10px] mb-0.5" style={{ color: "#AEAEB2" }}>出镜方式</p>
                            <p className="text-[12px]" style={{ color: "#444444" }}>{asset.placement}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <i className="ri-focus-3-line text-[11px] mt-0.5" style={{ color: "#AEAEB2" }} />
                          <div>
                            <p className="text-[10px] mb-0.5" style={{ color: "#AEAEB2" }}>镜头定位</p>
                            <p className="text-[12px]" style={{ color: "#444444" }}>{asset.cameraHint}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer whitespace-nowrap transition-colors"
                          style={{ background: "#F7F8FA", color: "#444444", border: "1px solid #EAEAEA" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAEAEA"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
                        >
                          <i className="ri-edit-line text-[11px] mr-1" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleRegenerate(asset.id)}
                          disabled={isRegenerating}
                          className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer whitespace-nowrap transition-colors"
                          style={{
                            background: isRegenerating ? "#F0F0F5" : "#1D1D1F",
                            color: isRegenerating ? "#AEAEB2" : "#ffffff",
                          }}
                          onMouseEnter={(e) => { if (!isRegenerating) (e.currentTarget as HTMLElement).style.background = "#374151"; }}
                          onMouseLeave={(e) => { if (!isRegenerating) (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
                        >
                          {isRegenerating
                            ? <><i className="ri-loader-4-line text-[10px] mr-1 animate-spin" />生成中...</>
                            : <><i className="ri-refresh-line text-[11px] mr-1" />重新生成</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: "1px solid #EAEAEA" }}>
            <button
              onClick={() => navigate("/short-drama/step2")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13.5px] cursor-pointer whitespace-nowrap transition-all duration-200"
              style={{ background: "#F7F8FA", color: "#444444", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EAEAEA"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; }}
            >
              <i className="ri-arrow-left-line text-[13px]" />
              上一步
            </button>
            <button
              onClick={() => navigate("/short-drama/step4")}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap"
              style={{ background: "#1D1D1F", color: "#ffffff" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#374151"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
            >
              下一步：生成片段脚本
              <i className="ri-arrow-right-line text-[13px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AssetLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
