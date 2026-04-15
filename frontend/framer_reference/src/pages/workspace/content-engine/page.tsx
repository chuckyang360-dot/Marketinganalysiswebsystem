import { useState, useRef, useCallback } from "react";
import Navbar from "@/pages/home/components/Navbar";
import ContentProgress from "./components/ContentProgress";
import ContentInput from "./components/ContentInput";
import ContentTypeTab from "./components/ContentTypeTab";
import SourceContent from "./components/SourceContent";
import ContentBreakdown from "./components/ContentBreakdown";
import GenerationControls from "./components/GenerationControls";
import GeneratedAssets from "./components/GeneratedAssets";
import ContentEngineCTA from "./components/ContentEngineCTA";
import {
  MOCK_CONTENT_ENGINE,
  MOCK_IMAGE_BREAKDOWN,
  MOCK_IMAGE_ASSETS,
  MOCK_ARTICLE_BREAKDOWN,
  MOCK_ARTICLE_ASSETS,
} from "@/mocks/contentEngine";
import type { ContentType, ArticleAssetsData } from "@/mocks/contentEngine";

// Map content type → breakdown & assets data
const BREAKDOWN_MAP = {
  video: MOCK_CONTENT_ENGINE.breakdown,
  image: MOCK_IMAGE_BREAKDOWN,
  article: MOCK_ARTICLE_BREAKDOWN,
};

const ASSETS_MAP = {
  video: MOCK_CONTENT_ENGINE.generatedAssets,
  image: MOCK_IMAGE_ASSETS,
  article: MOCK_ARTICLE_ASSETS,
};

// Filter generationControls for each content type
const CONTROLS_MAP = {
  video: {
    ...MOCK_CONTENT_ENGINE.generationControls,
    types: MOCK_CONTENT_ENGINE.generationControls.types.filter(
      (t) => t.id !== "image" && t.id !== "article"
    ),
  },
  image: {
    ...MOCK_CONTENT_ENGINE.generationControls,
    types: MOCK_CONTENT_ENGINE.generationControls.types.filter(
      (t) => t.id !== "video" && t.id !== "article"
    ),
    platforms: MOCK_CONTENT_ENGINE.generationControls.platforms.filter(
      (p) => p.id !== "youtube"
    ),
  },
  article: {
    ...MOCK_CONTENT_ENGINE.generationControls,
    types: MOCK_CONTENT_ENGINE.generationControls.types.filter(
      (t) => t.id !== "video" && t.id !== "image"
    ).concat([
      { id: "seo", label: "SEO 长文", icon: "ri-search-line", selected: true },
      { id: "summary", label: "摘要版本", icon: "ri-file-reduce-line", selected: false },
    ]),
    platforms: MOCK_CONTENT_ENGINE.generationControls.platforms.filter(
      (p) => p.id !== "youtube" && p.id !== "tiktok"
    ).concat([
      { id: "wechat", label: "公众号", icon: "ri-wechat-line" },
      { id: "zhihu", label: "知乎", icon: "ri-question-answer-line" },
    ]),
  },
};

export default function ContentEnginePage() {
  const data = MOCK_CONTENT_ENGINE;
  const [contentType, setContentType] = useState<ContentType>("video");
  const [assetsRevealed, setAssetsRevealed] = useState(true);
  const [sectionKey, setSectionKey] = useState(0); // force re-mount on type change
  const assetsRef = useRef<HTMLDivElement>(null);
  const breakdownRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = useCallback((type: ContentType) => {
    setContentType(type);
    // Re-mount sections with fade-in animation
    setSectionKey((k) => k + 1);
    setAssetsRevealed(false);
    setTimeout(() => setAssetsRevealed(true), 80);
    // Scroll to breakdown
    setTimeout(() => {
      breakdownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleGenerate = useCallback(() => {
    setAssetsRevealed(false);
    setTimeout(() => {
      setAssetsRevealed(true);
      setTimeout(() => {
        assetsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }, 50);
  }, []);

  const activeBreakdown = BREAKDOWN_MAP[contentType];
  const activeAssets = ASSETS_MAP[contentType];
  const activeControls = CONTROLS_MAP[contentType];

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <main className="pt-[68px]">
        {/* Top accent line */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF, rgba(91,140,255,0.2))" }} />

        {/* Progress bar */}
        <ContentProgress analysisId={data.analysisId} />

        {/* Breadcrumb */}
        <div className="w-full px-6 lg:px-10 pt-6 pb-0">
          <div className="mx-auto flex items-center gap-2" style={{ maxWidth: "1100px" }}>
            <a href="/workspace" className="text-[12px] cursor-pointer" style={{ color: "#AAAAAA" }}>工作台</a>
            <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />
            <span className="text-[12px]" style={{ color: "#AAAAAA" }}>内容引擎</span>
            <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />
            <span className="text-[12px] font-medium" style={{ color: "#444444" }}>爆款复制分析</span>
          </div>
        </div>

        {/* Input area */}
        <ContentInput defaultValue={data.sourceUrl} />

        {/* ─── Content Type Tab ─── */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        <ContentTypeTab activeType={contentType} onChange={handleTypeChange} />

        {/* Divider */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        {/* Source Content */}
        <SourceContent
          data={{
            ...data,
            articleBody: contentType === "article" ? (MOCK_ARTICLE_ASSETS as ArticleAssetsData).originalArticle : undefined,
          }}
          contentType={contentType}
        />

        {/* Divider */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        {/* Content Breakdown — re-mounts on type change */}
        <div ref={breakdownRef} key={`breakdown-${sectionKey}`} style={{ animation: "tabFadeIn 0.35s ease both" }}>
          <ContentBreakdown data={activeBreakdown} contentType={contentType} />
        </div>

        {/* Divider */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        {/* Generation Controls */}
        <GenerationControls data={activeControls} onGenerate={handleGenerate} />

        {/* Divider */}
        <div className="px-6 lg:px-10">
          <div className="mx-auto h-px" style={{ maxWidth: "1100px", background: "#EAEAEA" }} />
        </div>

        {/* Generated Assets — re-mounts on type change or generate */}
        <div ref={assetsRef} key={`assets-${sectionKey}`}>
          {assetsRevealed && (
            <GeneratedAssets
              data={activeAssets}
              contentType={contentType}
              sourceImages={contentType === "image" ? data.thumbnailGallery : []}
            />
          )}
        </div>

        {/* CTA */}
        <ContentEngineCTA />

        {/* Global tab animation keyframe */}
        <style>{`
          @keyframes tabFadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

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
            <p className="text-[11px]" style={{ color: "#AAAAAA" }}>由 AI 生成 · 内容仅供参考 · 请结合实际情况调整</p>
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
