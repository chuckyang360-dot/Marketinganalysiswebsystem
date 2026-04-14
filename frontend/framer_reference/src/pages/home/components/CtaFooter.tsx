import { useNavigate } from "react-router-dom";

const footerLinks = {
  产品: ["营销分析", "内容制作", "商品分析", "工作流沉淀", "定价"],
  资源: ["使用文档", "案例研究", "博客", "API 接口"],
  公司: ["关于我们", "加入团队", "联系我们", "合作伙伴"],
};

const socialIcons = [
  { icon: "ri-twitter-x-line", label: "X" },
  { icon: "ri-linkedin-line", label: "LinkedIn" },
  { icon: "ri-github-line", label: "GitHub" },
  { icon: "ri-youtube-line", label: "YouTube" },
];

const stats = [
  { value: "2,000+", label: "团队正在使用" },
  { value: "50M+", label: "信号已分析" },
  { value: "94%", label: "洞察准确率" },
  { value: "< 3 分钟", label: "平均输出时间" },
];

export default function CtaFooter() {
  const navigate = useNavigate();
  return (
    <>
      {/* Stats bar */}
      <section className="relative py-14 overflow-hidden" style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
            {stats.map((s, i) => (
              <div key={s.label} className={`text-center ${i < stats.length - 1 ? "lg:border-r lg:border-[#EAEAEA]" : ""}`}>
                <p
                  className="text-[34px] lg:text-[42px] font-extrabold mb-1 tracking-[-0.03em]"
                  style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {s.value}
                </p>
                <p className="text-[13px]" style={{ color: "#888888" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden" style={{ background: "#ffffff", borderTop: "1px solid #EAEAEA" }}>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 cursor-default"
            style={{ background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.18)" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: "#7B61FF" }}>
              全球 2,000+ 出海团队正在使用 GlobalPulseAI 增长
            </span>
          </span>

          <h2
            className="font-extrabold tracking-[-0.04em] leading-[1.05] mb-6"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 4.5vw, 56px)", color: "#111111" }}
          >
            现在就开始把信号{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7B61FF, #5B8CFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              转化为增长
            </span>
          </h2>

          <p className="text-[17px] mb-3 max-w-[460px] mx-auto leading-relaxed font-semibold" style={{ color: "#111111" }}>
            你的竞争对手已经在这样做了。
          </p>
          <p className="text-[15px] mb-12 max-w-[420px] mx-auto leading-relaxed" style={{ color: "#888888" }}>
            每一天没有真实市场情报，就是他们拉开差距的一天。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-7">
            <button
              onClick={() => navigate("/workspace")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white cursor-pointer whitespace-nowrap transition-all duration-200 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
            >
              <i className="ri-dashboard-line text-[15px]" />进入工作台
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
              style={{ color: "#444444", border: "1px solid #EAEAEA", background: "#ffffff" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC";
                (e.currentTarget as HTMLElement).style.color = "#111111";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA";
                (e.currentTarget as HTMLElement).style.color = "#444444";
              }}
            >
              查看定价<i className="ri-arrow-right-line text-[14px]" />
            </button>
          </div>

          <p className="text-[12px] tracking-wide" style={{ color: "#AAAAAA" }}>
            无需信用卡 &nbsp;·&nbsp; 7 天免费试用 &nbsp;·&nbsp; 随时取消
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}
                >
                  <i className="ri-global-line text-white text-[15px]" />
                </div>
                <span className="font-bold text-[17px] tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>
                  GlobalPulse
                  <span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    AI
                  </span>
                </span>
              </div>
              <p className="text-[13px] leading-relaxed max-w-[260px] mb-6" style={{ color: "#888888" }}>
                面向出海团队的 AI 营销与商品增长工作台。把市场信号转化为可扩展的增长。
              </p>
              <div className="flex items-center gap-2.5">
                {socialIcons.map((s) => (
                  <a
                    key={s.icon}
                    href="#"
                    aria-label={s.label}
                    className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200"
                    style={{ border: "1px solid #EAEAEA", color: "#888888", background: "#ffffff" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.4)";
                      (e.currentTarget as HTMLElement).style.color = "#7B61FF";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA";
                      (e.currentTarget as HTMLElement).style.color = "#888888";
                    }}
                  >
                    <i className={`${s.icon} text-[13px]`} />
                  </a>
                ))}
              </div>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "#888888" }}>{title}</p>
                <ul className="space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-[13px] transition-colors duration-200 cursor-pointer"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid #EAEAEA", paddingTop: "28px" }}
          >
            <p className="text-[12px]" style={{ color: "#AAAAAA" }}>&copy; 2025 GlobalPulseAI. 保留所有权利。</p>
            <div className="flex items-center gap-5">
              {["隐私政策", "服务条款", "Cookie 设置"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[12px] cursor-pointer whitespace-nowrap transition-colors duration-200"
                  style={{ color: "#AAAAAA" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#444444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AAAAAA"; }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
