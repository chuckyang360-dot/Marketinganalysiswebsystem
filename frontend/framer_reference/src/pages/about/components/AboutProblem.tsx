import { useEffect, useRef } from "react";
const PROBLEMS = [
  { num: "01", title: "信息碎片化", desc: "数据分散在搜索、社媒、评论、竞品中，无法形成判断", icon: "ri-puzzle-2-line", color: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.15)" },
  { num: "02", title: "分析与执行断裂", desc: "分析停留在报告，无法转化为内容或商品优化动作", icon: "ri-scissors-cut-line", color: "#7B61FF", bg: "rgba(123,97,255,0.06)", border: "rgba(123,97,255,0.15)" },
  { num: "03", title: "增长不可持续", desc: "每一次都重新开始，没有沉淀，没有复用", icon: "ri-refresh-line", color: "#0ea5e9", bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.15)" },
];
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } }, { threshold: 0.12 });
    observer.observe(el); return () => observer.disconnect();
  }, []); return ref;
}
export default function AboutProblem() {
  const ref = useReveal();
  return (
    <section className="w-full py-28" style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#7B61FF" }}>Problem</p>
          <h2 className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-6" style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.4vw, 44px)", maxWidth: "640px", color: "#111111" }}>
            问题从来不是数据不够，<br />而是决策无法落地
          </h2>
          <p className="mb-14" style={{ fontSize: "15px", color: "#888888", maxWidth: "520px", lineHeight: "1.85" }}>工具堆了一桌子，但团队每次增长决策仍然靠感觉，靠开会。根本原因是三件事同时没有解决：</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROBLEMS.map((p) => (
              <div key={p.num} className="rounded-2xl p-7 flex flex-col gap-4" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: "#ffffff", border: `1px solid ${p.border}` }}>
                    <i className={`${p.icon} text-[18px]`} style={{ color: p.color }} />
                  </div>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: p.color, opacity: 0.6 }}>{p.num}</span>
                </div>
                <div>
                  <h3 className="font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: "17px", color: "#111111" }}>{p.title}</h3>
                  <p className="text-[14px] leading-[1.75]" style={{ color: "#888888" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
