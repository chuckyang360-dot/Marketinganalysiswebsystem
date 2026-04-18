import { useNavigate } from "react-router-dom";

const CASES = [
  {
    industry: "家具品牌", market: "欧洲市场", title: "《新家第一天》",
    desc: "围绕搬家场景打造情绪化短剧，展示北欧风格家具在不同空间的自然融入，Hook 率提升 3.2x",
    duration: "60s", platform: "Meta & YouTube", style: "情绪流",
    img: "https://readdy.ai/api/search-image?query=elegant%20scandinavian%20minimalist%20furniture%20cozy%20living%20room%20warm%20ambient%20lighting%20cinematic%20wide%20shot%20professional%20photography%20beige%20white%20tones%20premium%20home%20decor%20advertisement%20clean%20background&width=480&height=300&seq=sdcase01&orientation=landscape",
    color: "#B45309",
  },
  {
    industry: "女装品牌", market: "TikTok 全球", title: "《第一次约会》",
    desc: "以反转剧情展现穿搭提升自信的故事，搭配女主角情绪弧线，完播率 68%，ROAS 4.8",
    duration: "45s", platform: "TikTok", style: "反转冲突",
    img: "https://readdy.ai/api/search-image?query=fashionable%20woman%20elegant%20modern%20clothing%20brand%20advertisement%20cinematic%20dramatic%20portrait%20lighting%20warm%20studio%20sophisticated%20high%20end%20fashion%20commercial%20natural%20confident%20expression%20clean%20background&width=480&height=300&seq=sdcase02&orientation=landscape",
    color: "#DC2626",
  },
  {
    industry: "美妆品牌", market: "海外种草", title: "《她的秘密》",
    desc: "悬疑风种草短剧，通过朋友追问引出产品，自然植入产品使用场景，互动率提升 210%",
    duration: "30s", platform: "Instagram Reels", style: "悬疑种草",
    img: "https://readdy.ai/api/search-image?query=beauty%20cosmetics%20luxury%20skincare%20product%20advertisement%20cinematic%20close%20up%20dramatic%20moody%20lighting%20elegant%20woman%20applying%20makeup%20premium%20brand%20commercial%20soft%20shadows%20professional%20studio&width=480&height=300&seq=sdcase03&orientation=landscape",
    color: "#047857",
  },
];

export default function SDCases() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-4">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[11px] font-semibold tracking-widest uppercase"
              style={{ background: "#F5F5F7", color: "#6E6E73", border: "1px solid #EAEAEA" }}
            >
              Case Preview
            </div>
            <h2
              className="text-3xl lg:text-4xl font-black"
              style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}
            >
              行业样例
            </h2>
          </div>
          <p className="text-[14px] max-w-xs text-right hidden md:block" style={{ color: "#8E8E93" }}>
            来自不同行业的真实短剧广告创作案例
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CASES.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${c.color}35`; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${c.color}10`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="relative w-full h-[180px] overflow-hidden" style={{ background: "#F7F8FA" }}>
                <img
                  src={c.img}
                  alt={c.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.9)", color: c.color, border: `1px solid ${c.color}30` }}
                  >
                    {c.duration}
                  </span>
                  <span
                    className="text-[10px] font-medium px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.9)", color: "#444444" }}
                  >
                    {c.style}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px]" style={{ color: "#8E8E93" }}>{c.industry}</span>
                  <span style={{ color: "#D1D1D6" }}>·</span>
                  <span className="text-[11px]" style={{ color: "#8E8E93" }}>{c.market}</span>
                  <span style={{ color: "#D1D1D6" }}>·</span>
                  <span className="text-[11px]" style={{ color: "#8E8E93" }}>{c.platform}</span>
                </div>
                <h3
                  className="text-[15px] font-bold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}
                >
                  {c.title}
                </h3>
                <p className="text-[12px] leading-relaxed" style={{ color: "#6E6E73" }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/short-drama/create")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{ background: "#1D1D1F", color: "#ffffff" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#374151"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
          >
            <i className="ri-add-circle-line text-[14px]" />
            创建我的短剧项目
          </button>
        </div>
      </div>
    </section>
  );
}
