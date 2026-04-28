import { useEffect, useMemo, useState } from 'react';

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
  description: string; // 统一作为“图片描述”
  prompt: string;
  storyUsage?: string;
  visualFeatures?: string;
  immutableStructure?: string;
  consistencyRequirements?: string;
  voiceStyle?: string;
  productUsage?: string;
};

export type AssetNormalFieldKey = 'name' | 'typeLabel' | 'description' | 'voiceStyle' | 'productUsage';

type Props = {
  asset: AssetInteractionEntity | null;
  saving: boolean;
  regenerating: boolean;
  onClose: () => void;
  onSaveNormalField: (field: AssetNormalFieldKey, payload: AssetEditorPayload) => Promise<void>;
  onSaveAllNormal: (payload: AssetEditorPayload) => Promise<void>;
  onRegeneratePrompt: (payload: AssetEditorPayload) => Promise<void>;
  onSelectImage?: (imageId: number) => void;
  onAddImage?: () => void;
};

function formatDisplayValue(value: unknown, fallback = '—'): string {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return fallback;
    if (
      text.includes("{'display':") ||
      text.includes('"display"') ||
      text.includes('source_trace') ||
      text.includes('field_meta') ||
      text.includes('conflict:') ||
      text.includes('brand:') ||
      text.includes('raw_')
    ) {
      return fallback;
    }
    return text;
  }
  if (Array.isArray(value)) {
    const out = value.map((item) => formatDisplayValue(item, '')).filter(Boolean);
    return out.length ? out.join('、') : fallback;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.display === 'string' && record.display.trim()) return record.display.trim();
    if (typeof record.description === 'string' && record.description.trim()) return record.description.trim();
    return fallback;
  }
  return String(value);
}

function getTypeFieldText(fields: Record<string, unknown> | undefined, keys: string[], fallback = '—'): string {
  const map = fields ?? {};
  for (const key of keys) {
    const text = formatDisplayValue(map[key], '');
    if (text && text !== '—') return text;
  }
  return fallback;
}

const PROMPT_META_PATTERNS: RegExp[] = [
  /market_visual_constraints/i,
  /visual_style_constraints/i,
  /provider_params/i,
  /prompt_snapshot/i,
  /source_visual_constraints/i,
  /scene identity normalized to reusable location/i,
  /removed plot\/action term/i,
  /\bjson\b/i,
  /\bschema\b/i,
  /\bprovider\b/i,
  /\bdebug\b/i,
  /\bmeta\b/i,
  /\bsource_trace\b/i,
  /\bfield_meta\b/i,
];

const EXECUTION_RULE_PATTERNS: RegExp[] = [
  /single coherent location/i,
  /single location only/i,
  /no collage/i,
  /no split-screen/i,
  /no multiple panels/i,
  /no montage/i,
  /no grid layout/i,
  /one coherent reusable background environment/i,
  /one single person only/i,
  /one character reference image/i,
  /single subject centered/i,
  /full body or half body portrait/i,
  /no multiple people/i,
  /no group photo/i,
  /no contact sheet/i,
  /no lineup/i,
  /no moodboard/i,
  /no character sheet with multiple variants/i,
  /product appearance cannot be altered/i,
  /\bmust remain\b/i,
  /ensure positive healthy outcomes/i,
  /avoid graphic dental problems/i,
];

function containsMetaOrRule(text: string): boolean {
  return [...PROMPT_META_PATTERNS, ...EXECUTION_RULE_PATTERNS].some((re) => re.test(text));
}

function normalizePromptPieces(pieces: string[]): string {
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const x of pieces) {
    const t = x.replace(/[;；/|]+/g, '，').replace(/\s+/g, ' ').replace(/^[-•\d.)\s]+/, '').trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    uniq.push(t);
  }
  return uniq.join('，');
}

