import { useEffect, useRef } from "react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return ref;
}

const TRADITIONAL = ["数据", "分析", "报告", "讨论", "决策", "执行"];
const OUR_PATH = ["数据", "判断", "直接行动"];

export default function AboutDiff() {
  const ref = useReveal();
  return (
    <section className="w-full py-28" style={{ background: "#ffffff", borderTop: "1px solid #EAEAEA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#7B61FF" }}>Why us</p>
          <h2 className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-6"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.4vw, 44px)", maxWidth: "640px", color: "#111111" }}>
            不是更强的分析能力，<br />而是更短的路径
          </h2>
          <p className="mb-14" style={{ fontSize: "15px", color: "#888888", maxWidth: "500px", lineHeight: "1.85" }}>
            我们不试图让你"更懂"，而是让你"更快行动"。
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traditional */}
            <div className="rounded-2xl p-7" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide"
                  style={{ background: "#EAEAEA", color: "#888888", border: "1px solid #DDDDDD" }}>
                  传统路径
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {TRADITIONAL.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                      style={{ background: "#ffffff", color: "#888888", border: "1px solid #EAEAEA" }}>
                      {step}
                    </span>
                    {i < TRADITIONAL.length - 1 && (
                      <i className="ri-arrow-right-line text-[12px]" style={{ color: "#CCCCCC" }} />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px]" style={{ color: "#AAAAAA" }}>6 个环节，每一步都可能卡住</p>
            </div>
            {/* Our path */}
            <div className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: "rgba(123,97,255,0.05)", border: "1px solid rgba(123,97,255,0.2)" }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide"
                  style={{ background: "rgba(123,97,255,0.12)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.25)" }}>
                  GlobalPulseAI
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {OUR_PATH.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-[13px] font-semibold"
                      style={{
                        background: i === OUR_PATH.length - 1 ? "rgba(123,97,255,0.15)" : "#ffffff",
                        color: i === OUR_PATH.length - 1 ? "#7B61FF" : "#444444",
                        border: `1px solid ${i === OUR_PATH.length - 1 ? "rgba(123,97,255,0.3)" : "#EAEAEA"}`,
                      }}>
                      {step}
                    </span>
                    {i < OUR_PATH.length - 1 && (
                      <i className="ri-arrow-right-line text-[12px]" style={{ color: "rgba(123,97,255,0.4)" }} />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] font-medium" style={{ color: "#7B61FF" }}>3 步，直接到结果</p>
              <div className="absolute bottom-0 right-0 w-40 h-28 pointer-events-none"
                style={{ background: "radial-gradient(circle at bottom right, rgba(123,97,255,0.1) 0%, transparent 70%)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
