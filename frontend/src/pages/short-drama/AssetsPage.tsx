import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SDWorkflowNav } from './components/SDWorkflowNav';
import { AssetLightbox, type LightboxItem } from './components/AssetLightbox';
import { AssetInteractionModal, type AssetEditorPayload, type AssetInteractionEntity, type AssetKind, type AssetNormalFieldKey } from './components/AssetInteractionModal';
import { useEffectiveShortDramaProjectId } from './hooks/useEffectiveShortDramaProjectId';
import { appendShortDramaAssetUploadedImages, createShortDramaAssetLibrary, generateShortDramaAssetImages, generateShortDramaAssetSpecs, getShortDramaAssetLibraryDetail, getShortDramaPipeline, listShortDramaAssetLibrary, regenerateShortDramaAssetLibrary, touchShortDramaProjectStep, updateShortDramaAssetLibrary } from './services/shortDramaApi';
import type { AssetLibraryItemDto } from './types/shortDramaApi';
import { withProjectQuery } from './utils/shortDramaRoutes';
import { buildRawStructureSnapshot, buildStructureSummary, resolveAssetRoleLabel, resolveAssetSourceLabel, resolveNarrativeFunctionLabel, resolveTypeFields, resolveVisualAnchorImageId, resolveVisualAnchorImageUrl } from './utils/assetSpecDisplay';

type TabType = 'characters' | 'scenes' | 'assets';
type Step3AutoPhase = 'idle' | 'checking' | 'generating_specs' | 'generating_images' | 'ready' | 'error';
type AddMode = 'text' | 'upload';
type AddDraft = { name: string; prompt: string };

const toKind = (assetType: string): AssetKind => (assetType === 'scene' ? 'scene' : assetType === 'product' ? 'product' : 'character');
const tabToKind = (tab: TabType): AssetKind => (tab === 'scenes' ? 'scene' : tab === 'assets' ? 'product' : 'character');
const fallbackNameByTab: Record<TabType, string> = {
  characters: 'Character Asset',
  scenes: 'Scene Asset',
  assets: 'Product Asset',
};

function sanitizeAssetName(input: string): string {
  const blocked = new Set(['新增角色', '添加角色', '新增场景', '添加场景', '新增产品', '添加产品']);
  const trimmed = input.trim();
  return blocked.has(trimmed) ? '' : trimmed;
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return null;
}

function normalizeLibraryItem(row: AssetLibraryItemDto): AssetLibraryItemDto | null {
  const id = toPositiveInt((row as unknown as { id?: unknown }).id);
  if (id == null) {
    console.error('[S3_ASSET_INVALID_ROW_ID]', { row });
    return null;
  }
  return {
    ...row,
    id,
    cover_image_id: toPositiveInt((row as unknown as { cover_image_id?: unknown }).cover_image_id) ?? null,
    image_count: toPositiveInt((row as unknown as { image_count?: unknown }).image_count) ?? 0,
    tags: Array.isArray(row.tags) ? row.tags.filter((x): x is string => typeof x === 'string') : [],
    extra: (row.extra && typeof row.extra === 'object') ? row.extra : {},
    images: (row.images ?? [])
      .map((img) => {
        const imageId = toPositiveInt((img as unknown as { id?: unknown }).id);
        if (imageId == null) return null;
        return { ...img, id: imageId };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
    reference_images: (row.reference_images ?? [])
      .map((img) => {
        const imageId = toPositiveInt((img as unknown as { id?: unknown }).id);
        if (imageId == null) return null;
        return { ...img, id: imageId };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  };
}

function appendS3Debug(event: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __S3_DEBUG__?: Array<{ event: string; payload: Record<string, unknown> }> };
  if (!w.__S3_DEBUG__) w.__S3_DEBUG__ = [];
  w.__S3_DEBUG__.push({ event, payload });
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('文件读取失败'));
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
    r.readAsDataURL(file);
  });
}

function extractSemanticTokens(text: string): string[] {
  if (!text) return [];
  const zh = (text.match(/[\u4e00-\u9fff]{2,}/g) ?? []).map((x) => x.toLowerCase());
  const en = (text.toLowerCase().match(/[a-z][a-z0-9_-]{3,}/g) ?? []).map((x) => x.toLowerCase());
  return Array.from(new Set([...zh, ...en]));
}

