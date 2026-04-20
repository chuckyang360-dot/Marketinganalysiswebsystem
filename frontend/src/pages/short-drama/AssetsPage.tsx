import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SDWorkflowNav } from './components/SDWorkflowNav';
import { AssetLightbox, type LightboxItem } from './components/AssetLightbox';
import {
  AssetInteractionModal,
  type AssetEditorPayload,
  type AssetInteractionEntity,
  type AssetKind,
} from './components/AssetInteractionModal';
import { useAssetsPage } from './hooks/useAssetsPage';
import type { AssetsPageProductVm } from './types/shortDrama';
import {
  ASSETS_PAGE_MESSAGES,
  assetsPageViewModelEmpty,
} from './utils/assetsPageAdapters';
import { SHORT_DRAMA_UI } from './utils/shortDramaUiCopy';
import { withProjectQuery } from './utils/shortDramaRoutes';
import { touchShortDramaProjectStep } from './services/shortDramaApi';
import { regenerateShortDramaOneAssetImage, updateShortDramaAsset } from './services/shortDramaApi';

/** Step4 需已具备参考图批次结果（或后续阶段） */
const CAN_LEAVE_ASSETS_STATUSES = new Set([
  'assets_ready',
  'segments_generated',
  'video_rendering',
  'completed',
]);

type TabType = 'characters' | 'scenes' | 'assets';

