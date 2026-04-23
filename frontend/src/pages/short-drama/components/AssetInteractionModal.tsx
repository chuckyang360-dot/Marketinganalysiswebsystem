import { useCallback, useEffect, useMemo, useState } from 'react';

export type AssetKind = 'character' | 'scene' | 'product';

export type AssetInteractionEntity = {
  id: number;
  kind: AssetKind;
  name: string;
  typeLabel: string;
  narrativeFunctionLabel?: string;
  description: string;
  prompt: string;
  imageUrl: string | null;
  sourceLabel: '系统生成' | '用户上传' | '用户参考图';
  voiceStyle?: string;
  productUsage?: string;
  assetTypeLabel?: string;
  imageCount?: number;
  imageLimit?: number;
  images?: { id: number; imageUrl: string; isCover: boolean; label?: string }[];
  referenceImages?: { id: number; fileUrl: string; fileName?: string }[];
  selectedImageId?: number | null;
  tags?: string[];
  typeFields?: Record<string, unknown>;
  rawSnapshot?: Record<string, unknown>;
  structureSummary?: {
    sceneStage: string;
    sceneForm: string;
    visualAnchor: string;
    variantCount: string;
    source: string;
  };
};

export type AssetEditorPayload = {
  name: string;
  typeLabel: string;
  description: string;
  prompt: string;
  voiceStyle?: string;
  productUsage?: string;
};

export type AssetNormalFieldKey = 'name' | 'typeLabel' | 'description' | 'voiceStyle' | 'productUsage';

type Props = {
  asset: AssetInteractionEntity | null;
  saving: boolean;
  regenerating: boolean;
  onClose: () => void;
  /** 单个普通字段 PATCH（仅传需要更新的字段） */
  onSaveNormalField: (field: AssetNormalFieldKey, payload: AssetEditorPayload) => Promise<void>;
  /** 底部全局保存：一次提交所有与 baseline 不同的普通字段 */
  onSaveAllNormal: (payload: AssetEditorPayload) => Promise<void>;
  /** Prompt：先更新 visual_prompt 再触发生图 */
  onRegeneratePrompt: (payload: AssetEditorPayload) => Promise<void>;
  onSelectImage?: (imageId: number) => void;
  onAddImage?: () => void;
};

type Baseline = {
  name: string;
  typeLabel: string;
  description: string;
  prompt: string;
  voiceStyle: string;
  productUsage: string;
};

function buildPayload(
  asset: AssetInteractionEntity,
  state: {
    name: string;
    typeLabel: string;
    description: string;
    prompt: string;
    voiceStyle: string;
    productUsage: string;
  },
): AssetEditorPayload {
  return {
    name: state.name,
    typeLabel: state.typeLabel,
    description: state.description,
    prompt: state.prompt,
    voiceStyle: asset.kind === 'character' ? state.voiceStyle : undefined,
    productUsage: asset.kind === 'product' ? state.productUsage : undefined,
  };
}

