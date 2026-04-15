import { useState, useEffect, useRef } from "react";
import type { MarketingResultData } from "@/mocks/marketingResult";

interface Props {
  data: MarketingResultData;
}

function AnimatedScore({ target, color }: { target: number; color: string }) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target]);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (current / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: "140px", height: "140px" }}>
      <svg width="140" height="140" viewBox="0 0 140 140" className="absolute inset-0">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#F0F0F0" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className="text-[40px] font-black leading-none" style={{ color, fontFamily: "'Syne', sans-serif" }}>
          {current}
        </span>
        <span className="text-[11px] font-medium mt-0.5" style={{ color: "#AAAAAA" }}>增长评分</span>
      </div>
    </div>
  );
}

export default function GrowthDecision({ data }: Props) {
  const { growth } = data;

  return (
    <section className="w-full px-6 lg:px-10 pt-8 pb-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Main Card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>

          {/* Top label bar */}
          <div className="flex items-center justify-between px-6 py-3"
            style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFBFF" }}>
            <div className="flex items-center gap-2">
              <i className="ri-bar-chart-2-line text-[14px]" style={{ color: "#7B61FF" }} />
              <span className="text-[12px] font-semibold" style={{ color: "#444444" }}>增长结论</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
                Growth Decision
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "#AAAAAA" }}>关键词：</span>
              <span className="text-[12px] font-semibold" style={{ color: "#333333" }}>{data.keyword}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "#CCCCCC" }} />
              <span className="text-[11px]" style={{ color: "#AAAAAA" }}>{data.industry}</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-0">
            {/* Left: Score */}
            <div className="lg:w-[280px] shrink-0 flex flex-col items-center justify-center p-8 gap-5"
              style={{ borderRight: "1px solid #F0F0F0" }}>
              <AnimatedScore target={growth.score} color={growth.verdictColor} />
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[16px] font-bold"
                  style={{ background: growth.verdictBg, color: growth.verdictColor }}>
                  <i className="ri-checkbox-circle-fill text-[16px]" />
                  {growth.verdict}
                </span>
              </div>
            </div>

            {/* Right: Summary + Metrics */}
            <div className="flex-1 p-6 flex flex-col gap-5">
              {/* Summary */}
              <div>
                <p className="text-[20px] font-bold leading-snug" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>
                  {growth.summary}
                </p>
                <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#666666" }}>
                  {growth.explanation}
                </p>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {growth.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl px-4 py-3 flex flex-col gap-1.5"
                    style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "#888888" }}>{m.label}</span>
                      <i className={`${m.trend === "up" ? "ri-arrow-up-line" : m.trend === "down" ? "ri-arrow-down-line" : "ri-subtract-line"} text-[11px]`}
                        style={{ color: m.color }} />
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Insight banner */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.15)" }}>
                <i className="ri-lightbulb-line text-[14px] mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                <p className="text-[12px] leading-relaxed" style={{ color: "#444" }}>
                  <strong style={{ color: "#16a34a" }}>核心机会：</strong>
                  TikTok 平台降噪类内容仍处于增长初期，竞争密度低于 YouTube，是当前切入成本最低的渠道。建议优先在 TikTok 测试内容方向，再决定是否投入 SEO。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