export function ShortDramaAssetsPage() {
  const navigate = useNavigate();
  const {
    effectiveProjectId,
    projectName,
    phase,
    error,
    emptyHint,
    viewModel,
    retryLoad,
    retryGenerateSpecs,
    pipeline,
    handleNextStep,
    nextStepBusy,
    nextStepError,
    canClickNext,
  } = useAssetsPage();

  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [capabilityNotice, setCapabilityNotice] = useState<string | null>(null);
  const [isDirty] = useState(false);
  const [invalidCharacterIds, setInvalidCharacterIds] = useState<Set<number>>(new Set());
  const [invalidSceneIds, setInvalidSceneIds] = useState<Set<number>>(new Set());
  const [invalidProductIds, setInvalidProductIds] = useState<Set<number>>(new Set());
  const [interactionAsset, setInteractionAsset] = useState<AssetInteractionEntity | null>(null);
  const [interactionMode, setInteractionMode] = useState<'detail' | 'edit'>('detail');
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorRegenerating, setEditorRegenerating] = useState(false);

  // TODO(points): future paywall hook. Generation actions (asset regen / batch image generation / video generation)
  // should call a centralized credit precheck here before executing.
  const canRunGenerationAction = useCallback((_action: 'asset_regenerate' | 'asset_initial_generate') => true, []);

  const flashNotice = useCallback((msg: string) => {
    setCapabilityNotice(msg);
    window.setTimeout(() => setCapabilityNotice(null), 4200);
  }, []);

  const canProceedToStep4 =
    effectiveProjectId != null &&
    pipeline?.project?.status != null &&
    CAN_LEAVE_ASSETS_STATUSES.has(pipeline.project.status);
  const step3Stale = pipeline?.project?.step_status?.step_3 === 'stale';
  const isGeneratingAssets = phase === 'generating_specs' || phase === 'generating_images';
  const skeletonCount = useMemo(() => {
    if (activeTab === 'characters') return Math.max(4, viewModel.characters.length || 0);
    if (activeTab === 'scenes') return Math.max(4, viewModel.scenes.length || 0);
    return Math.max(4, viewModel.products.length || 0);
  }, [activeTab, viewModel.characters.length, viewModel.scenes.length, viewModel.products.length]);

  useEffect(() => {
    const c = pipeline?.assets?.characters?.length ?? 0;
    const s = pipeline?.assets?.scenes?.length ?? 0;
    const p = pipeline?.assets?.products?.length ?? 0;
    console.info(
      `[FE_STEP3_ENTER] projectId=${effectiveProjectId ?? 'null'} projectStatus=${pipeline?.project?.status ?? 'n/a'} hasCharacters=${c > 0} hasScenes=${s > 0} hasProducts=${p > 0} characterCount=${c} sceneCount=${s} productCount=${p}`,
    );
  }, [effectiveProjectId, pipeline]);

  useEffect(() => {
    if (!pipeline || effectiveProjectId == null) return;
    console.info('[FRONT_PROJECT_DATA_RESTORED]', { project_id: effectiveProjectId, page: 'step_3' });
  }, [pipeline, effectiveProjectId]);

  useEffect(() => {
    if (!step3Stale || effectiveProjectId == null) return;
    console.info('[FRONT_STEP_STALE_BANNER_SHOWN]', { project_id: effectiveProjectId, step: 'step_3' });
  }, [step3Stale, effectiveProjectId]);

  useEffect(() => {
    if (!isGeneratingAssets) return;
    console.info('[FRONT_STEP3_LOADING_VIEW_SHOWN]', { project_id: effectiveProjectId ?? null, phase, tab: activeTab });
  }, [isGeneratingAssets, effectiveProjectId, phase, activeTab]);

  useEffect(() => {
    if (isGeneratingAssets || phase !== 'ready') return;
    const blocked =
      viewModel.characters.some((c) => !c.hasRealImage || !c.img) ||
      viewModel.scenes.some((s) => !s.hasRealImage || !s.img) ||
      viewModel.products.some((p) => !p.hasRealImage || !p.img);
    if (blocked) {
      console.info('[FRONT_STEP3_MOCK_DATA_BLOCKED]', { project_id: effectiveProjectId ?? null });
    }
  }, [isGeneratingAssets, phase, viewModel, effectiveProjectId]);

  useEffect(() => {
    console.info('[FRONT_DIRTY_STATE_CHANGED]', { project_id: effectiveProjectId ?? null, step: 'step_3', dirty: isDirty });
  }, [isDirty, effectiveProjectId]);

  const saveDraft = async (intent: 'save_draft' | 'before_exit'): Promise<boolean> => {
    if (effectiveProjectId == null) return false;
    try {
      await touchShortDramaProjectStep(effectiveProjectId, {
        step: 'step_3',
        save_intent: intent === 'before_exit' ? 'before_exit' : 'save_draft',
      });
      return true;
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '保存失败，请稍后重试');
      return false;
    }
  };

  const openAssetDetail = useCallback(
    (kind: AssetKind, id: number) => {
      const getMeta = () => {
        if (!pipeline?.assets) return {};
        if (kind === 'character') return pipeline.assets.characters.find((x) => x.id === id)?.meta || {};
        if (kind === 'scene') return pipeline.assets.scenes.find((x) => x.id === id)?.meta || {};
        return pipeline.assets.products.find((x) => x.id === id)?.meta || {};
      };
      const meta = getMeta() as Record<string, unknown>;
      if (kind === 'character') {
        const row = viewModel.characters.find((x) => x.id === id);
        if (!row) return;
        setInteractionAsset({
          id,
          kind,
          name: row.name,
          typeLabel: row.role,
          description: row.desc,
          prompt: row.visualPrompt,
          imageUrl: row.img,
          sourceLabel: meta.reference_image_data_url ? '用户参考图' : '系统生成',
          voiceStyle: typeof meta.voice_style === 'string' ? meta.voice_style : '未设置',
          referenceImageDataUrl: typeof meta.reference_image_data_url === 'string' ? meta.reference_image_data_url : undefined,
          referenceImageName: typeof meta.reference_image_name === 'string' ? meta.reference_image_name : undefined,
        });
      } else if (kind === 'scene') {
        const row = viewModel.scenes.find((x) => x.id === id);
        if (!row) return;
        setInteractionAsset({
          id,
          kind,
          name: row.name,
          typeLabel: row.type,
          description: row.desc,
          prompt: row.visualPrompt,
          imageUrl: row.img,
          sourceLabel: meta.reference_image_data_url ? '用户参考图' : '系统生成',
          referenceImageDataUrl: typeof meta.reference_image_data_url === 'string' ? meta.reference_image_data_url : undefined,
          referenceImageName: typeof meta.reference_image_name === 'string' ? meta.reference_image_name : undefined,
        });
      } else {
        const row = viewModel.products.find((x) => x.id === id);
        if (!row) return;
        setInteractionAsset({
          id,
          kind,
          name: row.name,
          typeLabel: 'product',
          description: row.desc,
          prompt: row.cameraHint,
          imageUrl: row.img,
          sourceLabel: meta.reference_image_data_url ? '用户参考图' : '系统生成',
          productUsage: typeof meta.product_usage === 'string' ? meta.product_usage : row.placement,
          referenceImageDataUrl: typeof meta.reference_image_data_url === 'string' ? meta.reference_image_data_url : undefined,
          referenceImageName: typeof meta.reference_image_name === 'string' ? meta.reference_image_name : undefined,
        });
      }
      setInteractionMode('detail');
      console.info('[FRONT_ASSET_DETAIL_OPENED]', { project_id: effectiveProjectId ?? null, asset_type: kind, asset_id: id });
    },
    [pipeline?.assets, viewModel, effectiveProjectId],
  );

  const openAssetEditor = useCallback(
    (kind: AssetKind, id: number) => {
      openAssetDetail(kind, id);
      setInteractionMode('edit');
      console.info('[FRONT_ASSET_EDITOR_OPENED]', { project_id: effectiveProjectId ?? null, asset_type: kind, asset_id: id });
    },
    [openAssetDetail, effectiveProjectId],
  );

  const TABS = useMemo(
    () =>
      [
        { key: 'characters' as const, label: '角色', count: viewModel.characters.length, icon: 'ri-user-star-line' },
        { key: 'scenes' as const, label: '场景', count: viewModel.scenes.length, icon: 'ri-landscape-line' },
        { key: 'assets' as const, label: '产品资产', count: viewModel.products.length, icon: 'ri-archive-line' },
      ] as const,
    [viewModel],
  );

  const openAssetLightbox = useCallback(
    (kind: AssetKind, id: number) => {
      let target: { img: string | null; name: string } | AssetsPageProductVm | undefined;
      if (kind === 'character') {
        target = viewModel.characters.find((x) => x.id === id);
      } else if (kind === 'scene') {
        target = viewModel.scenes.find((x) => x.id === id);
      } else {
        target = viewModel.products.find((x) => x.id === id);
      }
      if (!target?.img) return;
      setLightbox({
        img: target.img,
        name: target.name,
      });
      console.info('[FRONT_ASSET_ZOOM_OPENED]', { project_id: effectiveProjectId ?? null, asset_type: kind, asset_id: id });
    },
    [viewModel, effectiveProjectId],
  );

  const saveAssetEdit = useCallback(
    async (payload: AssetEditorPayload) => {
      if (!interactionAsset || effectiveProjectId == null) return;
      setEditorSaving(true);
      try {
        if (payload.referenceImageDataUrl) {
          console.info('[FRONT_ASSET_REFERENCE_UPLOAD_SELECTED]', {
            project_id: effectiveProjectId,
            asset_type: interactionAsset.kind,
            asset_id: interactionAsset.id,
          });
        }
        await updateShortDramaAsset(interactionAsset.kind, interactionAsset.id, {
          project_id: effectiveProjectId,
          name: payload.name,
          role_type: interactionAsset.kind === 'character' ? payload.typeLabel : undefined,
          scene_type: interactionAsset.kind === 'scene' ? payload.typeLabel : undefined,
          description: payload.description,
          visual_prompt: payload.prompt,
          voice_style: payload.voiceStyle,
          reference_image_data_url: payload.referenceImageDataUrl,
          reference_image_name: payload.referenceImageName,
          product_usage: payload.productUsage,
        });
        console.info('[FRONT_ASSET_EDIT_SAVED]', { project_id: effectiveProjectId, asset_type: interactionAsset.kind, asset_id: interactionAsset.id });
        console.info('[FRONT_STEP3_STALE_MARKED_STEP4]', { project_id: effectiveProjectId, reason: 'asset_edit_saved' });
        if (payload.referenceImageDataUrl) {
          console.info('[FRONT_ASSET_REFERENCE_UPLOAD_SAVED]', { project_id: effectiveProjectId, asset_type: interactionAsset.kind, asset_id: interactionAsset.id });
        }
        await retryLoad();
        setInteractionAsset(null);
      } finally {
        setEditorSaving(false);
      }
    },
    [interactionAsset, effectiveProjectId, retryLoad, canRunGenerationAction],
  );

  const regenerateAsset = useCallback(
    async (payload: AssetEditorPayload) => {
      if (!interactionAsset || effectiveProjectId == null) return;
      setEditorRegenerating(true);
      console.info('[FRONT_ASSET_REGENERATE_STARTED]', { project_id: effectiveProjectId, asset_type: interactionAsset.kind, asset_id: interactionAsset.id });
      try {
        if (!canRunGenerationAction('asset_regenerate')) {
          return;
        }
        await updateShortDramaAsset(interactionAsset.kind, interactionAsset.id, {
          project_id: effectiveProjectId,
          name: payload.name,
          role_type: interactionAsset.kind === 'character' ? payload.typeLabel : undefined,
          scene_type: interactionAsset.kind === 'scene' ? payload.typeLabel : undefined,
          description: payload.description,
          visual_prompt: payload.prompt,
          voice_style: payload.voiceStyle,
          reference_image_data_url: payload.referenceImageDataUrl,
          reference_image_name: payload.referenceImageName,
          product_usage: payload.productUsage,
        });
        await regenerateShortDramaOneAssetImage({
          project_id: effectiveProjectId,
          asset_type: interactionAsset.kind,
          asset_id: interactionAsset.id,
        });
        console.info('[FRONT_ASSET_REGENERATE_SUCCEEDED]', { project_id: effectiveProjectId, asset_type: interactionAsset.kind, asset_id: interactionAsset.id });
        console.info('[FRONT_STEP3_STALE_MARKED_STEP4]', { project_id: effectiveProjectId, reason: 'asset_regenerate_succeeded' });
        await retryLoad();
        setInteractionAsset(null);
      } catch (e) {
        console.warn('[FRONT_ASSET_REGENERATE_FAILED]', {
          project_id: effectiveProjectId,
          asset_type: interactionAsset.kind,
          asset_id: interactionAsset.id,
          message: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setEditorRegenerating(false);
      }
    },
    [interactionAsset, effectiveProjectId, retryLoad],
  );

  const showDataGrids = phase === 'ready';

  return (
    <div className="min-h-screen" style={{ background: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
      <SDWorkflowNav
        currentStep={3}
        projectName={projectName}
        projectId={effectiveProjectId}
        isDirty={isDirty}
        onSaveDraft={saveDraft}
      />

      <div className="pt-14">
        <div
          className="px-6 lg:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderBottom: '1px solid #EAEAEA', background: '#ffffff' }}
        >
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#8E8E93' }}>
              STEP 03
            </span>
            <h1 className="text-2xl font-black mt-0.5" style={{ fontFamily: "'Syne', sans-serif", color: '#1D1D1F' }}>
              角色与场景资产
            </h1>
            <p className="text-[13px] mt-1" style={{ color: '#8E8E93' }}>
              构建可复用的视觉资产库，统一整部短剧的视觉风格
            </p>
          </div>
          <button
            type="button"
            title={ASSETS_PAGE_MESSAGES.batchRegen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
            onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.batchRegen)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
            }}
          >
            <i className="ri-refresh-line text-[12px]" />
            全部重新生成
          </button>
        </div>

        {capabilityNotice ? (
          <div
            className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950 lg:mx-10"
            role="status"
          >
            {capabilityNotice}
          </div>
        ) : null}

        {step3Stale ? (
          <div
            className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 lg:mx-10"
            role="status"
          >
            你已修改上游设定/剧本，当前资产基于旧内容生成，请重新生成或手动调整。
          </div>
        ) : null}

        {phase === 'no_project' ? (
          <div className="mx-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] text-amber-950 lg:mx-10">
            <p className="font-semibold">{SHORT_DRAMA_UI.noProject.title}</p>
            <p className="mt-1">{SHORT_DRAMA_UI.noProject.body}</p>
            <button
              type="button"
              onClick={() => navigate('/short-drama/create')}
              className="mt-3 rounded-lg bg-amber-900 px-4 py-2 text-[12px] font-medium text-white"
            >
              {SHORT_DRAMA_UI.noProject.cta}
            </button>
          </div>
        ) : null}

        {phase === 'loading' ? (
          <div className="mx-6 mt-4 flex items-center gap-2 text-[13px] text-[#8E8E93] lg:mx-10">
            <i className="ri-loader-4-line animate-spin text-[16px] text-[#1D1D1F]" aria-hidden />
            {SHORT_DRAMA_UI.loading.pipeline}
          </div>
        ) : null}

        {phase === 'generating_specs' ? (
          <div className="mx-6 mt-4 flex items-center gap-2 text-[13px] text-[#8E8E93] lg:mx-10">
            <i className="ri-loader-4-line animate-spin text-[16px] text-[#B45309]" aria-hidden />
            正在生成角色/场景/产品参考图...
          </div>
        ) : null}

        {phase === 'generating_images' ? (
          <div className="mx-6 mt-4 flex items-center gap-2 text-[13px] text-[#8E8E93] lg:mx-10">
            <i className="ri-loader-4-line animate-spin text-[16px] text-[#047857]" aria-hidden />
            正在生成角色/场景/产品参考图...
          </div>
        ) : null}

        {phase === 'blocked_prereq' ? (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950 lg:mx-10">
            {emptyHint ?? SHORT_DRAMA_UI.assets.blockedFallback}
            <button
              type="button"
              onClick={() => navigate(withProjectQuery('/short-drama/story-blueprint', effectiveProjectId))}
              className="mt-3 block rounded-lg bg-amber-900 px-4 py-2 text-[12px] font-medium text-white"
            >
              {SHORT_DRAMA_UI.assets.backToStory}
            </button>
          </div>
        ) : null}

        {phase === 'error' ? (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 lg:mx-10">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => retryLoad()}
              className="mt-3 rounded-lg bg-red-900 px-4 py-2 text-[12px] font-medium text-white"
            >
              {SHORT_DRAMA_UI.actions.retryLoad}
            </button>
          </div>
        ) : null}

        {phase === 'ready' && emptyHint ? (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950 lg:mx-10">
            {emptyHint}
            {pipeline?.project?.status === 'story_generated' && assetsPageViewModelEmpty(viewModel) ? (
              <button
                type="button"
                onClick={() => void retryGenerateSpecs()}
                className="mt-3 block rounded-lg border border-amber-900 px-4 py-2 text-[12px] font-medium text-amber-950"
              >
                {SHORT_DRAMA_UI.assets.retrySpecs}
              </button>
            ) : null}
          </div>
        ) : null}

        {showDataGrids ? (
          <>
            <div className="px-6 lg:px-10 pt-5 pb-0">
              <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F5F5F7', border: '1px solid #EAEAEA' }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                    style={{
                      background: activeTab === tab.key ? '#ffffff' : 'transparent',
                      color: activeTab === tab.key ? '#1D1D1F' : '#8E8E93',
                      border: activeTab === tab.key ? '1px solid #EAEAEA' : '1px solid transparent',
                      boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <i className={`${tab.icon} text-[13px]`} />
                    {tab.label}
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: activeTab === tab.key ? '#F5F5F7' : '#EAEAEA',
                        color: activeTab === tab.key ? '#444444' : '#8E8E93',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 lg:px-10 py-7">
              {activeTab === 'characters' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {viewModel.characters.map((char) => (
                    <div
                      key={char.id}
                      className="rounded-2xl overflow-hidden transition-all duration-200"
                      style={{ background: '#ffffff', border: '1px solid #EAEAEA' }}
                    >
                      <div
                        className="relative w-full h-52 overflow-hidden flex items-center justify-center group"
                        style={{ background: '#F5F5F7', cursor: 'pointer' }}
                        onClick={() => openAssetLightbox('character', char.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openAssetLightbox('character', char.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {char.img && !invalidCharacterIds.has(char.id) ? (
                          <img
                            src={char.img}
                            alt={char.name}
                            className="w-full h-full object-contain"
                            onError={() => {
                              setInvalidCharacterIds((prev) => new Set(prev).add(char.id));
                              console.info('[FRONT_STEP3_ASSET_RENDER_SKIPPED_INVALID_URL]', { project_id: effectiveProjectId ?? null, tab: 'characters', asset_id: char.id });
                            }}
                          />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-[#ECEDEF]" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-end justify-end p-2.5">
                          <div
                            className="w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.08)' }}
                          >
                            <i className="ri-zoom-in-line text-[12px]" style={{ color: '#1D1D1F' }} />
                          </div>
                        </div>
                        <div className="absolute top-2.5 left-2.5">
                          <span
                            className="text-[10px] font-semibold px-2 py-1 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.92)',
                              color: '#444444',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            {char.role}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3
                          className="text-[15px] font-bold mb-1.5"
                          style={{ fontFamily: "'Syne', sans-serif", color: '#1D1D1F' }}
                        >
                          {char.name}
                        </h3>
                        <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#6E6E73' }}>
                          {char.desc}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {char.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-1 rounded-full"
                              style={{ background: '#F5F5F7', color: '#6E6E73' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div
                          className="flex items-center gap-2 mb-4 p-2 rounded-lg"
                          style={{ background: '#F7F8FA', border: '1px solid #EAEAEA' }}
                        >
                          <i className="ri-mic-line text-[12px]" style={{ color: '#8E8E93' }} />
                          <span className="text-[11.5px]" style={{ color: '#6E6E73' }}>
                            音色：{char.voice}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetLightbox('character', char.id)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                            }}
                          >
                            <i className="ri-zoom-in-line text-[11px] mr-1" />
                            放大
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssetDetail('character', char.id)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                            style={{ background: '#1D1D1F', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                            }}
                          >
                            <i className="ri-information-line text-[11px] mr-1" />
                            查看详情
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetEditor('character', char.id)}
                            className="py-2 rounded-lg text-[11.5px] border border-[#EAEAEA] bg-white"
                          >
                            <i className="ri-edit-line text-[11px] mr-1" />
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssetEditor('character', char.id)}
                            className="py-2 rounded-lg text-[11.5px] border border-dashed border-[#D1D1D6] bg-[#F7F8FA]"
                          >
                            <i className="ri-upload-2-line text-[11px] mr-1" />
                            上传参考图
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    title={ASSETS_PAGE_MESSAGES.addCharacter}
                    className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 min-h-[320px]"
                    style={{ border: '1.5px dashed #D1D1D6', background: '#F7F8FA' }}
                    onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.addCharacter)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#1D1D1F';
                      (e.currentTarget as HTMLElement).style.background = '#F5F5F7';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#D1D1D6';
                      (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                    }}
                  >
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl" style={{ background: '#EAEAEA' }}>
                      <i className="ri-user-add-line text-[20px]" style={{ color: '#8E8E93' }} />
                    </div>
                    <span className="text-[13px]" style={{ color: '#8E8E93' }}>
                      添加角色
                    </span>
                  </button>
                </div>
              )}

              {activeTab === 'scenes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {viewModel.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#ffffff', border: '1px solid #EAEAEA' }}
                    >
                      <div
                        className="relative w-full h-48 overflow-hidden group"
                        style={{ background: '#F7F8FA', cursor: 'pointer' }}
                        onClick={() => openAssetLightbox('scene', scene.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openAssetLightbox('scene', scene.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {scene.img && !invalidSceneIds.has(scene.id) ? (
                          <img
                            src={scene.img}
                            alt={scene.name}
                            className="w-full h-full object-cover object-center"
                            onError={() => {
                              setInvalidSceneIds((prev) => new Set(prev).add(scene.id));
                              console.info('[FRONT_STEP3_ASSET_RENDER_SKIPPED_INVALID_URL]', { project_id: effectiveProjectId ?? null, tab: 'scenes', asset_id: scene.id });
                            }}
                          />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-[#ECEDEF]" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/18 transition-all duration-200 flex items-end justify-end p-2.5">
                          <div
                            className="w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.08)' }}
                          >
                            <i className="ri-zoom-in-line text-[12px]" style={{ color: '#1D1D1F' }} />
                          </div>
                        </div>
                        <span
                          className="absolute top-3 left-3 text-[10px] font-medium px-2 py-1 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.9)',
                            color: '#444444',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          {scene.type}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3
                          className="text-[14px] font-bold mb-2"
                          style={{ fontFamily: "'Syne', sans-serif", color: '#1D1D1F' }}
                        >
                          {scene.name}
                        </h3>
                        <p className="text-[12px] leading-relaxed mb-4" style={{ color: '#6E6E73' }}>
                          {scene.desc}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetLightbox('scene', scene.id)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                            }}
                          >
                            <i className="ri-zoom-in-line text-[11px] mr-1" />
                            放大
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssetDetail('scene', scene.id)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#1D1D1F', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                            }}
                          >
                            <i className="ri-information-line text-[11px] mr-1" />
                            查看详情
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetEditor('scene', scene.id)}
                            className="py-2 rounded-lg text-[11.5px] border border-[#EAEAEA] bg-white"
                          >
                            <i className="ri-edit-line text-[11px] mr-1" />
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssetEditor('scene', scene.id)}
                            className="py-2 rounded-lg text-[11.5px] border border-dashed border-[#D1D1D6] bg-[#F7F8FA]"
                          >
                            <i className="ri-upload-2-line text-[11px] mr-1" />
                            上传参考图
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {viewModel.products.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#ffffff', border: '1px solid #EAEAEA' }}
                    >
                      <div
                        className="relative w-full h-44 overflow-hidden group"
                        style={{ background: '#F7F8FA', cursor: 'pointer' }}
                        onClick={() => openAssetLightbox('product', asset.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openAssetLightbox('product', asset.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {asset.img && !invalidProductIds.has(asset.id) ? (
                          <img
                            src={asset.img}
                            alt={asset.name}
                            className="w-full h-full object-cover object-center"
                            onError={() => {
                              setInvalidProductIds((prev) => new Set(prev).add(asset.id));
                              console.info('[FRONT_STEP3_ASSET_RENDER_SKIPPED_INVALID_URL]', { project_id: effectiveProjectId ?? null, tab: 'products', asset_id: asset.id });
                            }}
                          />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-[#ECEDEF]" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/18 transition-all duration-200 flex items-end justify-end p-2.5">
                          <button
                            type="button"
                            aria-label="放大产品图"
                            className="w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.08)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssetLightbox('product', asset.id);
                            }}
                          >
                            <span className="text-[12px] leading-none" style={{ color: '#1D1D1F' }}>
                              ➕
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3
                          className="text-[14px] font-bold mb-3"
                          style={{ fontFamily: "'Syne', sans-serif", color: '#1D1D1F' }}
                        >
                          {asset.name}
                        </h3>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2">
                            <i className="ri-camera-line text-[11px] mt-0.5" style={{ color: '#AEAEB2' }} />
                            <div>
                              <p className="text-[10px] mb-0.5" style={{ color: '#AEAEB2' }}>
                                出镜方式
                              </p>
                              <p className="text-[12px]" style={{ color: '#444444' }}>
                                {asset.placement}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <i className="ri-focus-3-line text-[11px] mt-0.5" style={{ color: '#AEAEB2' }} />
                            <div>
                              <p className="text-[10px] mb-0.5" style={{ color: '#AEAEB2' }}>
                                镜头定位
                              </p>
                              <p className="text-[12px]" style={{ color: '#444444' }}>
                                {asset.cameraHint}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetLightbox('product', asset.id)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                            }}
                          >
                            <i className="ri-zoom-in-line text-[11px] mr-1" />
                            放大
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssetDetail('product', asset.id)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#1D1D1F', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                            }}
                          >
                            <i className="ri-information-line text-[11px] mr-1" />
                            查看详情
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetEditor('product', asset.id)}
                            className="py-2 rounded-lg text-[11.5px] border border-[#EAEAEA] bg-white"
                          >
                            <i className="ri-edit-line text-[11px] mr-1" />
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssetEditor('product', asset.id)}
                            className="py-2 rounded-lg text-[11.5px] border border-dashed border-[#D1D1D6] bg-[#F7F8FA]"
                          >
                            <i className="ri-upload-2-line text-[11px] mr-1" />
                            上传参考图
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {phase === 'ready' && assetsPageViewModelEmpty(viewModel) && !emptyHint ? (
                <p className="py-12 text-center text-[13px] text-[#8E8E93]">暂无资产条目。若刚完成剧本，请稍候或点击上方重试。</p>
              ) : null}

              {nextStepError ? (
                <div
                  className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
                  role="alert"
                >
                  {nextStepError}
                </div>
              ) : null}

              <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid #EAEAEA' }}>
                <button
                  type="button"
                  onClick={() => navigate(withProjectQuery('/short-drama/story-blueprint', effectiveProjectId))}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13.5px] cursor-pointer whitespace-nowrap transition-all duration-200"
                  style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                  }}
                >
                  <i className="ri-arrow-left-line text-[13px]" />
                  上一步
                </button>
                <button
                  type="button"
                  disabled={!canClickNext || nextStepBusy}
                  title={
                    canClickNext
                      ? canProceedToStep4
                        ? undefined
                        : '将先补齐资产规范（如需要），再进入下一步'
                      : '项目未就绪或缺少项目 ID'
                  }
                  onClick={() => {
                    void (async () => {
                      const r = await handleNextStep();
                      if (r.shouldNavigate) {
                        console.info(
                          `[FE_STEP3_NEXT_NAVIGATE] projectId=${effectiveProjectId ?? 'null'} status=${r.statusAfter ?? 'n/a'} target=/short-drama/step4`,
                        );
                        navigate(withProjectQuery('/short-drama/step4', effectiveProjectId));
                      }
                    })();
                  }}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: '#1D1D1F', color: '#ffffff' }}
                  onMouseEnter={(e) => {
                    if (!canClickNext || nextStepBusy) return;
                    (e.currentTarget as HTMLElement).style.background = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                  }}
                >
                  {nextStepBusy ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-[15px]" aria-hidden />
                      处理中…
                    </>
                  ) : (
                    <>
                      下一步：生成片段脚本
                      <i className="ri-arrow-right-line text-[13px]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}

        {isGeneratingAssets ? (
          <div className="px-6 lg:px-10 py-7">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={`skeleton-${activeTab}-${i}`} className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
                  <div className="h-48 animate-pulse bg-[#ECEDEF]" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#ECEDEF]" />
                    <div className="h-3 w-full animate-pulse rounded bg-[#F1F2F4]" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-[#F1F2F4]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <AssetLightbox item={lightbox} onClose={() => setLightbox(null)} />
      <AssetInteractionModal
        asset={interactionAsset}
        mode={interactionMode}
        saving={editorSaving}
        regenerating={editorRegenerating}
        onClose={() => setInteractionAsset(null)}
        onOpenEdit={() => setInteractionMode('edit')}
        onSave={saveAssetEdit}
        onRegenerate={regenerateAsset}
        onReferenceSelected={({ name }) => {
          if (!interactionAsset || effectiveProjectId == null) return;
          console.info('[FRONT_ASSET_REFERENCE_UPLOAD_SELECTED]', {
            project_id: effectiveProjectId,
            asset_type: interactionAsset.kind,
            asset_id: interactionAsset.id,
            file_name: name,
          });
        }}
      />
    </div>
  );
}
