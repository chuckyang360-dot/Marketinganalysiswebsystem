import { useState } from "react";
import type { EcomResultData } from "@/mocks/ecomResult";

interface Props {
  data: EcomResultData;
}

interface FunnelStage {
  key: "ctr" | "conversion" | "retention";
  icon: string;
  iconColor: string;
  iconBg: string;
  stepLabel: string;
  question: string;
  score: number;
  verdict: string;
  problems: string[];
  impact: string;
  suggestions: string[];
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#EAEAEA" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[12px] font-semibold w-6 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#EAEAEA" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${circ * score / 100} ${circ}`}
        transform="rotate(-90 26 26)" />
      <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#16a34a";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}

export default function FunnelAnalysis({ data }: Props) {
  const { funnel } = data;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const stages: FunnelStage[] = [
    {
      key: "ctr",
      icon: "ri-cursor-line",
      iconColor: "#7B61FF",
      iconBg: "rgba(123,97,255,0.08)",
      stepLabel: "A · 曝光 / CTR",
      question: "用户会不会点击？",
      score: funnel.ctr.score,
      verdict: funnel.ctr.verdict,
      problems: funnel.ctr.problems,
      impact: funnel.ctr.impact,
      suggestions: funnel.ctr.suggestions,
    },
    {
      key: "conversion",
      icon: "ri-shopping-cart-2-line",
      iconColor: "#0ea5e9",
      iconBg: "rgba(14,165,233,0.08)",
      stepLabel: "B · 点击 / 转化",
      question: "用户会不会购买？",
      score: funnel.conversion.score,
      verdict: funnel.conversion.verdict,
      problems: funnel.conversion.problems,
      impact: funnel.conversion.impact,
      suggestions: funnel.conversion.suggestions,
    },
    {
      key: "retention",
      icon: "ri-heart-line",
      iconColor: "#16a34a",
      iconBg: "rgba(22,163,74,0.08)",
      stepLabel: "C · 转化后 / 信任",
      question: "用户会不会再来？",
      score: funnel.retention.score,
      verdict: funnel.retention.verdict,
      problems: funnel.retention.problems,
      impact: funnel.retention.impact,
      suggestions: funnel.retention.suggestions,
    },
  ];

  return (
    <section className="w-full px-6 lg:px-10 py-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>
              增长漏斗诊断
            </h2>
            <p className="text-[13px] mt-0.5" style={{ color: "#888888" }}>
              从曝光到复购，逐层找到增长瓶颈
            </p>
          </div>
          {/* Funnel Mini Stats */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl px-3 py-2"
            style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
            {stages.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1">
                <span className="text-[11px] font-medium" style={{ color: getScoreColor(s.score) }}>{s.score}</span>
                {i < stages.length - 1 && <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Stage Cards */}
        <div className="flex flex-col gap-4">
          {stages.map((stage, idx) => {
            const scoreColor = getScoreColor(stage.score);
            const isExpanded = expanded[stage.key];
            return (
              <div key={stage.key} className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>

                {/* Card Header — Always Visible */}
                <div className="flex items-start gap-4 p-5">
                  {/* Step Number */}
                  <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
                    {idx + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                    style={{ background: stage.iconBg }}>
                    <i className={`${stage.icon} text-[16px]`} style={{ color: stage.iconColor }} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: stage.iconBg, color: stage.iconColor }}>
                        {stage.stepLabel}
                      </span>
                      <span className="text-[11px]" style={{ color: "#AAAAAA" }}>{stage.question}</span>
                    </div>
                    <p className="text-[13px] font-medium leading-snug" style={{ color: "#333333" }}>
                      {stage.verdict}
                    </p>
                    <div className="mt-2.5 max-w-xs">
                      <ScoreBar score={stage.score} color={scoreColor} />
                    </div>
                  </div>

                  {/* Score Circle */}
                  <div className="shrink-0">
                    <ScoreCircle score={stage.score} color={scoreColor} />
                  </div>

                  {/* Expand toggle */}
                  <button onClick={() => toggle(stage.key)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 shrink-0"
                    style={{ background: isExpanded ? "#F0EEFF" : "#F7F8FA", border: "1px solid #EAEAEA", color: isExpanded ? "#7B61FF" : "#888888" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; }}>
                    <i className={`ri-arrow-down-s-line text-[15px] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0" style={{ borderTop: "1px solid #F0F0F0" }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                      {/* Problems */}
                      <div className="rounded-xl p-4" style={{ background: "#FFF7F7", border: "1px solid rgba(239,68,68,0.12)" }}>
                        <div className="flex items-center gap-1.5 mb-3">
                          <i className="ri-close-circle-line text-[13px]" style={{ color: "#ef4444" }} />
                          <span className="text-[12px] font-semibold" style={{ color: "#ef4444" }}>发现问题</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {stage.problems.map((p, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#ef4444" }} />
                              <span className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Impact */}
                      <div className="rounded-xl p-4" style={{ background: "#FFFBF0", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <div className="flex items-center gap-1.5 mb-3">
                          <i className="ri-alert-line text-[13px]" style={{ color: "#f59e0b" }} />
                          <span className="text-[12px] font-semibold" style={{ color: "#f59e0b" }}>影响分析</span>
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>{stage.impact}</p>
                      </div>

                      {/* Suggestions */}
                      <div className="rounded-xl p-4" style={{ background: "#F0FFF4", border: "1px solid rgba(22,163,74,0.12)" }}>
                        <div className="flex items-center gap-1.5 mb-3">
                          <i className="ri-lightbulb-line text-[13px]" style={{ color: "#16a34a" }} />
                          <span className="text-[12px] font-semibold" style={{ color: "#16a34a" }}>优化建议</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {stage.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#16a34a" }} />
                              <span className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
