import { useEffect, useRef } from "react";

export interface CaseStep { label: string; content: string | string[]; icon: string; color: string; }
export interface CaseData {
  index: number; tags: string[]; title: string; subtitle: string; steps: CaseStep[];
  mockCard: { before: { label: string; value: string }[]; after: { label: string; value: string }[] };
  reversed?: boolean;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function MockResultCard({ before, after }: CaseData["mockCard"]) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
      <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#EAEAEA" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#EAEAEA" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#EAEAEA" }} />
        </div>
        <span className="text-[11px] font-medium ml-2" style={{ color: "#AAAAAA" }}>GlobalPulseAI · 分析报告</span>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>优化前</span>
          </div>
          <div className="flex flex-col gap-2">
            {before.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-[12px]" style={{ color: "#888888" }}>{item.label}</span>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: "#ef4444" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "#EAEAEA" }} />
          <i className="ri-arrow-down-line text-[12px]" style={{ color: "#7B61FF" }} />
          <div className="flex-1 h-px" style={{ background: "#EAEAEA" }} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: "rgba(5,150,105,0.07)", color: "#059669", border: "1px solid rgba(5,150,105,0.18)" }}>优化后</span>
          </div>
          <div className="flex flex-col gap-2">
            {after.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-[12px]" style={{ color: "#888888" }}>{item.label}</span>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: "#059669" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const STEP_STYLES: Record<string, { bg: string; border: string }> = {
  problem: { bg: "rgba(239,68,68,0.04)", border: "rgba(239,68,68,0.12)" },
  insight: { bg: "rgba(251,146,60,0.04)", border: "rgba(251,146,60,0.12)" },
  action: { bg: "rgba(123,97,255,0.04)", border: "rgba(123,97,255,0.12)" },
  result: { bg: "rgba(5,150,105,0.04)", border: "rgba(5,150,105,0.15)" },
};

export default function CaseStudy({ data }: { data: CaseData }) {
  const ref = useReveal();
  return (
    <section className="w-full py-24" style={{ background: data.index % 2 === 0 ? "#ffffff" : "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-[11px] font-bold tabular-nums" style={{ color: "#CCCCCC", fontFamily: "'Syne', sans-serif" }}>
              Case {String(data.index).padStart(2, "0")}
            </span>
            <span className="w-px h-3" style={{ background: "#EAEAEA" }} />
            {data.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.18)", color: "#7B61FF" }}>
                {tag}
              </span>
            ))}
          </div>
          <h2 className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-3"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 3vw, 38px)", maxWidth: "600px", color: "#111111" }}>
            {data.title}
          </h2>
          <p className="mb-10" style={{ fontSize: "14px", color: "#888888", maxWidth: "480px", lineHeight: "1.8" }}>{data.subtitle}</p>
          <div className={`flex flex-col lg:flex-row gap-8 items-start ${data.reversed ? "lg:flex-row-reverse" : ""}`}>
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {data.steps.map((step, i) => {
                const key = ["problem", "insight", "action", "result"][i] ?? "problem";
                const style = STEP_STYLES[key];
                return (
                  <div key={step.label} className="rounded-xl p-5 flex gap-4"
                    style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                      style={{ background: "#ffffff", border: `1px solid ${style.border}` }}>
                      <i className={`${step.icon} text-[15px]`} style={{ color: step.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: step.color }}>{step.label}</div>
                      {typeof step.content === "string" ? (
                        <p className="text-[14px] leading-[1.75]" style={{ color: "#888888" }}>{step.content}</p>
                      ) : (
                        <ul className="flex flex-col gap-1.5">
                          {step.content.map((line) => (
                            <li key={line} className="flex items-start gap-2">
                              <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: step.color }} />
                              <span className="text-[14px] leading-[1.75]" style={{ color: "#888888" }}>{line}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="w-full lg:w-[320px] shrink-0">
              <MockResultCard before={data.mockCard.before} after={data.mockCard.after} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