function extractUsefulZhSegments(raw: string): string[] {
  const chunks = String(raw || '')
    .replace(/\r/g, '\n')
    .split(/[\n。！？;；]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const chunk of chunks) {
    if (containsMetaOrRule(chunk)) continue;
    const zhCount = (chunk.match(/[\u4e00-\u9fff]/g) || []).length;
    const enCount = (chunk.match(/[A-Za-z]/g) || []).length;
    if (zhCount >= 3) {
      out.push(chunk.replace(/[A-Za-z_][A-Za-z0-9_]*(?:\s*[:=]\s*[^，。；\n]+)?/g, '').trim());
      continue;
    }
    if (enCount > 18) continue;
  }
  return out.filter(Boolean);
}

function buildFallbackPrompt(asset: AssetInteractionEntity): string {
  const aspect = '9:16构图';
  const desc = cleanupMainDisplayText(asset.description) || '';
  if (asset.kind === 'character') {
    return normalizePromptPieces([
      '单一人物参考图',
      asset.typeLabel || '人物角色',
      desc || `${asset.name}，真实广告片质感`,
      '干净背景',
      '自然光',
      aspect,
    ]);
  }
  if (asset.kind === 'scene') {
    return normalizePromptPieces([
      `${asset.typeLabel || asset.name}场景`,
      desc || '干净明亮，真实广告片质感',
      '自然光',
      aspect,
      '不包含人物动作',
    ]);
  }
  return normalizePromptPieces([
    '产品主体参考图',
    asset.typeLabel || asset.name,
    desc || '标签清晰，真实产品摄影质感',
    '干净背景',
    aspect,
  ]);
}

