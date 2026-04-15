import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import ProductDecisionHero from "./components/ProductDecisionHero";
import FunnelAnalysis from "./components/FunnelAnalysis";
import ActionableOutput from "./components/ActionableOutput";
import { MOCK_ECOM_RESULT } from "@/mocks/ecomResult";
import type { GalleryImage } from "./components/ProductImageGallery";

export default function EcomResultPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [referenceImg, setReferenceImg] = useState<GalleryImage | null>(null);

  // Future: fetch real data by analysisId from API
  // For now, use mock data
  const data = { ...MOCK_ECOM_RESULT, analysisId: analysisId ?? MOCK_ECOM_RESULT.analysisId };

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* Page content with top padding for fixed navbar */}
      <main className="pt-[68px]">

        {/* Top accent line */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF, rgba(91,140,255,0.2))" }} />

        {/* Analysis progress indicator */}
        <div className="w-full px-6 lg:px-10 py-3" style={{ background: "#ffffff", borderBottom: "1px solid #EAEAEA" }}>
          <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1100px" }}>
            <div className="flex items-center gap-4">
              {[
                { icon: "ri-search-line", label: "商品解析", done: true },
                { icon: "ri-bar-chart-2-line", label: "增长分析", done: true },
                { icon: "ri-file-text-line", label: "报告生成", done: true },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2">
                  {idx > 0 && <span className="w-8 h-px" style={{ background: "#EAEAEA" }} />}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full"
                      style={{ background: step.done ? "rgba(123,97,255,0.1)" : "#F7F8FA" }}>
                      <i className={`${step.done ? "ri-check-line" : step.icon} text-[10px]`}
                        style={{ color: step.done ? "#7B61FF" : "#AAAAAA" }} />
                    </div>
                    <span className="text-[11px] font-medium hidden sm:block" style={{ color: step.done ? "#555555" : "#AAAAAA" }}>
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px]" style={{ color: "#AAAAAA" }}>
                分析 ID: <span className="font-medium" style={{ color: "#888888" }}>{data.analysisId}</span>
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

        {/* Module 1: Decision Hero */}
        <ProductDecisionHero data={data} onSetReference={setReferenceImg} />

        {/* Section Divider */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto" style={{ maxWidth: "1100px" }}>
            <div className="h-px w-full" style={{ background: "#EAEAEA" }} />
          </div>
        </div>

        {/* Module 2: Funnel Analysis */}
        <FunnelAnalysis data={data} />

        {/* Section Divider */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto" style={{ maxWidth: "1100px" }}>
            <div className="h-px w-full" style={{ background: "#EAEAEA" }} />
          </div>
        </div>

        {/* Module 3: Actionable Output */}
        <ActionableOutput data={data} referenceImg={referenceImg} />

        {/* Simple Footer */}
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
              <a href="/workspace" className="text-[12px] transition-colors duration-200 cursor-pointer" style={{ color: "#888888" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}>
                返回工作台
              </a>
              <a href="/pricing" className="text-[12px] transition-colors duration-200 cursor-pointer" style={{ color: "#888888" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}>
                升级计划
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
