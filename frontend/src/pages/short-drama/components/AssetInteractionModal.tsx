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

function cleanPromptText(raw: string): string {
  let text = String(raw || '').trim();
  if (!text) return '';
  text = text
    .replace(/\b(source_trace|field_meta|raw_[a-z_]+)\b[:=].*/gi, '')
    .replace(/\b(conflict|brand)\b[:=].*/gi, '')
    .replace(/\{[^{}]*?(display|description|meta|source_trace|field_meta)[^{}]*\}/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const [promptDraft, setPromptDraft] = useState('');
  const [negativePromptDraft, setNegativePromptDraft] = useState('');
  const [isPromptEditing, setIsPromptEditing] = useState(false);

  useEffect(() => {
    if (!asset) return;
    setPromptDraft(cleanPromptText(asset.prompt || ''));
    setNegativePromptDraft(getTypeFieldText(asset.typeFields, ['negative_prompt', 'negative_constraints'], ''));
    setIsPromptEditing(false);
  }, [asset]);

  const payload = useMemo<AssetEditorPayload | null>(() => {
    if (!asset) return null;
    return {
      name: asset.name,
      typeLabel: asset.typeLabel,
      description: asset.description,
      prompt: promptDraft,
      voiceStyle: asset.voiceStyle,
      productUsage: asset.productUsage,
    };
  }, [asset, promptDraft]);

  if (!asset || !payload) return null;

  const images = asset.images ?? [];
  const selectedImage = images.find((x) => x.id === asset.selectedImageId) ?? images[0];
  const previewSrc = selectedImage?.imageUrl ?? asset.imageUrl;
  const canAddImage = (asset.imageCount ?? images.length) < (asset.imageLimit ?? 6);
  const rowClass = 'rounded-xl border border-[#EAEAEA] bg-white px-3 py-2.5';

  const roleLabelTitle = asset.kind === 'character' ? '角色定位' : asset.kind === 'scene' ? '场景定位' : '产品定位';
  const descriptionLabel = asset.kind === 'character' ? '人物描述' : asset.kind === 'scene' ? '空间描述' : '产品描述';
  const negativePrompt = getTypeFieldText(asset.typeFields, ['negative_prompt', 'negative_constraints'], '');

  const sceneLightingText = getTypeFieldText(asset.typeFields, ['lighting', 'light'], '');
  const sceneAtmosphereText = getTypeFieldText(asset.typeFields, ['atmosphere', 'mood'], '');
  const scenePropsText = getTypeFieldText(asset.typeFields, ['props', 'key_props'], '');
  const productImmutableText = getTypeFieldText(asset.typeFields, ['immutable_structure_constraints'], '');

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
              <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">名称</div><div className="mt-1 text-[13px] text-[#1D1D1F]">{formatDisplayValue(asset.name)}</div></div>
              <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">{roleLabelTitle}</div><div className="mt-1 text-[13px] text-[#1D1D1F]">{formatDisplayValue(asset.typeLabel)}</div></div>
              {asset.narrativeFunctionLabel ? <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">剧情作用</div><div className="mt-1 text-[13px] text-[#444444]">{formatDisplayValue(asset.narrativeFunctionLabel)}</div></div> : null}
              <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">{descriptionLabel}</div><div className="mt-1 text-[13px] leading-relaxed text-[#444444]">{formatDisplayValue(asset.description)}</div></div>

              {asset.kind === 'scene' ? (
                <>
                  {sceneLightingText ? <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">灯光</div><div className="mt-1 text-[13px] text-[#444444]">{sceneLightingText}</div></div> : null}
                  {sceneAtmosphereText ? <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">氛围</div><div className="mt-1 text-[13px] text-[#444444]">{sceneAtmosphereText}</div></div> : null}
                  {scenePropsText ? <div className={rowClass}><div className="text-[11px] font-medium text-[#8E8E93]">道具</div><div className="mt-1 text-[13px] text-[#444444]">{scenePropsText}</div></div> : null}
                </>
              ) : null}

              {asset.kind === 'product' && productImmutableText ? (
                <div className={rowClass}>
                  <div className="text-[11px] font-medium text-[#8E8E93]">不可改变结构</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-[#444444]">{productImmutableText}</div>
                </div>
              ) : null}

              <div className={rowClass}>
                <div className="text-[11px] font-medium text-[#8E8E93]">视觉描述词 Prompt</div>
                {isPromptEditing ? (
                  <textarea
                    value={promptDraft}
                    onChange={(e) => setPromptDraft(cleanPromptText(e.target.value))}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPromptEditing(true)}
                    className="mt-2 w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2 text-left text-[13px] leading-relaxed text-[#444444]"
                  >
                    {formatDisplayValue(promptDraft, '点击编辑 Prompt')}
                  </button>
                )}
              </div>

              {negativePrompt ? (
                <div className={rowClass}>
                  <div className="text-[11px] font-medium text-[#8E8E93]">负向约束</div>
                  <textarea
                    value={negativePromptDraft}
                    onChange={(e) => setNegativePromptDraft(e.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px]"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#EAEAEA] bg-white px-5 py-4">
            {isPromptEditing ? (
              <>
                <p className="mb-2 text-[11px] text-[#8E8E93]">仅视觉描述词 Prompt 会用于重新生成图片；其他字段为资产说明，不参与图片生成。</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPromptDraft(cleanPromptText(asset.prompt || ''));
                      setIsPromptEditing(false);
                    }}
                    className="rounded-xl border border-[#EAEAEA] py-3 text-[13px] font-semibold text-[#444444]"
                  >
                    取消编辑
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    className="rounded-xl border border-[#EAEAEA] py-3 text-[13px] font-semibold text-[#1D1D1F]"
                    onClick={() => {
                      void onSaveAllNormal({ ...payload, prompt: promptDraft });
                      setIsPromptEditing(false);
                    }}
                  >
                    保存 Prompt
                  </button>
                  <button
                    type="button"
                    disabled={regenerating || saving}
                    onClick={() => void onRegeneratePrompt({ ...payload, prompt: promptDraft })}
                    className="rounded-xl bg-[#1D1D1F] py-3 text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    {regenerating ? '生成中…' : '用当前 Prompt 重新生成'}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                disabled={saving}
                className="w-full rounded-xl bg-[#1D1D1F] py-3 text-[13px] font-semibold text-white disabled:opacity-50"
                onClick={() => {
                  void onSaveAllNormal({ ...payload, prompt: promptDraft });
                }}
              >
                保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