/** 用户可编辑版提示词：剔除元信息/执行规则，只保留可读画面描述 */
function cleanEditableAssetPrompt(raw: string, asset: AssetInteractionEntity): string {
  const source = String(raw || '').trim();
  if (!source) return buildFallbackPrompt(asset);
  const lines = source
    .split(/\n/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((line) => !containsMetaOrRule(line))
    .map((line) => line.replace(/\b(raw_[a-z_]+|source_trace|field_meta)\b[:=].*/gi, '').trim())
    .filter(Boolean);
  const zhPieces = extractUsefulZhSegments(lines.join('\n'));
  const cleaned = normalizePromptPieces(zhPieces);
  if (cleaned) return cleaned;
  return buildFallbackPrompt(asset);
}

const EXECUTION_PATTERNS: RegExp[] = [
  /scene identity normalized to reusable location:\s*/gi,
  /removed plot\/action term:\s*/gi,
  /single coherent location:\s*/gi,
  /single location only/gi,
  /no collage/gi,
  /no split-screen/gi,
  /no multiple panels/gi,
  /no montage/gi,
  /no grid layout/gi,
  /no grid\b/gi,
  /one coherent reusable background environment/gi,
  /product appearance cannot be altered[^,.。;；]*/gi,
  /\bmust remain\b/gi,
  /ensure positive healthy outcomes[^,.。;；]*/gi,
  /avoid graphic dental problems[^,.。;；]*/gi,
  /no group photo/gi,
  /no contact sheet/gi,
  /no character sheet[^,.。;；]*/gi,
  /character sheet with multiple variants/gi,
  /\bone single person only\b/gi,
  /\bno multiple people\b/gi,
  /provider prompt/gi,
  /prompt_snapshot/gi,
  /market constraints?/gi,
  /visual style constraints?/gi,
  /market_visual_constraints/gi,
  /visual_style_constraints/gi,
  /provider_params/gi,
];

function cleanupMainDisplayText(value: unknown): string {
  let text = formatDisplayValue(value, '').trim();
  if (!text) return '';
  for (const pattern of EXECUTION_PATTERNS) text = text.replace(pattern, ' ');
  text = text.replace(/\s+/g, ' ').replace(/[;；,，]\s*[;；,，]+/g, '，').trim();
  if (!text) return '';
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const zh = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (letters > 24 && zh === 0) return '';
  return text;
}

export function AssetInteractionModal({
  asset,
  saving,
  regenerating,
  onClose,
  onSaveAllNormal,
  onRegeneratePrompt,
  onSelectImage,
  onAddImage,
}: Props) {
  type EditableField = 'name' | 'description';

  type FormState = {
    name: string;
    description: string;
  };

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
  });
  const [initialForm, setInitialForm] = useState<FormState>({
    name: '',
    description: '',
  });
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [promptDraft, setPromptDraft] = useState('');
  const [isPromptEditing, setIsPromptEditing] = useState(false);

  useEffect(() => {
    if (!asset) return;
    const rawPreferred = String(
      asset.rawSnapshot?.base_prompt ??
      asset.prompt ??
      asset.rawSnapshot?.prompt_snapshot ??
      asset.rawSnapshot?.provider_prompt ??
      '',
    );
    const tf = asset.typeFields ?? {};
    const imageDescription = cleanupMainDisplayText(
      String(
        tf.image_description ??
          tf.display_description ??
          asset.description ??
          '',
      ),
    );
    const fallbackDescription =
      asset.kind === 'character'
        ? '人物形象用于承载剧情角色表达，突出年龄、外貌、服装、状态和镜头一致性。'
        : asset.kind === 'scene'
          ? '场景用于承载剧情环境表达，突出空间结构、光线氛围、道具细节和镜头一致性。'
          : '产品用于承载剧情中的核心展示，突出品牌识别、结构材质与外观一致性。';
    const nextForm: FormState = {
      name: asset.name || '',
      description: imageDescription || fallbackDescription,
    };
    setForm(nextForm);
    setInitialForm(nextForm);
    setPromptDraft(cleanEditableAssetPrompt(rawPreferred, asset));
    setEditingField(null);
    setEditingDraft('');
    setIsPromptEditing(false);
  }, [asset]);

  const payload = useMemo<AssetEditorPayload | null>(() => {
    if (!asset) return null;
    const consistencyRequirements = getTypeFieldText(
      asset.typeFields,
      ['negative_constraints', 'negative_prompt', 'must_keep', 'structure_summary'],
      '',
    );
    return {
      name: form.name.trim(),
      typeLabel: asset.typeLabel.trim(),
      description: form.description.trim(),
      prompt: promptDraft,
      storyUsage: '',
      visualFeatures: '',
      immutableStructure: '',
      consistencyRequirements: consistencyRequirements === '—' ? '' : consistencyRequirements.trim(),
      voiceStyle: asset.voiceStyle,
      productUsage: asset.productUsage,
    };
  }, [asset, form, promptDraft]);

  if (!asset || !payload) return null;

  const images = asset.images ?? [];
  const selectedImage = images.find((x) => x.id === asset.selectedImageId) ?? images[0];
  const previewSrc = selectedImage?.imageUrl ?? asset.imageUrl;
  const canAddImage = (asset.imageCount ?? images.length) < (asset.imageLimit ?? 6);
  const rowClass = 'rounded-xl border border-[#EAEAEA] bg-white px-3 py-2.5';

  const descriptionLabel = '图片描述';
  const providerPromptSnapshot = formatDisplayValue(
    asset.rawSnapshot?.prompt_snapshot ?? asset.rawSnapshot?.provider_prompt ?? asset.rawSnapshot?.base_prompt,
    '',
  );
  const basePromptRaw = formatDisplayValue(asset.rawSnapshot?.base_prompt ?? asset.prompt, '');
  const providerPromptRaw = formatDisplayValue(asset.rawSnapshot?.provider_prompt, '');
  const promptSnapshotRaw = formatDisplayValue(asset.rawSnapshot?.prompt_snapshot, '');
  const providerParamsText = formatDisplayValue(asset.rawSnapshot?.provider_params, '');
  const debugMetaText = formatDisplayValue(asset.rawSnapshot?.meta ?? asset.rawSnapshot, '');
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const startEdit = (field: EditableField, value: string) => {
    setEditingField(field);
    setEditingDraft(value);
  };
  const cancelEdit = () => {
    setEditingField(null);
    setEditingDraft('');
  };
  const applyFieldEdit = (): FormState => {
    if (!editingField) return form;
    const value = editingDraft.trim();
    const next = { ...form, [editingField]: value } as FormState;
    setForm(next);
    setEditingField(null);
    setEditingDraft('');
    return next;
  };

  const valueTextClass = 'mt-1 text-[13px] leading-relaxed text-[#444444] whitespace-pre-wrap break-words';
  const fieldButtonClass = 'group w-full text-left rounded-lg px-1 py-0.5 hover:bg-[#F7F8FA]';
  const editHintClass = 'text-[11px] text-[#AEAEB2] opacity-0 transition-opacity group-hover:opacity-100';

  const renderField = (
    key: EditableField,
    label: string,
    value: string,
    kind: 'short' | 'long',
    descriptionField = false,
  ) => {
    const editing = editingField === key;
    return (
      <div className={rowClass}>
        <div className="text-[11px] font-medium text-[#8E8E93]">{label}</div>
        {editing ? (
          <div className="mt-1 space-y-2">
            {kind === 'short' ? (
              <input
                value={editingDraft}
                onChange={(e) => setEditingDraft(e.target.value)}
                className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] text-[#1D1D1F]"
              />
            ) : (
              <textarea
                value={editingDraft}
                onChange={(e) => setEditingDraft(e.target.value)}
                rows={descriptionField ? 4 : 3}
                className="w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] leading-relaxed text-[#444444]"
              />
            )}
            <div className={`grid ${descriptionField ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              <button
                type="button"
                onClick={() => {
                  const next = applyFieldEdit();
                  if (descriptionField) void onSaveAllNormal({ ...payload, ...next, description: next.description, name: next.name });
                }}
                disabled={saving || regenerating}
                className="rounded-lg border border-[#EAEAEA] py-2 text-[12px] font-medium text-[#1D1D1F] disabled:opacity-50"
              >
                保存
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving || regenerating}
                className="rounded-lg border border-[#EAEAEA] py-2 text-[12px] font-medium text-[#444444] disabled:opacity-50"
              >
                取消
              </button>
              {descriptionField ? (
                <button
                  type="button"
                  disabled={saving || regenerating}
                  onClick={() => {
                    const next = applyFieldEdit();
                    void onRegeneratePrompt({ ...payload, ...next, description: next.description, name: next.name });
                  }}
                  className="rounded-lg bg-[#1D1D1F] py-2 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  {regenerating ? '生成中…' : '重新生成图片'}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <button type="button" className={fieldButtonClass} onClick={() => startEdit(key, value)}>
            <div className={valueTextClass}>{formatDisplayValue(value || '', '点击编辑')}</div>
            <div className={editHintClass}>点击编辑</div>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white lg:flex-row">
        <div className="flex h-[min(36vh,280px)] w-full shrink-0 flex-col border-b border-[#D8DADF] bg-[#E4E6EA] lg:h-auto lg:w-[min(42%,420px)] lg:border-b-0 lg:border-r lg:border-[#D8DADF]">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {regenerating ? (
              <div className="flex flex-col items-center justify-center gap-2 px-3">
                <i className="ri-loader-4-line animate-spin text-2xl text-[#1D1D1F]" aria-hidden />
                <span className="text-center text-[12px] text-[#6E6E73]">正在重新生成图像…</span>
              </div>
            ) : previewSrc ? (
              <img src={previewSrc} alt={asset.name} className="block max-h-full max-w-full object-contain object-center" />
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
              <button type="button" onClick={onAddImage} className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-[#B8BBC2] bg-white text-[24px] leading-none text-[#6E6E73]">
                +
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-[#EAEAEA] px-5 py-4">
            <h3 className="text-[18px] font-black text-[#1D1D1F]">资产详情</h3>
            <button type="button" onClick={onClose} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px] text-[#444444]">
              关闭
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-2 text-[12px] text-[#6E6E73]">图片来源：<span className="font-medium text-[#444444]">{asset.sourceLabel}</span></div>
            <div className="flex flex-col gap-3">
              {renderField('name', '资产名称', form.name, 'short')}
              {renderField('description', descriptionLabel, form.description, 'long', true)}

              <details className={rowClass}>
                <summary className="cursor-pointer text-[11px] font-medium text-[#8E8E93]">高级设置</summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="text-[11px] font-medium text-[#8E8E93]">内部生成提示词</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#AEAEB2]">
                      用于调试图片生成，普通用户无需查看。
                    </p>
                    {isPromptEditing ? (
                      <textarea
                        value={promptDraft}
                        onChange={(e) => setPromptDraft(cleanEditableAssetPrompt(e.target.value, asset))}
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                      />
                    ) : (
                  <button type="button" onClick={() => setIsPromptEditing(true)} className="mt-2 w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-left text-[13px] leading-relaxed text-[#444444]">{formatDisplayValue(promptDraft, '点击编辑生成提示词')}</button>
                    )}
                  </div>
                  <details className="rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] px-3 py-2">
                    <summary className="cursor-pointer text-[11px] font-medium text-[#8E8E93]">调试信息</summary>
                    <div className="mt-2 space-y-2 text-[11px] text-[#6E6E73]">
                      {basePromptRaw ? (
                        <div>
                          <div className="font-medium text-[#8E8E93]">原始 base_prompt</div>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-[#EAEAEA] bg-white p-2 text-[11px] text-[#444444]">
                            {basePromptRaw}
                          </pre>
                        </div>
                      ) : null}
                      {providerPromptRaw ? (
                        <div>
                          <div className="font-medium text-[#8E8E93]">原始 provider prompt</div>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-[#EAEAEA] bg-white p-2 text-[11px] text-[#444444]">
                            {providerPromptRaw}
                          </pre>
                        </div>
                      ) : null}
                      {promptSnapshotRaw ? (
                        <div>
                          <div className="font-medium text-[#8E8E93]">原始 prompt_snapshot</div>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-[#EAEAEA] bg-white p-2 text-[11px] text-[#444444]">
                            {promptSnapshotRaw}
                          </pre>
                        </div>
                      ) : null}
                      {!promptSnapshotRaw && providerPromptSnapshot ? (
                        <div>
                          <div className="font-medium text-[#8E8E93]">Provider 提示快照</div>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-[#EAEAEA] bg-white p-2 text-[11px] text-[#444444]">
                            {providerPromptSnapshot}
                          </pre>
                        </div>
                      ) : null}
                      {providerParamsText ? (
                        <div>
                          <div className="font-medium text-[#8E8E93]">Provider 参数</div>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-[#EAEAEA] bg-white p-2 text-[11px] text-[#444444]">
                            {providerParamsText}
                          </pre>
                        </div>
                      ) : null}
                      {debugMetaText ? (
                        <div>
                          <div className="font-medium text-[#8E8E93]">其他元数据</div>
                          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-[#EAEAEA] bg-white p-2 text-[11px] text-[#444444]">
                            {debugMetaText}
                          </pre>
                        </div>
                      ) : null}
                      {!basePromptRaw && !providerPromptRaw && !promptSnapshotRaw && !providerPromptSnapshot && !providerParamsText && !debugMetaText ? (
                        <p className="text-[11px] text-[#AEAEB2]">暂无调试数据</p>
                      ) : null}
                    </div>
                  </details>
                </div>
              </details>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#EAEAEA] bg-white px-5 py-4">
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={saving || regenerating || !isDirty}
                className="rounded-xl bg-[#1D1D1F] py-3 text-[13px] font-semibold text-white disabled:opacity-50"
                onClick={() => {
                  void onSaveAllNormal({ ...payload, ...form });
                  setInitialForm(form);
                }}
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