export function AssetInteractionModal({
  asset,
  saving,
  regenerating,
  onClose,
  onSaveNormalField,
  onSaveAllNormal,
  onRegeneratePrompt,
  onSelectImage,
  onAddImage,
}: Props) {
  const [name, setName] = useState('');
  const [typeLabel, setTypeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('');
  const [productUsage, setProductUsage] = useState('');
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  const [editingField, setEditingField] = useState<'name' | 'typeLabel' | 'description' | 'prompt' | 'voiceStyle' | 'productUsage' | null>(
    null,
  );
  const [fieldDraft, setFieldDraft] = useState('');

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [showSummarySection, setShowSummarySection] = useState(false);
  const [showRawSection, setShowRawSection] = useState(false);
  useEffect(() => {
    if (!asset) {
      setBaseline(null);
      setEditingField(null);
      return;
    }
    const b: Baseline = {
      name: asset.name || '',
      typeLabel: asset.typeLabel || '',
      description: asset.description || '',
      prompt: asset.prompt || '',
      voiceStyle: asset.voiceStyle || '',
      productUsage: asset.productUsage || '',
    };
    setName(b.name);
    setTypeLabel(b.typeLabel);
    setDescription(b.description);
    setPrompt(b.prompt);
    setVoiceStyle(b.voiceStyle);
    setProductUsage(b.productUsage);
    setBaseline(b);
    setEditingField(null);
    setShowSummarySection(false);
    setShowRawSection(false);
  }, [asset]);

  const payload = useMemo(() => {
    if (!asset) return null;
    return buildPayload(asset, { name, typeLabel, description, prompt, voiceStyle, productUsage });
  }, [asset, name, typeLabel, description, prompt, voiceStyle, productUsage]);

  const normalDirty = useMemo(() => {
    if (!baseline) return false;
    if (name !== baseline.name) return true;
    if (typeLabel !== baseline.typeLabel) return true;
    if (description !== baseline.description) return true;
    if (voiceStyle !== baseline.voiceStyle) return true;
    if (productUsage !== baseline.productUsage) return true;
    return false;
  }, [baseline, name, typeLabel, description, voiceStyle, productUsage]);

  /** 含「正在编辑 Prompt 但未点重新生成」的草稿与 baseline 不一致 */
  const promptDirty =
    baseline != null &&
    (prompt !== baseline.prompt || (editingField === 'prompt' && fieldDraft !== baseline.prompt));

  const isDirty = normalDirty || promptDirty;

  const beginEdit = useCallback(
    (field: typeof editingField) => {
      if (!asset || !field) return;
      if (field === 'prompt') {
        console.info('FRONT_ASSET_PROMPT_EDIT_STARTED', { asset_type: asset.kind, asset_id: asset.id });
      } else if (field !== null) {
        console.info('FRONT_ASSET_FIELD_EDIT_STARTED', { asset_type: asset.kind, asset_id: asset.id, field });
      }
      setEditingField(field);
      if (field === 'name') setFieldDraft(name);
      else if (field === 'typeLabel') setFieldDraft(typeLabel);
      else if (field === 'description') setFieldDraft(description);
      else if (field === 'prompt') setFieldDraft(prompt);
      else if (field === 'voiceStyle') setFieldDraft(voiceStyle);
      else if (field === 'productUsage') setFieldDraft(productUsage);
    },
    [asset, name, typeLabel, description, prompt, voiceStyle, productUsage],
  );

  const cancelFieldEdit = useCallback(() => {
    if (editingField && editingField !== 'prompt') {
      console.info('FRONT_ASSET_FIELD_SAVE_CANCELLED', { field: editingField });
    }
    setEditingField(null);
  }, [editingField]);

  const applyFieldValue = useCallback(
    (field: NonNullable<typeof editingField>, value: string) => {
      if (field === 'name') setName(value);
      else if (field === 'typeLabel') setTypeLabel(value);
      else if (field === 'description') setDescription(value);
      else if (field === 'prompt') setPrompt(value);
      else if (field === 'voiceStyle') setVoiceStyle(value);
      else if (field === 'productUsage') setProductUsage(value);
    },
    [],
  );

  const commitBaselineField = useCallback((field: AssetNormalFieldKey, value: string) => {
    setBaseline((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const saveNormalFieldInline = useCallback(async () => {
    if (!asset || !payload || !editingField || editingField === 'prompt') return;
    const field = editingField as AssetNormalFieldKey;
    const merged: AssetEditorPayload = { ...payload };
    if (field === 'name') merged.name = fieldDraft;
    else if (field === 'typeLabel') merged.typeLabel = fieldDraft;
    else if (field === 'description') merged.description = fieldDraft;
    else if (field === 'voiceStyle') merged.voiceStyle = fieldDraft;
    else if (field === 'productUsage') merged.productUsage = fieldDraft;
    try {
      await onSaveNormalField(field, merged);
      applyFieldValue(field, fieldDraft);
      commitBaselineField(field, fieldDraft);
      console.info('FRONT_ASSET_FIELD_SAVE_CONFIRMED', { asset_type: asset.kind, asset_id: asset.id, field });
      setEditingField(null);
    } catch {
      /* parent alerts */
    }
  }, [asset, payload, editingField, fieldDraft, onSaveNormalField, applyFieldValue, commitBaselineField]);

  const saveAllNormal = useCallback(async () => {
    if (!asset || !payload) return;
    console.info('FRONT_ASSET_DETAIL_SAVE_ALL_STARTED', { asset_type: asset.kind, asset_id: asset.id });
    try {
      await onSaveAllNormal(payload);
      setBaseline((prev) =>
        prev
          ? {
              ...prev,
              name,
              typeLabel,
              description,
              voiceStyle,
              productUsage,
            }
          : null,
      );
      console.info('FRONT_ASSET_DETAIL_SAVE_ALL_SUCCEEDED', { asset_type: asset.kind, asset_id: asset.id });
    } catch {
      console.info('FRONT_ASSET_DETAIL_SAVE_ALL_FAILED', { asset_type: asset.kind, asset_id: asset.id });
    }
  }, [asset, payload, onSaveAllNormal, name, typeLabel, description, voiceStyle, productUsage]);

  const runRegeneratePrompt = useCallback(async () => {
    if (!asset || !payload) return;
    const next = { ...payload, prompt: fieldDraft };
    console.info('FRONT_ASSET_PROMPT_REGENERATE_STARTED', { asset_type: asset.kind, asset_id: asset.id });
    try {
      await onRegeneratePrompt(next);
      setPrompt(fieldDraft);
      setBaseline((prev) => (prev ? { ...prev, prompt: fieldDraft } : prev));
      console.info('FRONT_ASSET_PROMPT_REGENERATE_SUCCEEDED', { asset_type: asset.kind, asset_id: asset.id });
      setEditingField(null);
    } catch (e) {
      console.info('FRONT_ASSET_PROMPT_REGENERATE_FAILED', {
        asset_type: asset.kind,
        asset_id: asset.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, [asset, payload, fieldDraft, onRegeneratePrompt]);

  const requestClose = useCallback(() => {
    console.info('FRONT_ASSET_DETAIL_CLOSE_ATTEMPT', { dirty: isDirty });
    if (!isDirty) {
      onClose();
      return;
    }
    setLeaveOpen(true);
  }, [isDirty, onClose]);

  const discardAndClose = useCallback(() => {
    console.info('FRONT_ASSET_DETAIL_CLOSE_WITHOUT_SAVE');
    setLeaveOpen(false);
    onClose();
  }, [onClose]);

  const saveAndClose = useCallback(async () => {
    console.info('FRONT_ASSET_DETAIL_SAVE_AND_CLOSE');
    setLeaveOpen(false);
    try {
      if (normalDirty && payload) {
        console.info('FRONT_ASSET_DETAIL_SAVE_ALL_STARTED', { asset_type: asset?.kind, asset_id: asset?.id });
        await onSaveAllNormal(payload);
        console.info('FRONT_ASSET_DETAIL_SAVE_ALL_SUCCEEDED', { asset_type: asset?.kind, asset_id: asset?.id });
      }
      if (baseline && prompt !== baseline.prompt) {
        setPrompt(baseline.prompt);
      }
      onClose();
    } catch {
      console.info('FRONT_ASSET_DETAIL_SAVE_ALL_FAILED', { asset_type: asset?.kind, asset_id: asset?.id });
    }
  }, [normalDirty, payload, onSaveAllNormal, baseline, prompt, onClose, asset?.kind, asset?.id]);

  if (!asset || !payload || !baseline) return null;

  const images = asset.images ?? [];
  const selectedImage = images.find((x) => x.id === asset.selectedImageId) ?? images[0];
  const previewSrc = selectedImage?.imageUrl ?? asset.imageUrl;
  const canAddImage = (asset.imageCount ?? images.length) < (asset.imageLimit ?? 6);
  const roleLabelTitle = asset.kind === 'character' ? '角色定位' : asset.kind === 'scene' ? '场景定位' : '产品定位';
  const summary = asset.structureSummary ?? {
    sceneStage: '未标注剧情阶段',
    sceneForm: '未标注场景形态',
    visualAnchor: '未设置',
    variantCount: '0',
    source: asset.sourceLabel,
  };

  const rowClass = 'rounded-xl border border-[#EAEAEA] bg-white px-3 py-2.5 transition-colors hover:border-[#D1D1D6]';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white lg:flex-row lg:items-stretch">
        <div className="flex h-[min(36vh,280px)] w-full shrink-0 flex-col border-b border-[#D8DADF] bg-[#E4E6EA] p-0 sm:h-[min(38vh,300px)] lg:h-auto lg:min-h-[360px] lg:max-h-[90vh] lg:w-[min(42%,420px)] lg:min-w-[260px] lg:self-stretch lg:border-b-0 lg:border-r lg:border-[#D8DADF]">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {regenerating ? (
              <div className="flex flex-col items-center justify-center gap-2 px-3">
                <i className="ri-loader-4-line animate-spin text-2xl text-[#1D1D1F]" aria-hidden />
                <span className="text-center text-[12px] text-[#6E6E73]">正在重新生成图像…</span>
              </div>
            ) : previewSrc ? (
              <img
                src={previewSrc}
                alt={asset.name}
                className="block max-h-full max-w-full object-contain object-center"
              />
            ) : (
              <div className="px-3 text-center text-[13px] text-[#8E8E93]">暂无预览图</div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#D8DADF] bg-[#F5F5F7] p-3">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                className={`h-12 w-12 overflow-hidden rounded border ${img.id === selectedImage?.id ? 'border-[#1D1D1F]' : 'border-[#EAEAEA]'}`}
                onClick={() => onSelectImage?.(img.id)}
              >
                <img src={img.imageUrl} alt={img.label ?? 'thumb'} className="h-full w-full object-cover" />
              </button>
            ))}
            {canAddImage ? (
              <button
                type="button"
                onClick={onAddImage}
                className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-[#B8BBC2] bg-white text-[24px] leading-none text-[#6E6E73]"
                aria-label="添加图片"
                title="添加图片"
              >
                +
              </button>
            ) : null}
          </div>
        </div>

        {/* 右侧：header + 可滚动字段区（min-h-0）+ 贴底操作区 */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-[#EAEAEA] px-5 py-4">
            <h3 className="text-[18px] font-black text-[#1D1D1F]">资产详情</h3>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px] text-[#444444]"
            >
              关闭
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="mb-2 text-[12px] text-[#6E6E73]">
              图像来源：<span className="font-medium text-[#444444]">{asset.sourceLabel}</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* 名称 */}
              <div className={rowClass}>
                <div className="text-[11px] font-medium text-[#8E8E93]">名称</div>
                {editingField === 'name' ? (
                  <div className="mt-2 space-y-2">
                    <input
                      value={fieldDraft}
                      onChange={(e) => setFieldDraft(e.target.value)}
                      className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveNormalFieldInline()}
                        className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button type="button" onClick={cancelFieldEdit} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="mt-1 w-full text-left text-[13px] text-[#1D1D1F]" onClick={() => beginEdit('name')}>
                    {name || '—'}
                  </button>
                )}
              </div>

              {/* 角色定位 / 场景定位 / 产品定位 */}
              <div className={rowClass}>
                <div className="text-[11px] font-medium text-[#8E8E93]">{roleLabelTitle}</div>
                {editingField === 'typeLabel' ? (
                  <div className="mt-2 space-y-2">
                    <input
                      value={fieldDraft}
                      onChange={(e) => setFieldDraft(e.target.value)}
                      className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveNormalFieldInline()}
                        className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button type="button" onClick={cancelFieldEdit} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-1 w-full text-left text-[13px] text-[#1D1D1F]"
                    onClick={() => beginEdit('typeLabel')}
                  >
                    {typeLabel || '—'}
                  </button>
                )}
              </div>

              {asset.narrativeFunctionLabel ? (
                <div className={rowClass}>
                  <div className="text-[11px] font-medium text-[#8E8E93]">剧情作用</div>
                  <div className="mt-1 text-[13px] text-[#444444]">{asset.narrativeFunctionLabel}</div>
                </div>
              ) : null}

              {/* 描述 */}
              <div className={rowClass}>
                <div className="text-[11px] font-medium text-[#8E8E93]">描述</div>
                {editingField === 'description' ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={fieldDraft}
                      onChange={(e) => setFieldDraft(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveNormalFieldInline()}
                        className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button type="button" onClick={cancelFieldEdit} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-1 w-full text-left text-[13px] leading-relaxed text-[#444444]"
                    onClick={() => beginEdit('description')}
                  >
                    {description || '—'}
                  </button>
                )}
              </div>

              {asset.kind === 'character' ? (
                <div className={rowClass}>
                  <div className="text-[11px] font-medium text-[#8E8E93]">音色（占位）</div>
                  {editingField === 'voiceStyle' ? (
                    <div className="mt-2 space-y-2">
                      <input
                        value={fieldDraft}
                        onChange={(e) => setFieldDraft(e.target.value)}
                        placeholder="暂未开放后端能力"
                        className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void saveNormalFieldInline()}
                          className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        >
                          保存
                        </button>
                        <button type="button" onClick={cancelFieldEdit} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]">
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-1 w-full text-left text-[13px] text-[#444444]"
                      onClick={() => beginEdit('voiceStyle')}
                    >
                      {voiceStyle || '—'}
                    </button>
                  )}
                </div>
              ) : null}

              {asset.kind === 'product' ? (
                <div className={rowClass}>
                  <div className="text-[11px] font-medium text-[#8E8E93]">产品使用方式</div>
                  {editingField === 'productUsage' ? (
                    <div className="mt-2 space-y-2">
                      <input
                        value={fieldDraft}
                        onChange={(e) => setFieldDraft(e.target.value)}
                        className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void saveNormalFieldInline()}
                          className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        >
                          保存
                        </button>
                        <button type="button" onClick={cancelFieldEdit} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]">
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-1 w-full text-left text-[13px] text-[#444444]"
                      onClick={() => beginEdit('productUsage')}
                    >
                      {productUsage || '—'}
                    </button>
                  )}
                </div>
              ) : null}

              <div className={rowClass}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setShowSummarySection((v) => !v)}
                >
                  <span className="text-[11px] font-medium text-[#8E8E93]">结构摘要信息</span>
                  <i className={`${showSummarySection ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-[15px] text-[#8E8E93]`} />
                </button>
                {showSummarySection ? (
                  <div className="mt-2 space-y-1 text-[13px] text-[#444444]">
                    <div>剧情阶段：{summary.sceneStage}</div>
                    <div>场景形态：{summary.sceneForm}</div>
                    <div>锚点图：{summary.visualAnchor}</div>
                    <div>素材数量：{summary.variantCount}</div>
                    <div>来源：{summary.source}</div>
                  </div>
                ) : null}
              </div>

              <div className={rowClass}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setShowRawSection((v) => !v)}
                >
                  <span className="text-[11px] font-medium text-[#8E8E93]">查看技术细节</span>
                  <i className={`${showRawSection ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-[15px] text-[#8E8E93]`} />
                </button>
                {showRawSection ? (
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="text-[11px] font-medium text-[#8E8E93]">图像描述词</div>
                      {editingField === 'prompt' ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={fieldDraft}
                            onChange={(e) => setFieldDraft(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={regenerating || saving}
                              onClick={() => void runRegeneratePrompt()}
                              className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                            >
                              {regenerating ? '生成中…' : '重新生成'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFieldDraft(prompt);
                                setEditingField(null);
                              }}
                              className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="mt-1 w-full text-left text-[13px] leading-relaxed text-[#444444]"
                          onClick={() => beginEdit('prompt')}
                        >
                          {prompt || '—'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

          </div>

          <div className="shrink-0 border-t border-[#EAEAEA] bg-white px-5 py-4">
            <p className="mb-2 text-[11px] text-[#8E8E93]">底部保存仅提交名称、类型、描述、音色、产品使用方式等；不包含 Prompt（Prompt 请使用字段内「重新生成」）。</p>
            <button
              type="button"
              disabled={saving || !normalDirty}
              onClick={() => void saveAllNormal()}
              className="w-full rounded-xl bg-[#1D1D1F] py-3 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {leaveOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xl">
            <p className="text-[15px] font-semibold text-[#1D1D1F]">有未保存的更改</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6E6E73]">
              关闭前请选择：可留在当前页继续编辑，或放弃全部未提交修改；若仅保存名称、类型、描述等普通字段，请使用下方「仅保存普通字段并关闭」。
            </p>
            {promptDirty ? (
              <div
                className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-950"
                role="status"
              >
                <span className="font-semibold">关于 Prompt：</span>
                Prompt 修改需点击「重新生成」才会生效，关闭时不会自动保存 Prompt。
              </div>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setLeaveOpen(false)}
                className="w-full rounded-lg border border-[#EAEAEA] py-2.5 text-[13px] font-medium text-[#444444]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={discardAndClose}
                className="w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] py-2.5 text-[13px] font-medium text-[#444444]"
              >
                不保存并关闭
              </button>
              <div className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3">
                <button
                  type="button"
                  onClick={() => void saveAndClose()}
                  className="w-full rounded-lg bg-[#1D1D1F] py-2.5 text-[13px] font-semibold text-white"
                >
                  仅保存普通字段并关闭
                </button>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-[#8E8E93]">
                  不会保存 Prompt；未在字段内点击「重新生成」的 Prompt 修改将丢弃。
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

