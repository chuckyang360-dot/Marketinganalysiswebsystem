import { useEffect, useRef } from "react";
import { BarChart3, RefreshCw, Search, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const STEPS = [
  { icon: "ri-search-eye-line", label: "找到真实需求", color: "#fb923c", desc: "从用户评论、搜索与社媒信号中提取真实诉求" },
  { icon: "ri-bar-chart-grouped-line", label: "判断趋势与竞争", color: "#7B61FF", desc: "识别市场机会窗口与竞争格局，形成判断" },
  { icon: "ri-send-plane-line", label: "转化为内容或商品动作", color: "#0ea5e9", desc: "直接输出可执行的内容方向或商品优化方案" },
  { icon: "ri-loop-right-line", label: "持续迭代", color: "#8b5cf6", desc: "所有动作沉淀为可复用的工作流，持续优化" },
];

const SUMMARY_ICON_MAP: Record<string, LucideIcon> = {
  "ri-search-eye-line": Search,
  "ri-bar-chart-grouped-line": BarChart3,
  "ri-send-plane-line": Send,
  "ri-loop-right-line": RefreshCw,
};

export default function CaseSummary() {
  const ref = useReveal();

  return (
    <section className="w-full py-28" style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#7B61FF" }}>Methodology</p>
          <h2
            className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-5"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 3.2vw, 42px)", maxWidth: "600px", color: "#111111" }}
          >
            所有案例，本质是同一件事
          </h2>
          <p className="mb-14" style={{ fontSize: "15px", color: "#888888", maxWidth: "500px", lineHeight: "1.85" }}>
            不是行业不同，而是路径相同。GlobalPulseAI 做的，是让这条路径可以复用。
          </p>
          <div className="relative">
            <div
              className="hidden lg:block absolute left-[22px] top-10 bottom-10 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(123,97,255,0.2), rgba(5,150,105,0.2))" }}
            />
            <div className="flex flex-col gap-5">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-start gap-5">
                  <div
                    className="relative z-10 w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                  >
                    {(() => {
                      const SummaryIcon = SUMMARY_ICON_MAP[step.icon];
                      return SummaryIcon ? <SummaryIcon size={17} color={step.color} strokeWidth={2} /> : null;
                    })()}
                  </div>
                  <div className="flex-1 rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: step.color }}>Step {i + 1}</span>
                      <h3 className="font-semibold" style={{ fontSize: "15px", color: "#111111" }}>{step.label}</h3>
                    </div>
                    <p className="text-[13.5px] leading-[1.75]" style={{ color: "#888888" }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
