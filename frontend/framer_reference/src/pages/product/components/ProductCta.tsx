import { useNavigate } from "react-router-dom";

export default function ProductCta() {
  const navigate = useNavigate();
  return (
    <section style={{ background: "#09090B" }}>
      <div
        className="mx-auto px-6 lg:px-10 py-28 lg:py-36 text-center"
        style={{ maxWidth: "720px" }}
      >
        <h2
          className="font-bold leading-[1.15] tracking-[-0.03em] text-white mb-5"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(26px, 3.2vw, 42px)",
            fontWeight: 700,
          }}
        >
          如果分析不能带来增长，<br />那它就没有意义
        </h2>
        <p
          className="mb-10 mx-auto"
          style={{
            fontSize: "clamp(15px, 1.1vw, 16px)",
            color: "rgba(255,255,255,0.32)",
            lineHeight: 1.75,
            maxWidth: "460px",
          }}
        >
          进入工作台，从一次完整分析开始，把洞察变成动作。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 font-semibold text-[#09090B] whitespace-nowrap cursor-pointer transition-opacity duration-200 hover:opacity-85"
            style={{ fontSize: "15px", padding: "12px 28px", borderRadius: "8px", background: "#ffffff" }}
          >
            <i className="ri-dashboard-line text-[14px]" />
            进入工作台
          </button>
          <button
            className="inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-all duration-200"
            style={{
              fontSize: "15px",
              padding: "12px 28px",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
            }}
          >
            查看定价
            <i className="ri-arrow-right-line text-[13px]" />
          </button>
        </div>
      </div>

      {/* Footer bar */}
      <div
        className="mx-auto px-6 lg:px-10 py-8"
        style={{ maxWidth: "1100px", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              <i className="ri-global-line text-white text-[11px]" />
            </div>
            <span
              className="text-[13px] font-semibold text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              GlobalPulseAI
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["首页", "定价", "案例", "关于"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[12.5px] cursor-pointer transition-colors duration-150 whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)";
                }}
              >
                {item}
              </a>
            ))}
          </div>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.18)" }}>
            © 2024 GlobalPulseAI
          </p>
        </div>
      </div>
    </section>
  );
}
