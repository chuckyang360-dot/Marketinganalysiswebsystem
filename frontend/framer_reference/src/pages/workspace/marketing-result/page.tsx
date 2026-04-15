import Navbar from "@/pages/home/components/Navbar";
import GrowthDecision from "./components/GrowthDecision";
import ChannelOpportunity from "./components/ChannelOpportunity";
import DemandInsights from "./components/DemandInsights";
import ContentStrategy from "./components/ContentStrategy";
import ExecutionPlan from "./components/ExecutionPlan";
import MarketingAssets from "./components/MarketingAssets";
import { MOCK_MARKETING_RESULT } from "@/mocks/marketingResult";

export default function MarketingResultPage() {
  const data = MOCK_MARKETING_RESULT;

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <main className="pt-[68px]">
        {/* Top accent line */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF, rgba(91,140,255,0.2))" }} />

        {/* Progress bar */}
        <div className="w-full px-6 lg:px-10 py-3" style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}>
          <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1100px" }}>
            <div className="flex items-center gap-4">
              {[
                { icon: "ri-search-line", label: "关键词解析", done: true },
                { icon: "ri-bar-chart-2-line", label: "市场分析", done: true },
                { icon: "ri-file-text-line", label: "增长报告", done: true },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2">
                  {idx > 0 && <span className="w-8 h-px" style={{ background: "#EAEAEA" }} />}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full"
                      style={{ background: "rgba(123,97,255,0.1)" }}>
                      <i className="ri-check-line text-[10px]" style={{ color: "#7B61FF" }} />
                    </div>
                    <span className="text-[11px] font-medium hidden sm:block" style={{ color: "#555555" }}>
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px]" style={{ color: "#AAAAAA" }}>
                关键词：<span className="font-semibold" style={{ color: "#444444" }}>{data.keyword}</span>
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                分析完成
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="w-full px-6 lg:px-10 pt-6 pb-0">
          <div className="mx-auto flex items-center gap-2" style={{ maxWidth: "1100px" }}>
            <a href="/workspace" className="text-[12px] cursor-pointer" style={{ color: "#AAAAAA" }}>工作台</a>
            <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />
            <span className="text-[12px]" style={{ color: "#AAAAAA" }}>营销分析</span>
            <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />
            <span className="text-[12px] font-medium" style={{ color: "#444444" }}>增长决策报告</span>
          </div>
        </div>

        {/* Modules */}
        <GrowthDecision data={data} />

        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px w-full" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        <ChannelOpportunity data={data} />

        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px w-full" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        <DemandInsights data={data} />

        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px w-full" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        <ContentStrategy data={data} />

        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px w-full" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        <ExecutionPlan data={data} />

        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px w-full" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        <MarketingAssets data={data} />

        {/* Footer */}
        <footer className="w-full px-6 lg:px-10 py-6" style={{ background: "#ffffff", borderTop: "1px solid #EAEAEA" }}>
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-3" style={{ maxWidth: "1100px" }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
                <i className="ri-global-line text-white text-[11px]" />
              </div>
              <span className="text-[13px] font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>
                GlobalPulse<span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "#AAAAAA" }}>
              由 AI 生成 · 结果仅供参考 · 请结合实际情况决策
            </p>
            <div className="flex items-center gap-4">
              <a href="/workspace" className="text-[12px] cursor-pointer" style={{ color: "#888888" }}>返回工作台</a>
              <a href="/pricing" className="text-[12px] cursor-pointer" style={{ color: "#888888" }}>升级计划</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
