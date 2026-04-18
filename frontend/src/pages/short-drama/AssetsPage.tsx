import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SDWorkflowNav } from './components/SDWorkflowNav';
import { AssetLightbox, type LightboxItem } from './components/AssetLightbox';
import { useAssetsPage } from './hooks/useAssetsPage';
import type { AssetsPageCharacterVm, AssetsPageSceneVm } from './types/shortDrama';
import {
  ASSETS_PAGE_MESSAGES,
  assetsPageViewModelEmpty,
} from './utils/assetsPageAdapters';
import { SHORT_DRAMA_UI } from './utils/shortDramaUiCopy';
import { withProjectQuery } from './utils/shortDramaRoutes';

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

  const flashNotice = useCallback((msg: string) => {
    setCapabilityNotice(msg);
    window.setTimeout(() => setCapabilityNotice(null), 4200);
  }, []);

  const canProceedToStep4 =
    effectiveProjectId != null &&
    pipeline?.project?.status != null &&
    CAN_LEAVE_ASSETS_STATUSES.has(pipeline.project.status);

  useEffect(() => {
    const c = pipeline?.assets?.characters?.length ?? 0;
    const s = pipeline?.assets?.scenes?.length ?? 0;
    const p = pipeline?.assets?.products?.length ?? 0;
    console.info(
      `[FE_STEP3_ENTER] projectId=${effectiveProjectId ?? 'null'} projectStatus=${pipeline?.project?.status ?? 'n/a'} hasCharacters=${c > 0} hasScenes=${s > 0} hasProducts=${p > 0} characterCount=${c} sceneCount=${s} productCount=${p}`,
    );
  }, [effectiveProjectId, pipeline]);

  const TABS = useMemo(
    () =>
      [
        { key: 'characters' as const, label: '角色', count: viewModel.characters.length, icon: 'ri-user-star-line' },
        { key: 'scenes' as const, label: '场景', count: viewModel.scenes.length, icon: 'ri-landscape-line' },
        { key: 'assets' as const, label: '产品资产', count: viewModel.products.length, icon: 'ri-archive-line' },
      ] as const,
    [viewModel],
  );

  const openCharLightbox = useCallback((char: AssetsPageCharacterVm) => {
    setLightbox({
      img: char.img,
      name: char.name,
      subtitle: char.role,
      desc: char.desc,
      tags: char.tags,
      orientation: 'portrait',
      meta: [
        { icon: 'ri-mic-line', label: '音色风格', value: char.voice },
        {
          icon: 'ri-image-line',
          label: '图像来源',
          value: char.hasRealImage ? '后端 image_url' : '占位图（无 URL）',
        },
        {
          icon: 'ri-palette-line',
          label: '视觉 Prompt',
          value: char.visualPrompt.length > 180 ? `${char.visualPrompt.slice(0, 180)}…` : char.visualPrompt,
        },
      ],
    });
  }, []);

  const openSceneLightbox = useCallback((scene: AssetsPageSceneVm) => {
    setLightbox({
      img: scene.img,
      name: scene.name,
      subtitle: scene.type,
      desc: scene.desc,
      orientation: 'landscape',
      meta: [
        { icon: 'ri-landscape-line', label: '场景类型', value: scene.type },
        {
          icon: 'ri-image-line',
          label: '图像来源',
          value: scene.hasRealImage ? '后端 image_url' : '占位图（无 URL）',
        },
        {
          icon: 'ri-palette-line',
          label: '视觉 Prompt',
          value: scene.visualPrompt.length > 180 ? `${scene.visualPrompt.slice(0, 180)}…` : scene.visualPrompt,
        },
      ],
    });
  }, []);

  const showDataGrids = phase !== 'no_project' && phase !== 'error';

  return (
    <div className="min-h-screen" style={{ background: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
      <SDWorkflowNav currentStep={3} projectName={projectName} projectId={effectiveProjectId} />

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
            {effectiveProjectId != null ? (
              <p className="mt-2 text-[11px] font-mono text-[#AEAEB2]">project_id: {effectiveProjectId}</p>
            ) : null}
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
            {SHORT_DRAMA_UI.generating.assetSpecs}
          </div>
        ) : null}

        {phase === 'generating_images' ? (
          <div className="mx-6 mt-4 flex items-center gap-2 text-[13px] text-[#8E8E93] lg:mx-10">
            <i className="ri-loader-4-line animate-spin text-[16px] text-[#047857]" aria-hidden />
            {SHORT_DRAMA_UI.generating.assetImages}
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
                        onClick={() => openCharLightbox(char)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openCharLightbox(char);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <img src={char.img} alt={char.name} className="w-full h-full object-contain" />
                        {!char.hasRealImage ? (
                          <span
                            className="absolute top-2.5 right-2.5 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.92)',
                              color: '#8E8E93',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            占位
                          </span>
                        ) : null}
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
                            title={ASSETS_PAGE_MESSAGES.regenSingle}
                            onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.regenSingle)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                            }}
                          >
                            <i className="ri-refresh-line text-[11px] mr-1" />
                            重新生成
                          </button>
                          <button
                            type="button"
                            onClick={() => openCharLightbox(char)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                            style={{ background: '#1D1D1F', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                            }}
                          >
                            <i className="ri-zoom-in-line text-[11px] mr-1" />
                            查看详情
                          </button>
                        </div>
                        <button
                          type="button"
                          title={ASSETS_PAGE_MESSAGES.upload}
                          className="w-full mt-2 py-2 rounded-lg text-[11.5px] cursor-pointer transition-all duration-200 whitespace-nowrap"
                          style={{ background: '#F7F8FA', color: '#8E8E93', border: '1.5px dashed #D1D1D6' }}
                          onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.upload)}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = '#1D1D1F';
                            (e.currentTarget as HTMLElement).style.color = '#1D1D1F';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = '#D1D1D6';
                            (e.currentTarget as HTMLElement).style.color = '#8E8E93';
                          }}
                        >
                          <i className="ri-upload-2-line text-[11px] mr-1" />
                          上传参考图
                        </button>
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
                        onClick={() => openSceneLightbox(scene)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openSceneLightbox(scene);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <img src={scene.img} alt={scene.name} className="w-full h-full object-cover object-center" />
                        {!scene.hasRealImage ? (
                          <span
                            className="absolute top-3 right-3 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.9)',
                              color: '#8E8E93',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            占位
                          </span>
                        ) : null}
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
                            title={ASSETS_PAGE_MESSAGES.regenSingle}
                            onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.regenSingle)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                            }}
                          >
                            <i className="ri-refresh-line text-[11px] mr-1" />
                            重新生成
                          </button>
                          <button
                            type="button"
                            onClick={() => openSceneLightbox(scene)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] font-medium cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#1D1D1F', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                            }}
                          >
                            <i className="ri-zoom-in-line text-[11px] mr-1" />
                            查看详情
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
                      <div className="relative w-full h-44 overflow-hidden" style={{ background: '#F7F8FA' }}>
                        <img src={asset.img} alt={asset.name} className="w-full h-full object-cover object-center" />
                        {!asset.hasRealImage ? (
                          <span
                            className="absolute top-2 right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.92)',
                              color: '#8E8E93',
                              border: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            占位
                          </span>
                        ) : null}
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
                            title={ASSETS_PAGE_MESSAGES.editProduct}
                            onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.editProduct)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#F7F8FA', color: '#444444', border: '1px solid #EAEAEA' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#EAEAEA';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#F7F8FA';
                            }}
                          >
                            <i className="ri-edit-line text-[11px] mr-1" />
                            编辑
                          </button>
                          <button
                            type="button"
                            title={ASSETS_PAGE_MESSAGES.regenSingle}
                            onClick={() => flashNotice(ASSETS_PAGE_MESSAGES.regenSingle)}
                            className="flex-1 py-2 rounded-lg text-[11.5px] cursor-pointer whitespace-nowrap transition-colors"
                            style={{ background: '#1D1D1F', color: '#ffffff' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = '#1D1D1F';
                            }}
                          >
                            <i className="ri-refresh-line text-[11px] mr-1" />
                            重新生成
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
      </div>

      <AssetLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
