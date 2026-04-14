import { useEffect, useRef } from "react";
const AUDIENCES = [
  { icon: "ri-store-3-line", title: "电商出海团队", color: "#0ea5e9", bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.15)", points: ["需要优化商品与转化", "依赖数据与评论判断市场"] },
  { icon: "ri-code-box-line", title: "SaaS / 产品团队", color: "#7B61FF", bg: "rgba(123,97,255,0.06)", border: "rgba(123,97,255,0.15)", points: ["需要找到增长切入口", "需要内容与产品协同"] },
  { icon: "ri-megaphone-line", title: "内容营销团队", color: "#fb923c", bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.15)", points: ["需要稳定输出内容", "需要从\"感觉\"转向\"数据驱动\""] },
];
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.opacity="1"; el.style.transform="translateY(0)"; } }, { threshold: 0.1 }); obs.observe(el); return () => obs.disconnect(); }, []);
  return ref;
}
export default function AboutAudience() {
  const ref = useReveal();
  return (
    <section className="w-full py-28" style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#7B61FF" }}>Who we serve</p>
          <h2 className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-6" style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.4vw, 44px)", maxWidth: "640px", color: "#111111" }}>适用于真正需要增长结果的团队</h2>
          <p className="mb-14" style={{ fontSize: "15px", color: "#888888", maxWidth: "500px", lineHeight: "1.85" }}>不是适合所有人。适合那些已经意识到，问题不在于获取更多信息，而在于如何快速行动的团队。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-2xl p-7 flex flex-col gap-5" style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                <div className="w-11 h-11 flex items-center justify-center rounded-xl" style={{ background: "#ffffff", border: `1px solid ${a.border}` }}>
                  <i className={`${a.icon} text-[20px]`} style={{ color: a.color }} />
                </div>
                <h3 className="font-bold" style={{ fontFamily: "'Syne', sans-serif", fontSize: "17px", color: "#111111" }}>{a.title}</h3>
                <ul className="flex flex-col gap-2.5">
                  {a.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                      <span className="text-[14px] leading-[1.7]" style={{ color: "#888888" }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
