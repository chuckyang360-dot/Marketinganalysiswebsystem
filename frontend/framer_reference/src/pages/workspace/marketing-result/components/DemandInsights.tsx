import { useState } from "react";
import type { MarketingResultData } from "@/mocks/marketingResult";

interface Props {
  data: MarketingResultData;
}

const INTENT_ICON: Record<string, string> = {
  "购买": "ri-shopping-cart-2-line",
  "了解": "ri-information-line",
  "比较": "ri-scales-line",
  "问题": "ri-question-line",
};

export default function DemandInsights({ data }: Props) {
  const { demands } = data;
  const [activeIntent, setActiveIntent] = useState<string>("全部");

  const intents = ["全部", "购买", "比较", "了解", "问题"];

  const filtered = activeIntent === "全部"
    ? demands
    : demands.filter((d) => d.intent === activeIntent);

  return (
    <section className="w-full px-6 lg:px-10 py-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <i className="ri-search-eye-line text-[15px]" style={{ color: "#7B61FF" }} />
              <h2 className="text-[18px] font-bold" style={{ color: "#111111", fontFamily: "'Syne', sans-serif" }}>用户需求</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
                Demand Insights
              </span>
            </div>
            <p className="text-[13px]" style={{ color: "#888888" }}>
              用户真实在搜索什么 — 内容选题池
            </p>
          </div>

          {/* Intent filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl"
            style={{ background: "#F0F0F0" }}>
            {intents.map((intent) => (
              <button
                key={intent}
                onClick={() => setActiveIntent(intent)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                style={{
                  background: activeIntent === intent ? "#ffffff" : "transparent",
                  color: activeIntent === intent ? "#111111" : "#888888",
                  boxShadow: activeIntent === intent ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                {intent}
              </button>
            ))}
          </div>
        </div>

        {/* Demand Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((d) => {
            const intentIcon = INTENT_ICON[d.intent] ?? "ri-search-line";
            return (
              <div key={d.id}
                className="group rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-all duration-200"
                style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,97,255,0.25)"; (e.currentTarget as HTMLElement).style.background = "#FAFBFF"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}>

                {/* Quote icon */}
                <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                  style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                  <i className="ri-double-quotes-l text-[14px]" style={{ color: "#CCCCCC" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-snug" style={{ color: "#222222" }}>
                    "{d.query}"
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Source */}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${d.sourceColor}12`, color: d.sourceColor, border: `1px solid ${d.sourceColor}22` }}>
                      {d.source}
                    </span>
                    {/* Intent */}
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${d.intentColor}10`, color: d.intentColor, border: `1px solid ${d.intentColor}22` }}>
                      <i className={`${intentIcon} text-[9px]`} />
                      {d.intent}意图
                    </span>
                    {/* Volume */}
                    <span className="text-[10px]" style={{ color: "#AAAAAA" }}>
                      <i className="ri-bar-chart-line text-[9px] mr-0.5" />
                      {d.volume}
                    </span>
                  </div>
                </div>

                {/* Arrow on hover */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <i className="ri-arrow-right-line text-[13px]" style={{ color: "#7B61FF" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom tip */}
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
          <i className="ri-magic-line text-[13px] shrink-0" style={{ color: "#7B61FF" }} />
          <p className="text-[12px]" style={{ color: "#666666" }}>
            以上需求直接来源于真实用户搜索行为，可作为内容标题、视频选题或广告文案的灵感来源。
          </p>
        </div>
      </div>
    </section>
  );
}
