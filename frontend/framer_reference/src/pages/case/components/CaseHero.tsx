import { useEffect, useRef } from "react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function CaseHero() {
  const ref = useReveal();
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#ffffff", minHeight: "60vh", display: "flex", alignItems: "center", paddingTop: "96px" }}>
      <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF)" }} />
      <div className="relative z-10 w-full mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 0.75s ease, transform 0.75s ease" }}>
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-medium"
              style={{ color: "#7B61FF", border: "1px solid rgba(123,97,255,0.2)", background: "rgba(123,97,255,0.07)" }}>
              <span className="w-1 h-1 rounded-full bg-violet-500 inline-block" />
              Cases · GlobalPulseAI
            </span>
          </div>
          <h1 className="font-extrabold leading-[1.08] tracking-[-0.035em] mb-7"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(34px, 5vw, 64px)", maxWidth: "820px", color: "#111111" }}>
            不是更多数据，
            <br />
            <span style={{ background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              而是更快得到结果
            </span>
          </h1>
          <p className="leading-[1.9] mb-8" style={{ fontSize: "clamp(15px, 1.1vw, 18px)", color: "#888888", maxWidth: "560px" }}>
            每一个案例，都是从"问题 → 判断 → 动作 → 结果"的完整链路。
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ border: "1px solid rgba(123,97,255,0.18)", background: "rgba(123,97,255,0.05)" }}>
            <i className="ri-eye-line text-[15px]" style={{ color: "#7B61FF" }} />
            <span className="text-[14px]" style={{ color: "#888888" }}>
              我们不展示"数据有多复杂"，只展示"增长是如何发生的"
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-8 mt-12">
            {[{ value: "3×", label: "平均 CTR 提升" }, { value: "5×", label: "内容产出效率" }, { value: "100%", label: "问题→结果闭环" }].map((stat) => (
              <div key={stat.label}>
                <div className="font-extrabold leading-none mb-1"
                  style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {stat.value}
                </div>
                <div className="text-[12px]" style={{ color: "#888888" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