function warnAssetDetailMismatch(row: AssetLibraryItemDto): void {
  const textCorpus = `${row.name || ''} ${row.description || ''} ${row.base_prompt || ''}`.trim();
  const imageCorpus = [
    ...(row.images ?? []).flatMap((img) => [img.image_url || '', img.prompt_snapshot || '']),
    ...(row.reference_images ?? []).flatMap((img) => [img.file_url || '', img.file_name || '']),
  ]
    .join(' ')
    .toLowerCase();
  const textTokens = extractSemanticTokens(textCorpus);
  if (!textTokens.length) return;
  const overlap = textTokens.filter((t) => imageCorpus.includes(t));
  if (!overlap.length) {
    console.warn('[ASSET_DETAIL_MISMATCH_WARNING]', {
      asset_id: row.id,
      project_id: row.project_id,
      asset_type: row.asset_type,
      name: row.name,
      description: row.description,
      text_tokens: textTokens.slice(0, 20),
      image_sample: imageCorpus.slice(0, 280),
    });
  }
}

export function ShortDramaAssetsPage() {
  const navigate = useNavigate();
  const { effectiveProjectId, projectName } = useEffectiveShortDramaProjectId();
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [data, setData] = useState<Record<TabType, AssetLibraryItemDto[]>>({ characters: [], scenes: [], assets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssetInteractionEntity | null>(null);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('text');
  const [draft, setDraft] = useState<AddDraft>({ name: '', prompt: '' });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [addPending, setAddPending] = useState<{ tab: TabType; mode: AddMode } | null>(null);
  const [working, setWorking] = useState(false);
  const [autoPhase, setAutoPhase] = useState<Step3AutoPhase>('idle');
  const [autoHint, setAutoHint] = useState<string | null>(null);
  const refUploadInput = useRef<HTMLInputElement>(null);
  const refTargetAssetId = useRef<number | null>(null);
  const uploadPickerRef = useRef<HTMLInputElement>(null);
  const autoRunProjectRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    if (!effectiveProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [characters, scenes, products] = await Promise.all([
        listShortDramaAssetLibrary(effectiveProjectId, 'character'),
        listShortDramaAssetLibrary(effectiveProjectId, 'scene'),
        listShortDramaAssetLibrary(effectiveProjectId, 'product'),
      ]);
      setData({
        characters: characters.assets.map(normalizeLibraryItem).filter((x): x is AssetLibraryItemDto => x !== null),
        scenes: scenes.assets.map(normalizeLibraryItem).filter((x): x is AssetLibraryItemDto => x !== null),
        assets: products.assets.map(normalizeLibraryItem).filter((x): x is AssetLibraryItemDto => x !== null),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [effectiveProjectId]);

  useEffect(() => {
    const run = async () => {
      const projectId = toPositiveInt(effectiveProjectId);
      console.info('[S3_AUTO_EFFECT_ENTER]', JSON.stringify({
        effective_project_id: effectiveProjectId,
        effective_project_id_type: typeof effectiveProjectId,
        normalized_project_id: projectId,
      }));
      if (!projectId) return;
      if (autoRunProjectRef.current === projectId) return;
      autoRunProjectRef.current = projectId;
      setAutoPhase('checking');
      setAutoHint('正在检查资产生成状态…');
      try {
        console.info('[S3_AUTO_PIPELINE_REQUEST]', JSON.stringify({ project_id: projectId }));
        const pipeline = await getShortDramaPipeline(projectId);
        console.info('[S3_AUTO_FLOW_CHECK]', JSON.stringify({
          project_id: projectId,
          project_status: pipeline.project.status,
          assets_rows_total: pipeline.asset_rows_total ?? null,
        }));
        if (pipeline.project.status === 'story_generated') {
          setAutoPhase('generating_specs');
          setAutoHint('正在自动生成角色/场景/产品资产规范…');
          console.info('[S3_AUTO_TRIGGER_SPECS]', JSON.stringify({ project_id: projectId, trigger: 'assets_page_auto' }));
          await generateShortDramaAssetSpecs(projectId, { trigger: 'auto' });
        }

        let pipelineAfterSpecs = await getShortDramaPipeline(projectId);
        if (pipelineAfterSpecs.project.status === 'asset_specs_generated') {
          setAutoPhase('generating_images');
          setAutoHint('正在生成资产图片，请稍候…');
          console.info('[S3_AUTO_TRIGGER_IMAGES]', JSON.stringify({ project_id: projectId }));
          await generateShortDramaAssetImages(projectId);
          pipelineAfterSpecs = await getShortDramaPipeline(projectId);
        }

        if (pipelineAfterSpecs.project.status === 'assets_rendering') {
          setAutoPhase('generating_images');
          setAutoHint('资产图片生成中，正在同步进度…');
        }

        await reload();
        setAutoPhase('ready');
        setAutoHint(null);
      } catch (e) {
        console.error('[S3_AUTO_FLOW_FAILED]', {
          project_id: projectId,
          error: e,
        });
        setAutoPhase('error');
        setAutoHint('资产自动生成失败，请点击重试或刷新页面。');
        await reload();
      } finally {
        if (autoRunProjectRef.current === projectId) autoRunProjectRef.current = null;
      }
    };
    void run();
  }, [effectiveProjectId, reload]);

  const openDetail = useCallback(async (rawAssetId: unknown, cardRow?: AssetLibraryItemDto) => {
    const projectId = toPositiveInt(effectiveProjectId);
    const assetId = toPositiveInt(rawAssetId);
    const openCtx = {
      card_row: cardRow,
      open_detail_arg: rawAssetId,
      open_detail_arg_type: typeof rawAssetId,
      normalized_asset_id: assetId,
      normalized_asset_id_type: typeof assetId,
      effective_project_id: effectiveProjectId,
      effective_project_id_type: typeof effectiveProjectId,
      normalized_project_id: projectId,
      normalized_project_id_type: typeof projectId,
    };
    console.info('[S3_DETAIL_OPEN_CLICKED]', JSON.stringify(openCtx));
    appendS3Debug('S3_DETAIL_OPEN_CLICKED', openCtx);
    if (projectId == null || assetId == null) {
      console.error('[S3_DETAIL_OPEN_INVALID_IDS]', { rawAssetId, effectiveProjectId, cardRow });
      window.alert('资产详情加载失败，请重试');
      return;
    }
    const requestUrl = `/api/short-drama/assets/specs/library/detail/${assetId}?project_id=${projectId}`;
    console.info('[S3_DETAIL_REQUEST]', JSON.stringify({ url: requestUrl, asset_id: assetId, project_id: projectId }));
    appendS3Debug('S3_DETAIL_REQUEST', { url: requestUrl, asset_id: assetId, project_id: projectId });
    try {
      const d = normalizeLibraryItem(await getShortDramaAssetLibraryDetail(projectId, assetId));
      if (!d) {
        console.error('[S3_DETAIL_INVALID_RESPONSE]', { projectId, assetId });
        window.alert('资产详情加载失败，请重试');
        return;
      }
      warnAssetDetailMismatch(d);
      const tf = (d.extra?.type_fields ?? {}) as Record<string, unknown>;
      const detailTypeLabel = resolveAssetRoleLabel(d);
      const anchorImage = resolveVisualAnchorImageUrl(d);
      const detailVm: AssetInteractionEntity = {
        id: d.id,
        kind: toKind(d.asset_type),
        name: d.name,
        typeLabel: detailTypeLabel,
        narrativeFunctionLabel: resolveNarrativeFunctionLabel(d),
        description: d.description ?? '',
        prompt: d.base_prompt ?? '',
        imageUrl: anchorImage,
        sourceLabel: resolveAssetSourceLabel(d),
        voiceStyle: typeof tf.personality === 'string' ? tf.personality : '',
        productUsage: typeof (tf.product_usage || tf.usage_mode) === 'string' ? String(tf.product_usage || tf.usage_mode) : '',
        imageCount: d.image_count,
        imageLimit: 6,
        images: d.images.map((x) => ({ id: x.id, imageUrl: x.image_url, isCover: x.is_cover, label: x.variant_label ?? undefined })),
        selectedImageId: resolveVisualAnchorImageId(d) ?? null,
        referenceImages: d.reference_images.map((x) => ({ id: x.id, fileUrl: x.file_url, fileName: x.file_name ?? undefined })),
        tags: d.tags ?? [],
        typeFields: resolveTypeFields(d),
        rawSnapshot: buildRawStructureSnapshot(d),
        structureSummary: buildStructureSummary(d),
      };
      console.info('[S3_DETAIL_MODAL_VM]', JSON.stringify(detailVm));
      if (typeof window !== 'undefined') {
        (window as Window & { __S3_LAST_DETAIL_VM__?: AssetInteractionEntity }).__S3_LAST_DETAIL_VM__ = detailVm;
      }
      setDetail(detailVm);
    } catch (e) {
      console.error('[S3_DETAIL_REQUEST_FAILED]', {
        rawAssetId,
        normalizedAssetId: assetId,
        projectId,
        requestUrl,
        error: e,
      });
      appendS3Debug('S3_DETAIL_REQUEST_FAILED', {
        raw_asset_id: rawAssetId,
        normalized_asset_id: assetId,
        project_id: projectId,
        request_url: requestUrl,
        error_message: e instanceof Error ? e.message : String(e),
      });
      window.alert('资产详情加载失败，请重试');
    }
  }, [effectiveProjectId]);

  const createLabel = activeTab === 'characters' ? '添加角色' : activeTab === 'scenes' ? '添加场景' : '添加产品';
  const currentRows = data[activeTab];
  const tabs = useMemo(() => ([
    { key: 'characters' as const, label: '角色', count: data.characters.length, icon: 'ri-user-star-line' },
    { key: 'scenes' as const, label: '场景', count: data.scenes.length, icon: 'ri-landscape-line' },
    { key: 'assets' as const, label: '产品资产', count: data.assets.length, icon: 'ri-archive-line' },
  ]), [data]);

  const submitAdd = useCallback(async () => {
    if (!effectiveProjectId) return;
    try {
      if (addMode === 'text') {
        if (!draft.prompt.trim()) throw new Error('请输入描述/指令');
        const k = tabToKind(activeTab);
        setAddPending({ tab: activeTab, mode: addMode });
        setShowCreate(false);
        setDraft({ name: '', prompt: '' });
        setUploadFiles([]);
        void (async () => {
          try {
            await createShortDramaAssetLibrary({
              project_id: effectiveProjectId,
              asset_type: k,
              name: sanitizeAssetName(draft.name) || fallbackNameByTab[activeTab],
              description: draft.prompt.trim(),
              base_prompt: draft.prompt.trim(),
              generate_count: 4,
              variant_directions: [],
              reference_images: [],
              type_fields: {},
            });
            await reload();
          } catch (e) {
            window.alert(e instanceof Error ? e.message : '创建失败');
          } finally {
            setAddPending(null);
          }
        })();
      } else {
        if (!uploadFiles.length) throw new Error('请先上传图片');
        const urls = await Promise.all(uploadFiles.map((f) => toDataUrl(f)));
        const k = tabToKind(activeTab);
        setAddPending({ tab: activeTab, mode: addMode });
        setShowCreate(false);
        setDraft({ name: '', prompt: '' });
        setUploadFiles([]);
        void (async () => {
          try {
            await createShortDramaAssetLibrary({
              project_id: effectiveProjectId,
              asset_type: k,
              name: sanitizeAssetName(draft.name) || fallbackNameByTab[activeTab],
              description: '用户上传图片（当前阶段仅展示原图）',
              base_prompt: '',
              generate_count: 0,
              variant_directions: [],
              reference_images: [],
              uploaded_images: uploadFiles.map((f, idx) => ({ file_name: f.name, file_url: urls[idx] })),
              type_fields: {},
              source: 'user_created',
            });
            await reload();
          } catch (e) {
            window.alert(e instanceof Error ? e.message : '创建失败');
          } finally {
            setAddPending(null);
          }
        })();
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '创建失败');
    }
  }, [effectiveProjectId, activeTab, addMode, draft, uploadFiles, createLabel, reload]);

  return (
    <div className="min-h-screen" style={{ background: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <SDWorkflowNav currentStep={3} projectName={projectName ?? undefined} projectId={effectiveProjectId} isDirty={false} onSaveDraft={async (intent) => {
        if (!effectiveProjectId) return false;
        try { await touchShortDramaProjectStep(effectiveProjectId, { step: 'step_3', save_intent: intent }); return true; } catch { return false; }
      }} />
      <div className="pt-14">
        <div className="px-6 lg:px-10 py-6 flex items-start justify-between" style={{ borderBottom: '1px solid #EAEAEA' }}>
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#8E8E93' }}>STEP 03</span>
            <h1 className="text-2xl font-black mt-0.5" style={{ fontFamily: "'Syne', sans-serif", color: '#1D1D1F' }}>角色与场景资产</h1>
            <p className="text-[13px] mt-1" style={{ color: '#8E8E93' }}>构建可复用的视觉资产库，统一整部短剧的视觉风格</p>
          </div>
        </div>
        <div className="px-6 lg:px-10 pt-5">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F5F5F7', border: '1px solid #EAEAEA' }}>
            {tabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium" style={{ background: activeTab === tab.key ? '#fff' : 'transparent', color: activeTab === tab.key ? '#1D1D1F' : '#8E8E93' }}>
                <i className={`${tab.icon} text-[13px]`} />{tab.label}<span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: '#EAEAEA' }}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 lg:px-10 py-7">
          {autoHint ? (
            <div className="mb-4 rounded-xl border border-[#EAEAEA] bg-[#F7F8FA] px-4 py-3 text-[13px] text-[#444444]">
              <span className="mr-2 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] text-[#8E8E93]">{autoPhase}</span>
              {autoHint}
            </div>
          ) : null}
          {loading ? <div className="text-[13px] text-[#8E8E93]">加载中…</div> : null}
          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {currentRows.map((row) => {
              const visualAnchor = resolveVisualAnchorImageUrl(row);
              const roleLabel = resolveAssetRoleLabel(row);
              return (
                <div key={row.id} className="flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #EAEAEA' }}>
                  <div
                    className="relative h-48 shrink-0 overflow-hidden"
                    style={{ background: '#F7F8FA', cursor: 'pointer' }}
                    onClick={() => visualAnchor && setLightbox({ img: visualAnchor, name: row.name })}
                    role="button"
                    tabIndex={0}
                  >
                    {visualAnchor ? <img src={visualAnchor} alt={row.name} className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-[#ECEDEF]" />}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex-1">
                      <div className="min-h-[42px]">
                        <h3
                          className="text-[14px] font-bold leading-[1.35]"
                          style={{
                            color: '#1D1D1F',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {row.name}
                        </h3>
                      </div>
                      <div className="mt-1 h-[24px] flex items-center justify-between">
                        <span className="text-[10px] rounded-full px-2 py-1" style={{ background: '#F5F5F7', color: '#6E6E73' }}>{roleLabel}</span>
                        <span className="text-[11px]" style={{ color: '#8E8E93' }}>{row.image_count}/6</span>
                      </div>
                      <div className="mt-2 min-h-[40px]">
                        <p
                          className="text-[12px] leading-relaxed"
                          style={{
                            color: '#6E6E73',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {row.description || '—'}
                        </p>
                      </div>
                      <div className="mt-2 h-[40px] flex items-center gap-1 overflow-hidden">
                        {row.images.slice(0, 3).map((img) => (
                          <img key={img.id} src={img.image_url} alt={img.variant_label ?? 'thumb'} className="h-9 w-9 shrink-0 rounded border border-[#EAEAEA] object-cover" />
                        ))}
                        {row.has_reference_images ? <span className="ml-1 text-[11px] text-[#0B8D5A]">有参考图</span> : <span className="ml-1 text-[11px] text-transparent">占位</span>}
                      </div>
                    </div>
                    <div className="mt-auto pt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="h-9 rounded-lg px-2 text-[11.5px] font-medium text-white"
                        style={{ background: '#1D1D1F' }}
                        onClick={() => void openDetail(row.id, row)}
                      >
                        查看详情
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-lg border border-dashed border-[#D1D1D6] bg-[#F7F8FA] px-2 text-[11.5px] font-medium text-[#444]"
                        onClick={() => { refTargetAssetId.current = row.id; refUploadInput.current?.click(); }}
                      >
                        上传参考图
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {addPending?.tab === activeTab ? (
              <div className="flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #EAEAEA' }}>
                <div className="h-48 animate-pulse bg-[#ECEDEF]" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex-1">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-[#ECEDEF]" />
                    <div className="mt-2 h-4 w-full animate-pulse rounded bg-[#F1F2F4]" />
                    <div className="mt-1 h-4 w-4/5 animate-pulse rounded bg-[#F1F2F4]" />
                  </div>
                  <div className="mt-auto pt-3 text-[12px] text-[#6E6E73]">
                    {addPending.mode === 'text' ? '正在生成资产图片，请稍候…' : '正在处理上传图片，请稍候…'}
                  </div>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D1D1D6] bg-[#FAFAFB] p-6 text-center"
              onClick={() => setShowCreate(true)}
            >
              <i className="ri-add-circle-line text-[26px] text-[#6E6E73]" />
              <div className="mt-2 text-[14px] font-semibold text-[#1D1D1F]">{createLabel}</div>
              <div className="mt-1 text-[12px] text-[#8E8E93]">文字输入或图片上传（二选一）</div>
            </button>
          </div>
          <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid #EAEAEA' }}>
            <button type="button" onClick={() => navigate(withProjectQuery('/short-drama/story-blueprint', effectiveProjectId))} className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13.5px]" style={{ background: '#F7F8FA', color: '#444', border: '1px solid #EAEAEA' }}><i className="ri-arrow-left-line text-[13px]" />上一步</button>
            <button type="button" disabled={!effectiveProjectId} onClick={() => navigate(withProjectQuery('/short-drama/step4', effectiveProjectId))} className="flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-semibold disabled:opacity-45" style={{ background: '#1D1D1F', color: '#fff' }}>下一步：生成片段脚本<i className="ri-arrow-right-line text-[13px]" /></button>
          </div>
        </div>
      </div>
      {autoPhase === 'generating_specs' || autoPhase === 'generating_images' ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <i className="ri-loader-4-line animate-spin text-[22px] text-[#1D1D1F]" />
              <div>
                <div className="text-[15px] font-semibold text-[#1D1D1F]">
                  {autoPhase === 'generating_specs' ? '正在生成资产规范' : '正在生成资产图片'}
                </div>
                <div className="text-[12px] text-[#6E6E73]">{autoHint ?? '请稍候…'}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-[#F1F2F4]" />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <input ref={refUploadInput} type="file" accept="image/*" className="hidden" onChange={(e) => void (async () => {
        const f = e.target.files?.[0]; e.target.value = ''; if (!f || !effectiveProjectId || refTargetAssetId.current == null) return;
        const assetId = refTargetAssetId.current; refTargetAssetId.current = null;
        await appendShortDramaAssetUploadedImages(assetId, {
          project_id: effectiveProjectId,
          uploaded_images: [{ file_name: f.name, file_url: await toDataUrl(f) }],
        });
        await reload(); if (detail?.id === assetId) await openDetail(assetId);
      })()} />

      <AssetLightbox item={lightbox} onClose={() => setLightbox(null)} />
      <AssetInteractionModal
        asset={detail}
        saving={working}
        regenerating={false}
        onClose={() => setDetail(null)}
        onSaveNormalField={async (field: AssetNormalFieldKey, payload: AssetEditorPayload) => {
          if (!effectiveProjectId || !detail) return;
          const latest = await getShortDramaAssetLibraryDetail(effectiveProjectId, detail.id);
          const tf = { ...((latest.extra?.type_fields ?? {}) as Record<string, unknown>) };
          if (field === 'typeLabel') tf.label = payload.typeLabel;
          if (field === 'voiceStyle') tf.personality = payload.voiceStyle ?? '';
          if (field === 'productUsage') tf.usage_mode = payload.productUsage ?? '';
          await updateShortDramaAssetLibrary(detail.id, {
            project_id: effectiveProjectId,
            ...(field === 'name' ? { name: payload.name } : {}),
            ...(field === 'description' ? { description: payload.description } : {}),
            ...(field === 'typeLabel' ? { tags: [payload.typeLabel] } : {}),
            type_fields: tf,
          });
          await reload(); await openDetail(detail.id);
        }}
        onSaveAllNormal={async (payload: AssetEditorPayload) => {
          if (!effectiveProjectId || !detail) return;
          setWorking(true);
          try {
            const latest = await getShortDramaAssetLibraryDetail(effectiveProjectId, detail.id);
            const tf = { ...((latest.extra?.type_fields ?? {}) as Record<string, unknown>) };
            if (detail.kind === 'character') tf.personality = payload.voiceStyle ?? '';
            if (detail.kind === 'product') tf.usage_mode = payload.productUsage ?? '';
            tf.label = payload.typeLabel;
            await updateShortDramaAssetLibrary(detail.id, {
              project_id: effectiveProjectId,
              name: payload.name,
              description: payload.description,
              tags: [payload.typeLabel],
              type_fields: tf,
            });
            await reload();
            await openDetail(detail.id);
          } finally { setWorking(false); }
        }}
        onRegeneratePrompt={async (payload: AssetEditorPayload) => {
          if (!effectiveProjectId || !detail) return;
          await updateShortDramaAssetLibrary(detail.id, { project_id: effectiveProjectId, base_prompt: payload.prompt });
          await regenerateShortDramaAssetLibrary({ project_id: effectiveProjectId, asset_id: detail.id, generate_count: 1, reuse_reference_images: true });
          await reload(); await openDetail(detail.id);
        }}
        onSelectImage={(imageId) => setDetail((prev) => (prev ? { ...prev, selectedImageId: imageId, imageUrl: prev.images?.find((x) => x.id === imageId)?.imageUrl ?? prev.imageUrl } : prev))}
        onAddImage={() => {
          if (!detail) return;
          refTargetAssetId.current = detail.id;
          refUploadInput.current?.click();
        }}
      />

      {showCreate ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#EAEAEA] bg-white p-5">
            <h3 className="text-[18px] font-black text-[#1D1D1F]">{createLabel}</h3>
            <div className="mt-3 flex gap-2">
              <button type="button" className={`rounded-lg px-3 py-1.5 text-[12px] ${addMode === 'text' ? 'bg-[#1D1D1F] text-white' : 'border border-[#EAEAEA] text-[#444]'}`} onClick={() => setAddMode('text')}>文字输入</button>
              <button type="button" className={`rounded-lg px-3 py-1.5 text-[12px] ${addMode === 'upload' ? 'bg-[#1D1D1F] text-white' : 'border border-[#EAEAEA] text-[#444]'}`} onClick={() => setAddMode('upload')}>图片上传</button>
            </div>
            <div className="mt-3 grid gap-2">
              <input className="rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="名称（可选）" value={draft.name} onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))} />
              {addMode === 'text' ? (
                <textarea className="rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="输入描述/指令（必填）" rows={4} value={draft.prompt} onChange={(e) => setDraft((s) => ({ ...s, prompt: e.target.value }))} />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {uploadFiles.map((f, idx) => <span key={`${f.name}-${idx}`} className="rounded bg-[#F5F5F7] px-2 py-1 text-[11px] text-[#444]">{f.name}</span>)}
                    {uploadFiles.length < 6 ? (
                      <button type="button" className="h-8 w-8 rounded border border-dashed border-[#B8BBC2] text-[18px] text-[#6E6E73]" onClick={() => uploadPickerRef.current?.click()}>+</button>
                    ) : null}
                  </div>
                  <input ref={uploadPickerRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => setUploadFiles((prev) => [...prev, ...Array.from(e.target.files || [])].slice(0, 6))} />
                  <p className="text-[11px] text-[#8E8E93]">当前阶段：上传后先直接展示用户原图，不做图片识别生成。</p>
                </>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[13px]" onClick={() => setShowCreate(false)}>取消</button>
              <button type="button" disabled={working} className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50" onClick={() => void submitAdd()}>{working ? '处理中…' : '创建'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
