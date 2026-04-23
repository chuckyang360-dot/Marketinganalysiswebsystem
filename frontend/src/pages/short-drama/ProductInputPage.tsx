import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductInputForm } from './components/ProductInputForm';
import { ReparseStrategyDialog } from './components/ReparseStrategyDialog';
import { SDWorkflowNav } from './components/SDWorkflowNav';
import { useEffectiveShortDramaProjectId } from './hooks/useEffectiveShortDramaProjectId';
import { useProductParse } from './hooks/useProductParse';
import { getShortDramaPipeline, getShortDramaProject, touchShortDramaProjectStep, updateShortDramaProductContext } from './services/shortDramaApi';
import type { ProductInputDraft, ProductPreviewSummary } from './types/shortDrama';
import {
  mapDraftToProductInputPayload,
  normalizedJsonToProductPreview,
  pipelineRawInputsToDraft,
  previewToProductContextPayload,
} from './utils/shortDramaAdapters';
import { SHORT_DRAMA_UI } from './utils/shortDramaUiCopy';
import { ri, sdColors, sdFontHeading } from './utils/shortDramaHelpers';
import { withProjectQuery } from './utils/shortDramaRoutes';
import { touchProjectNameFromPipeline } from './utils/shortDramaStorage';
import { workflowNavProjectName } from './utils/workflowProjectName';

const emptyDraft: ProductInputDraft = {
  productNameRaw: '',
  productCategoryRaw: '',
  brandRaw: '',
  priceRaw: '',
  targetUsersRaw: '',
  sellingPointsRaw: [],
  usageScenariosRaw: [],
  extraNotesRaw: '',
  productImages: [],
};

const idlePreview: ProductPreviewSummary = {
  productName: '',
  productCategory: '',
  productSummary: '',
  coreSellingPoints: [],
  targetUsers: [],
  usageScenarios: [],
  visualFeatures: [],
  productForm: '',
  keyFunctions: [],
  emotionalValue: [],
  suitableStoryAngles: [],
  visualRiskNotes: [],
  consistencyNotes: [],
  extractedFromImages: [],
  parseConfidence: 0,
  sourceTrace: {},
  fieldMeta: {},
  status: 'idle',
};

