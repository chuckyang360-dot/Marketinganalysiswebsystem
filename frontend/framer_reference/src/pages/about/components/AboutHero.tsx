import { useEffect, useRef } from "react";

export default function AboutHero() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#ffffff", minHeight: "72vh", display: "flex", alignItems: "center", paddingTop: "96px" }}>
      <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF)" }} />
      <div className="relative z-10 w-full mx-auto px-6 lg:px-10" style={{ maxWidth: "960px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 0.75s ease, transform 0.75s ease" }}>
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-medium"
              style={{ color: "#7B61FF", border: "1px solid rgba(123,97,255,0.2)", background: "rgba(123,97,255,0.07)" }}>
              <span className="w-1 h-1 rounded-full bg-violet-500 inline-block" />
              About GlobalPulseAI
            </span>
          </div>
          <h1 className="font-extrabold leading-[1.08] tracking-[-0.035em] mb-8"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 5.2vw, 68px)", maxWidth: "780px", color: "#111111" }}>
            不是一家做工具的公司<br />
            <span style={{ background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              而是在重构增长这件事
            </span>
          </h1>
          <p className="leading-[1.9] mb-10" style={{ fontSize: "clamp(15px, 1.1vw, 18px)", color: "#888888", maxWidth: "600px" }}>
            GlobalPulseAI 不是提供更多分析工具，而是把"分析 → 内容 → 商品 → 执行"整合为一条完整的增长链路。
          </p>
          <div className="flex flex-col gap-4 mb-12" style={{ maxWidth: "540px" }}>
            <p className="text-[13px] font-medium mb-2" style={{ color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              大多数团队的问题，不是缺工具，而是——
            </p>
            {["信息很多，但无法判断", "做了分析，但没有动作", "有动作，但无法持续"].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-0.5"
                  style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)" }}>
                  <span className="text-[10px] font-bold" style={{ color: "#7B61FF" }}>{i + 1}</span>
                </div>
                <span className="text-[15px]" style={{ color: "#444444" }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ border: "1px solid rgba(123,97,255,0.18)", background: "rgba(123,97,255,0.05)" }}>
            <i className="ri-arrow-right-circle-line text-[16px]" style={{ color: "#7B61FF" }} />
            <span className="text-[14px] font-medium" style={{ color: "#444444" }}>我们做的，是让增长这件事真正"跑起来"</span>
          </div>
        </div>
      </div>
    </section>
  );
}
