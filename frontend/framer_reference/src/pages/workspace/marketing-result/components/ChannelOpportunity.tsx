import type { MarketingResultData } from "@/mocks/marketingResult";

interface Props {
  data: MarketingResultData;
}

const LEVEL_COLOR: Record<string, { color: string; bg: string }> = {
  "高": { color: "#16a34a", bg: "rgba(22,163,74,0.09)" },
  "中": { color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
  "低": { color: "#888888", bg: "rgba(107,114,128,0.09)" },
};

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#EBEBEB" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] w-6 text-right font-medium" style={{ color: "#888888" }}>{value}</span>
    </div>
  );
}

export default function ChannelOpportunity({ data }: Props) {
  const { channels } = data;
  const recommended = channels.filter((c) => c.recommended);
  const others = channels.filter((c) => !c.recommended);

  return (
    <section className="w-full px-6 lg:px-10 py-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <i className="ri-send-plane-2-line text-[15px]" style={{ color: "#7B61FF" }} />
              <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>渠道机会</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
                Channel Opportunity
              </span>
            </div>
            <p className="text-[13px]" style={{ color: "#888888" }}>去哪里做增长 — 按综合机会值排序</p>
          </div>
        </div>

        {/* Recommended channels */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(22,163,74,0.09)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.18)" }}>
              <i className="ri-star-fill text-[10px] mr-1" />
              推荐优先级
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {recommended.map((ch) => {
              const potColor = LEVEL_COLOR[ch.trafficPotential];
              const compColor = LEVEL_COLOR[ch.competition];
              const opportunityScore = Math.round((ch.potentialScore - ch.competitionScore * 0.5 + 50));
              return (
                <div key={ch.id} className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
                  style={{ border: "1.5px solid rgba(123,97,255,0.2)", background: "#ffffff" }}>
                  {/* Recommended badge */}
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(22,163,74,0.09)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.18)" }}>
                      推荐
                    </span>
                  </div>

                  {/* Platform icon + name */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                      style={{ background: ch.iconBg, border: `1px solid ${ch.iconColor}20` }}>
                      <i className={`${ch.icon} text-[18px]`} style={{ color: ch.iconColor }} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: "#111111" }}>{ch.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#888888" }}>机会值 {opportunityScore}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>{ch.description}</p>

                  {/* Score bars */}
                  <div className="flex flex-col gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "#888888" }}>流量潜力</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: potColor.bg, color: potColor.color }}>{ch.trafficPotential}</span>
                      </div>
                      <ScoreBar value={ch.potentialScore} color={potColor.color} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "#888888" }}>竞争强度</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: compColor.bg, color: compColor.color }}>{ch.competition}</span>
                      </div>
                      <ScoreBar value={ch.competitionScore} color={compColor.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other channels */}
        {others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }}>
                其他渠道参考
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {others.map((ch) => {
                const potColor = LEVEL_COLOR[ch.trafficPotential];
                const compColor = LEVEL_COLOR[ch.competition];
                return (
                  <div key={ch.id} className="rounded-xl p-4 flex items-start gap-4"
                    style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0"
                      style={{ background: ch.iconBg }}>
                      <i className={`${ch.icon} text-[16px]`} style={{ color: ch.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold" style={{ color: "#333333" }}>{ch.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: potColor.bg, color: potColor.color }}>
                          流量 {ch.trafficPotential}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: compColor.bg, color: compColor.color }}>
                          竞争 {ch.competition}
                        </span>
                      </div>
                      <p className="text-[12px]" style={{ color: "#777777" }}>{ch.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