export function ShortDramaProductInputPage() {
  const navigate = useNavigate();
  const { effectiveProjectId: projectId, projectName, refreshSession } = useEffectiveShortDramaProjectId();
  const { parseSafe } = useProductParse();
  const [draft, setDraft] = useState<ProductInputDraft>(emptyDraft);
  const [preview, setPreview] = useState<ProductPreviewSummary>(idlePreview);
  const [isParsing, setIsParsing] = useState(false);
  const [isRawDirty, setIsRawDirty] = useState(false);
  const [isParsedDirty, setIsParsedDirty] = useState(false);
  const [lastReparseInfo, setLastReparseInfo] = useState<{ updated: string[]; preserved: string[] } | null>(null);
  const [parseVersion, setParseVersion] = useState(0);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [navTitle, setNavTitle] = useState<string | null>(null);
  const [isReparseDialogOpen, setIsReparseDialogOpen] = useState(false);
  const [lastParseError, setLastParseError] = useState<string | null>(null);

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
        const pc = pipe.product_context;
        if (pc?.raw_inputs) {
          const d = pipelineRawInputsToDraft(pc.raw_inputs);
          if (d) setDraft(d);
        }
        if (pc?.normalized) {
          const p = normalizedJsonToProductPreview(pc.normalized);
          if (p) setPreview(p);
        }
        if (typeof pc?.version === 'number') setParseVersion(pc.version);
      } finally {
        if (!cancelled) setPipelineLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const parseDirty = isRawDirty && preview.status === 'ready';
  const hasUserEditedParsedFields = Object.values(preview.fieldMeta || {}).some((m) => Boolean(m?.edited_by_user));
  const missingProject = projectId == null;
  const canGoStoryStep = !missingProject && preview.status === 'ready';
  const displayName = workflowNavProjectName({ fetchedProjectName: navTitle, sessionProjectName: projectName });

  const runParse = async (mode: 'replace_all' | 'preserve_user_edited') => {
    if (projectId == null) return;
    console.info('[S1_PARSE_CLICK_PAYLOAD]', {
      project_id: projectId,
      reparse_mode: mode,
      payload: mapDraftToProductInputPayload(draft),
    });
    setIsParsing(true);
    setPreview((p) => ({ ...p, status: 'parsing', errorMessage: undefined }));
    const result = await parseSafe(projectId, draft, mode);
    const next = result.preview;
    setPreview(next);
    if (next.status === 'ready') {
      setLastReparseInfo({ updated: result.updatedFields, preserved: result.preservedFields });
      setLastParseError(null);
    } else {
      setLastReparseInfo(null);
      setLastParseError(next.errorMessage || '解析失败，请查看后端日志。');
    }
    setIsParsing(false);
    setIsReparseDialogOpen(false);
    if (next.status === 'ready') {
      setIsRawDirty(false);
      setIsParsedDirty(false);
      setParseVersion((v) => v + 1);
    }
  };

  const handleParse = async () => {
    if (projectId == null) return;
    if (isRawDirty && hasUserEditedParsedFields) {
      setIsReparseDialogOpen(true);
      return;
    }
    await runParse('replace_all');
  };

  const persistEditedContextIfNeeded = async () => {
    if (projectId == null || preview.status !== 'ready' || !isParsedDirty) return;
    const saved = await updateShortDramaProductContext(projectId, previewToProductContextPayload(preview));
    const parsed = normalizedJsonToProductPreview(saved.product_context);
    if (parsed) setPreview(parsed);
    setParseVersion(saved.version);
    setIsParsedDirty(false);
  };

  const saveDraft = async (intent: 'save_draft' | 'before_exit'): Promise<boolean> => {
    if (projectId == null) return false;
    const nextResult = await parseSafe(projectId, draft, 'replace_all');
    const next = nextResult.preview;
    if (next.status !== 'ready') return false;
    setPreview(next);
    await persistEditedContextIfNeeded();
    await touchShortDramaProjectStep(projectId, { step: 'step_1', save_intent: intent === 'before_exit' ? 'before_exit' : 'save_draft' });
    setIsRawDirty(false);
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ReparseStrategyDialog
        open={isReparseDialogOpen}
        loading={isParsing}
        editedFieldCount={Object.values(preview.fieldMeta || {}).filter((m) => Boolean(m?.edited_by_user)).length}
        currentVersion={parseVersion}
        isRawDirty={isRawDirty}
        onClose={() => setIsReparseDialogOpen(false)}
        onReplaceAll={() => void runParse('replace_all')}
        onPreserveEdited={() => void runParse('preserve_user_edited')}
      />
      <SDWorkflowNav currentStep={1} projectName={displayName} projectId={projectId} isDirty={isRawDirty || isParsedDirty} onSaveDraft={saveDraft} />
      <div className="pt-14">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <header className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">STEP 01</span>
            <h1 className="mt-1 text-2xl font-black" style={{ ...sdFontHeading, color: sdColors.ink }}>产品理解层</h1>
            <p className="mt-1 text-[13px] text-[#8E8E93]">原始输入 + 图片理解 -&gt; 结构化 Product Context</p>
          </header>

          {missingProject ? (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] text-amber-950" role="alert">
              <p className="font-semibold">{SHORT_DRAMA_UI.productInput.missingTitle}</p>
              <p className="mt-1 text-amber-900/90">{SHORT_DRAMA_UI.productInput.missingBody}</p>
            </div>
          ) : (
            <p className="mb-4 text-[12px] text-[#8E8E93]">
              当前项目 ID：<span className="font-mono text-[#444444]">{projectId}</span>
              {pipelineLoading ? <span className="ml-2 text-[#AEAEB2]">（同步中）</span> : null}
            </p>
          )}

          <div className="mb-4 rounded-xl border border-[#EAEAEA] bg-white px-4 py-3 text-[12px]">
            解析版本：v{parseVersion} {parseDirty ? <span className="ml-2 text-[#B45309]">原始输入已修改，解析结果待更新</span> : null}
            {isParsedDirty ? <span className="ml-2 text-[#0F766E]">解析结果已被人工修订</span> : null}
            {hasUserEditedParsedFields ? <span className="ml-2 text-[#6B7280]">存在人工编辑字段</span> : null}
          </div>

          <ProductInputForm draft={draft} setDraft={(updater) => { setDraft(updater); setIsRawDirty(true); }} />

          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => void handleParse()} disabled={isParsing || missingProject} className="flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#F5F5F7] disabled:text-[#8E8E93]" style={{ background: isParsing || missingProject ? undefined : sdColors.ink }}>
              <i className={ri(isParsing ? 'ri-loader-4-line' : 'ri-sparkling-2-line', isParsing ? 'animate-spin text-[14px]' : 'text-[14px]')} aria-hidden />
              {isParsing ? '解析中…' : '解析产品信息'}
            </button>
          </div>
          {lastParseError ? (
            <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
              解析失败：{lastParseError}
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-[#EAEAEA] bg-white p-6">
            <h2 className="mb-4 text-[14px] font-bold text-[#1D1D1F]">解析结果层（可编辑）</h2>
            <textarea className="w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-[13px]" rows={3} value={preview.productSummary} onChange={(e) => { setPreview((p) => ({ ...p, productSummary: e.target.value, fieldMeta: { ...p.fieldMeta, product_summary: { edited_by_user: true, edited_at: new Date().toISOString() } } })); setIsParsedDirty(true); }} placeholder="产品概述" />
            <textarea className="mt-3 w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-[13px]" rows={2} value={preview.coreSellingPoints.join('\n')} onChange={(e) => { setPreview((p) => ({ ...p, coreSellingPoints: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean), fieldMeta: { ...p.fieldMeta, core_selling_points: { edited_by_user: true, edited_at: new Date().toISOString() } } })); setIsParsedDirty(true); }} placeholder="核心卖点（每行一条）" />
            <textarea className="mt-3 w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-[13px]" rows={2} value={preview.visualFeatures.join('\n')} onChange={(e) => { setPreview((p) => ({ ...p, visualFeatures: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean), fieldMeta: { ...p.fieldMeta, visual_features: { edited_by_user: true, edited_at: new Date().toISOString() } } })); setIsParsedDirty(true); }} placeholder="视觉特征（每行一条）" />
            <textarea className="mt-3 w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-[13px]" rows={2} value={preview.suitableStoryAngles.join('\n')} onChange={(e) => { setPreview((p) => ({ ...p, suitableStoryAngles: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean), fieldMeta: { ...p.fieldMeta, suitable_story_angles: { edited_by_user: true, edited_at: new Date().toISOString() } } })); setIsParsedDirty(true); }} placeholder="故事角度（每行一条）" />
            <textarea className="mt-3 w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-[13px]" rows={2} value={preview.visualRiskNotes.join('\n')} onChange={(e) => { setPreview((p) => ({ ...p, visualRiskNotes: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean), fieldMeta: { ...p.fieldMeta, visual_risk_notes: { edited_by_user: true, edited_at: new Date().toISOString() } } })); setIsParsedDirty(true); }} placeholder="风险提示（每行一条）" />
          </div>
          {lastReparseInfo && preview.status === 'ready' ? (
            <div className="mt-3 rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-[12px] text-[#4B5563]">
              重解析结果：更新字段 {lastReparseInfo.updated.length} 个，保留人工字段 {lastReparseInfo.preserved.length} 个
            </div>
          ) : null}

          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-[#EAEAEA] pt-8 sm:flex-row sm:items-center">
            <button type="button" onClick={() => navigate('/short-drama/create')} className="flex items-center justify-center gap-2 rounded-xl border border-[#EAEAEA] bg-white px-5 py-3 text-[13.5px] text-[#444444] transition-colors hover:bg-[#F5F5F7]">
              <i className={ri('ri-arrow-left-line', 'text-[13px]')} aria-hidden />
              返回
            </button>
            <button type="button" disabled={!canGoStoryStep} onClick={() => void (async () => { await persistEditedContextIfNeeded(); canGoStoryStep && navigate(withProjectQuery('/short-drama/story-blueprint', projectId)); })()} className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-[#EAEAEA] disabled:text-[#AEAEB2] ${canGoStoryStep ? 'bg-[#1D1D1F] text-white hover:bg-[#374151]' : 'bg-[#F5F5F7] text-[#AEAEB2]'}`}>
              下一步：生成剧本
              <i className={ri('ri-arrow-right-line', 'text-[13px]')} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
