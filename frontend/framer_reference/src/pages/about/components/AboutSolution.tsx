import { useEffect, useRef } from "react";
const MODULES = [
  { num: "01", title: "市场判断", desc: "从多平台信号中提取需求、趋势与竞争结构", icon: "ri-radar-line", color: "#fb923c" },
  { num: "02", title: "内容生成", desc: "直接生成可执行的选题、表达与结构", icon: "ri-quill-pen-line", color: "#7B61FF" },
  { num: "03", title: "商品优化", desc: "把商品页拆解为转化问题，并给出具体优化建议", icon: "ri-shopping-bag-3-line", color: "#0ea5e9" },
  { num: "04", title: "持续迭代", desc: "所有分析与动作沉淀在一个工作台中，持续优化", icon: "ri-loop-right-line", color: "#8b5cf6" },
];
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.opacity="1"; el.style.transform="translateY(0)"; } }, { threshold: 0.1 }); obs.observe(el); return () => obs.disconnect(); }, []);
  return ref;
}
export default function AboutSolution() {
  const ref = useReveal();
  return (
    <section className="w-full py-28" style={{ background: "#ffffff", borderTop: "1px solid #EAEAEA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#7B61FF" }}>Solution</p>
          <h2 className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-6" style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.4vw, 44px)", maxWidth: "640px", color: "#111111" }}>我们把增长拆成四个环节，<br />并让它跑通</h2>
          <p className="mb-14" style={{ fontSize: "15px", color: "#888888", maxWidth: "500px", lineHeight: "1.85" }}>不是在每个环节给你一个工具，而是把四个环节连成一条链路，输入一个问题，走完整个闭环。</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m, idx) => (
              <div key={m.num} className="relative rounded-2xl p-6 flex flex-col gap-5 overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
                {idx < MODULES.length - 1 && <div className="hidden lg:block absolute top-9 right-[-1px] w-4 h-px z-10" style={{ background: "#EAEAEA" }} />}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                    <i className={`${m.icon} text-[17px]`} style={{ color: m.color }} />
                  </div>
                  <span className="font-bold tabular-nums text-[11px]" style={{ color: "#CCCCCC" }}>{m.num}</span>
                </div>
                <div>
                  <h3 className="font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", color: "#111111" }}>{m.title}</h3>
                  <p className="text-[13.5px] leading-[1.75]" style={{ color: "#888888" }}>{m.desc}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${m.color}40, transparent)` }} />
              </div>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-2 mt-6">
            <span className="text-[12px]" style={{ color: "#AAAAAA" }}>一次输入，走完四个环节</span>
            <i className="ri-arrow-right-line text-[12px]" style={{ color: "#AAAAAA" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
