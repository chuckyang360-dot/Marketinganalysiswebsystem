import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InfoPreviewPanel } from './components/InfoPreviewPanel';
import { ProductInputForm } from './components/ProductInputForm';
import { SDWorkflowNav } from './components/SDWorkflowNav';
import { useEffectiveShortDramaProjectId } from './hooks/useEffectiveShortDramaProjectId';
import { useProductParse } from './hooks/useProductParse';
import { getShortDramaPipeline, getShortDramaProject } from './services/shortDramaApi';
import type { ProductInputDraft, ProductPreviewSummary } from './types/shortDrama';
import {
  normalizedJsonToProductPreview,
  pipelineRawInputsToDraft,
} from './utils/shortDramaAdapters';
import { SHORT_DRAMA_UI } from './utils/shortDramaUiCopy';
import { touchProjectNameFromPipeline } from './utils/shortDramaStorage';
import { workflowNavProjectName } from './utils/workflowProjectName';
import { ri, sdColors, sdFontHeading } from './utils/shortDramaHelpers';
import { withProjectQuery } from './utils/shortDramaRoutes';

const emptyDraft: ProductInputDraft = {
  productName: '',
  category: '',
  brandName: '',
  targetMarkets: [],
  targetUser: '',
  sellingPoints: [],
  useScene: '',
  brandTone: '',
  extraNotes: '',
};

const idlePreview: ProductPreviewSummary = {
  summary: '',
  sellingPoints: [],
  sceneKeywords: [],
  styleKeywords: [],
  status: 'idle',
};

export function ShortDramaProductInputPage() {
  const navigate = useNavigate();
  const { effectiveProjectId: projectId, projectName, refreshSession } = useEffectiveShortDramaProjectId();
  const { parseSafe } = useProductParse();
  const [draft, setDraft] = useState<ProductInputDraft>(emptyDraft);
  const [preview, setPreview] = useState<ProductPreviewSummary>(idlePreview);
  const [isParsing, setIsParsing] = useState(false);
  const [navTitle, setNavTitle] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (projectId == null) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await getShortDramaProject(projectId);
        if (!cancelled) {
          setNavTitle(p.project_name);
          touchProjectNameFromPipeline(projectId, p.project_name);
        }
      } catch {
        if (!cancelled) setNavTitle(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (projectId == null) return;
    let cancelled = false;
    setPipelineLoading(true);
    void (async () => {
      try {
        const pipe = await getShortDramaPipeline(projectId);
        if (cancelled) return;
        touchProjectNameFromPipeline(projectId, pipe.project?.project_name);
        const pc = pipe.product_context;
        if (pc?.raw_inputs != null) {
          const fromRaw = pipelineRawInputsToDraft(pc.raw_inputs);
          if (fromRaw) setDraft(fromRaw);
        }
        if (pc?.normalized != null) {
          const fromNorm = normalizedJsonToProductPreview(pc.normalized);
          if (fromNorm) setPreview(fromNorm);
        }
      } catch {
        /* 保持空态，用户可继续填写并解析 */
      } finally {
        if (!cancelled) setPipelineLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const displayName = workflowNavProjectName({
    fetchedProjectName: navTitle,
    sessionProjectName: projectName,
  });

  const handleParse = async () => {
    if (projectId == null) return;
    setIsParsing(true);
    setPreview((p) => ({ ...p, status: 'parsing', errorMessage: undefined }));
    const next = await parseSafe(projectId, draft);
    setIsParsing(false);
    setPreview(next);
  };

  const missingProject = projectId == null;
  const canGoStoryStep = !missingProject && preview.status === 'ready';

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SDWorkflowNav currentStep={1} projectName={displayName} projectId={projectId} />
      <div className="pt-14">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <header className="mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">STEP 01</span>
            <h1 className="mt-1 text-2xl font-black" style={{ ...sdFontHeading, color: sdColors.ink }}>
              产品信息输入
            </h1>
            <p className="mt-1 text-[13px] text-[#8E8E93]">填写越详细，AI 生成的剧情越精准</p>
          </header>

          {missingProject ? (
            <div
              className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] text-amber-950"
              role="alert"
            >
              <p className="font-semibold">{SHORT_DRAMA_UI.productInput.missingTitle}</p>
              <p className="mt-1 text-amber-900/90">{SHORT_DRAMA_UI.productInput.missingBody}</p>
              <button
                type="button"
                onClick={() => navigate('/short-drama/create')}
                className="mt-3 rounded-lg bg-amber-900 px-4 py-2 text-[12px] font-medium text-white"
              >
                {SHORT_DRAMA_UI.noProject.cta}
              </button>
            </div>
          ) : (
            <p className="mb-6 text-[12px] text-[#8E8E93]">
              当前项目 ID：<span className="font-mono text-[#444444]">{projectId}</span>
              {pipelineLoading ? (
                <span className="ml-2 text-[#AEAEB2]">（正在同步服务器数据…）</span>
              ) : null}
            </p>
          )}

          <ProductInputForm draft={draft} setDraft={setDraft} />

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={isParsing || missingProject}
              className="flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#F5F5F7] disabled:text-[#8E8E93]"
              style={{ background: isParsing || missingProject ? undefined : sdColors.ink }}
            >
              {isParsing ? (
                <>
                  <i className={ri('ri-loader-4-line', 'animate-spin text-[14px]')} aria-hidden />
                  AI 正在解析…
                </>
              ) : (
                <>
                  <i className={ri('ri-sparkling-2-line', 'text-[14px]')} aria-hidden />
                  解析产品信息
                </>
              )}
            </button>
          </div>

          <div className="mt-10">
            <InfoPreviewPanel preview={preview} />
          </div>

          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-[#EAEAEA] pt-8 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate('/short-drama/create')}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#EAEAEA] bg-white px-5 py-3 text-[13.5px] text-[#444444] transition-colors hover:bg-[#F5F5F7]"
            >
              <i className={ri('ri-arrow-left-line', 'text-[13px]')} aria-hidden />
              返回
            </button>
            <button
              type="button"
              disabled={!canGoStoryStep}
              onClick={() => canGoStoryStep && navigate(withProjectQuery('/short-drama/story-blueprint', projectId))}
              className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-[#EAEAEA] disabled:text-[#AEAEB2] ${
                canGoStoryStep ? 'bg-[#1D1D1F] text-white hover:bg-[#374151]' : 'bg-[#F5F5F7] text-[#AEAEB2]'
              }`}
            >
              下一步：生成剧本
              <i className={ri('ri-arrow-right-line', 'text-[13px]')} aria-hidden />
            </button>
          </div>
          {preview.status !== 'ready' && !missingProject ? (
            <p className="mt-3 text-center text-[12px] text-[#AEAEB2]">
              {preview.status === 'error'
                ? '请修正左侧资料或稍后重试解析。'
                : '请先点击「解析产品信息」成功后，再继续生成剧本。'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
