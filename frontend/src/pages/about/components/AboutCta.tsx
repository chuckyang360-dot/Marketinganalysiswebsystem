import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

export default function AboutCta() {
  const navigate = useNavigate();
  const ref = useReveal();
  return (
    <section className="w-full py-32 relative overflow-hidden" style={{ background: "#ffffff", borderTop: "1px solid #EAEAEA" }}>
      <div
        className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, #7B61FF, #5B8CFF, transparent)" }}
      />
      <div className="relative z-10 mx-auto px-6 lg:px-10 text-center" style={{ maxWidth: "680px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <h2
            className="font-extrabold leading-[1.1] tracking-[-0.03em] mb-5"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.8vw, 48px)", color: "#111111" }}
          >
            如果你已经厌倦了
            <br />
            <span
              style={{
                background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              "看报告"
            </span>
          </h2>
          <p className="mb-10 leading-[1.85]" style={{ fontSize: "clamp(14px, 1vw, 16px)", color: "#888888" }}>
            可以试试，让分析直接变成增长
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/workspace")}
              className="inline-flex items-center gap-2 font-semibold text-white whitespace-nowrap cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:opacity-90"
              style={{ fontSize: "15px", padding: "13px 30px", borderRadius: "12px", background: "linear-gradient(135deg, #7B61FF 0%, #5B8CFF 100%)" }}
            >
              <i className="ri-dashboard-line text-[14px]" />
              进入工作台
            </button>
            <button
              onClick={() => navigate("/product")}
              className="inline-flex items-center gap-2 font-medium whitespace-nowrap cursor-pointer transition-all duration-200"
              style={{ fontSize: "15px", padding: "13px 30px", borderRadius: "12px", color: "#888888", border: "1px solid #EAEAEA", background: "#ffffff" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#CCCCCC";
                e.currentTarget.style.color = "#111111";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#EAEAEA";
                e.currentTarget.style.color = "#888888";
              }}
            >
              查看产品
              <i className="ri-arrow-right-line text-[13px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
