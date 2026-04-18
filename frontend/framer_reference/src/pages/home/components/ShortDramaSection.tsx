import { useNavigate } from "react-router-dom";

export default function ShortDramaSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ background: "#0A0A0D" }}>
      {/* BG image overlay */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=dramatic%20cinematic%20film%20production%20dark%20moody%20studio%20golden%20amber%20light%20professional%20video%20shoot%20commercial%20advertisement%20creative%20director%20high%20end%20production%20set&width=1440&height=600&seq=sd_home01&orientation=landscape"
          alt=""
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0D] via-[#0A0A0D]/80 to-[#0A0A0D]/60" />
      </div>

      {/* Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-15"
        style={{ background: "radial-gradient(ellipse, #F59E0B 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[11px] font-bold tracking-widest uppercase"
              style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>
              <i className="ri-film-line text-[11px]" />
              全新模块 · ShortDrama Engine
            </div>
            <h2 className="text-3xl lg:text-5xl font-black leading-tight mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="text-white">用故事，</span>
              <br />
              <span style={{ background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                卖产品
              </span>
            </h2>
            <p className="text-base text-white/45 mb-4 leading-relaxed max-w-lg">
              为出海企业打造的 AI 短剧广告制作平台。从产品资料到剧情、角色、场景、分镜与视频，一站式完成。
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {["产品解析", "剧本生成", "角色 & 场景", "AI 视频"].map((tag) => (
                <span key={tag} className="text-[12px] px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", color: "rgba(245,158,11,0.8)", border: "1px solid rgba(245,158,11,0.18)" }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/short-drama")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
                <i className="ri-film-line text-[13px]" />
                进入短剧模块
              </button>
              <button
                onClick={() => navigate("/short-drama")}
                className="flex items-center gap-2 text-[14px] cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
                了解更多
                <i className="ri-arrow-right-line text-[13px]" />
              </button>
            </div>
          </div>

          {/* Right: Preview cards */}
          <div className="hidden lg:grid grid-cols-3 gap-3">
            {[
              { step: "01", label: "产品输入", icon: "ri-upload-cloud-2-line", color: "#F59E0B" },
              { step: "02", label: "剧本大纲", icon: "ri-file-text-line", color: "#EF4444" },
              { step: "03", label: "角色场景", icon: "ri-user-star-line", color: "#10B981" },
              { step: "04", label: "片段视频", icon: "ri-movie-2-line", color: "#A78BFA" },
              { step: "05", label: "导出结果", icon: "ri-download-cloud-line", color: "#3B82F6" },
            ].map((item, idx) => (
              <div key={item.step}
                className={`p-4 rounded-xl ${idx === 2 ? "col-span-1" : ""}`}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-7 h-7 flex items-center justify-center rounded-lg mb-2.5"
                  style={{ background: `${item.color}1a` }}>
                  <i className={`${item.icon} text-[13px]`} style={{ color: item.color }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${item.color}90` }}>
                  STEP {item.step}
                </p>
                <p className="text-[13px] font-semibold text-white/65">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
