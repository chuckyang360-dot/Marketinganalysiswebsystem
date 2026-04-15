import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import type { ArticleAssetsData, ContentType } from "../mocks/contentEngine";
import {
  MOCK_ARTICLE_ASSETS,
  MOCK_ARTICLE_BREAKDOWN,
  MOCK_CONTENT_ENGINE,
  MOCK_IMAGE_ASSETS,
  MOCK_IMAGE_BREAKDOWN,
} from "../mocks/contentEngine";
import ContentBreakdown from "./content-engine/components/ContentBreakdown";
import ContentEngineCTA from "./content-engine/components/ContentEngineCTA";
import ContentInput from "./content-engine/components/ContentInput";
import ContentProgress from "./content-engine/components/ContentProgress";
import ContentTypeTab from "./content-engine/components/ContentTypeTab";
import GeneratedAssets from "./content-engine/components/GeneratedAssets";
import GenerationControls from "./content-engine/components/GenerationControls";
import SourceContent from "./content-engine/components/SourceContent";

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

export function ContentEnginePage() {
  const [searchParams] = useSearchParams();
  const data = MOCK_CONTENT_ENGINE;
  const sourceUrl = searchParams.get("sourceUrl") || data.sourceUrl;
  const sourceType = searchParams.get("sourceType") || "mock";
  const queryContentType = searchParams.get("contentType");

  const inferredType: ContentType =
    queryContentType === "video" || queryContentType === "image" || queryContentType === "article"
      ? queryContentType
      : sourceType === "wechat" || sourceType === "zhihu"
        ? "article"
        : sourceType === "xiaohongshu" || sourceType === "xhslink" || sourceType === "weibo" || sourceType === "x" || sourceType === "twitter"
          ? "image"
          : "video";

  const [contentType, setContentType] = useState<ContentType>(inferredType);
  const [sectionKey, setSectionKey] = useState(0);
  const [assetsRevealed, setAssetsRevealed] = useState(true);
  const assetsRef = useRef<HTMLDivElement>(null);
  const breakdownRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = useCallback((type: ContentType) => {
    setContentType(type);
    setSectionKey((k) => k + 1);
    setAssetsRevealed(false);
    setTimeout(() => setAssetsRevealed(true), 80);
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
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7B61FF, #5B8CFF, rgba(91,140,255,0.2))" }} />
        <ContentProgress analysisId={data.analysisId} />

        <div className="w-full px-6 pb-0 pt-6 lg:px-10">
          <div className="mx-auto flex items-center gap-2" style={{ maxWidth: "1100px" }}>
            <a href="/workspace" className="cursor-pointer text-[12px] text-[#AAAAAA]">工作台</a>
            <i className="ri-arrow-right-s-line text-[11px] text-[#CCCCCC]" />
            <span className="text-[12px] text-[#AAAAAA]">内容引擎</span>
            <i className="ri-arrow-right-s-line text-[11px] text-[#CCCCCC]" />
            <span className="text-[12px] font-medium text-[#444444]">爆款复制分析</span>
          </div>
        </div>

        <ContentInput defaultValue={sourceUrl} />
        <Divider />
        <ContentTypeTab activeType={contentType} onChange={handleTypeChange} />
        <Divider />
        <SourceContent
          data={{
            ...data,
            articleBody: contentType === "article" ? (MOCK_ARTICLE_ASSETS as ArticleAssetsData).originalArticle : undefined,
          }}
          contentType={contentType}
        />
        <Divider />
        <div ref={breakdownRef} key={`breakdown-${sectionKey}`} style={{ animation: "tabFadeIn 0.35s ease both" }}>
          <ContentBreakdown data={activeBreakdown} contentType={contentType} />
        </div>
        <Divider />
        <GenerationControls data={activeControls} onGenerate={handleGenerate} />
        <Divider />
        <div key={`assets-${sectionKey}`} ref={assetsRef}>
          {assetsRevealed ? (
            <GeneratedAssets
              data={activeAssets}
              contentType={contentType}
              sourceImages={contentType === "image" ? data.thumbnailGallery : []}
            />
          ) : null}
        </div>
        <ContentEngineCTA />

        <style>{`
          @keyframes tabFadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <footer className="w-full border-t border-[#EAEAEA] bg-white px-6 py-6 lg:px-10">
          <div className="mx-auto flex flex-col items-center justify-between gap-3 sm:flex-row" style={{ maxWidth: "1100px" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#7B61FF,#5B8CFF)]">
                <i className="ri-global-line text-[11px] text-white" />
              </div>
              <span className="text-[13px] font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>
                GlobalPulse<span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
              </span>
            </div>
            <p className="text-[11px] text-[#AAAAAA]">由 AI 生成 · 内容仅供参考 · 请结合实际情况调整</p>
            <div className="flex items-center gap-4">
              <a href="/workspace" className="cursor-pointer text-[12px] text-[#888888]">返回工作台</a>
              <a href="/pricing" className="cursor-pointer text-[12px] text-[#888888]">升级计划</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Divider() {
  return (
    <div className="px-6 lg:px-10">
      <div className="mx-auto h-px bg-[#EAEAEA]" style={{ maxWidth: "1100px" }} />
    </div>
  );
}

export default ContentEnginePage;
