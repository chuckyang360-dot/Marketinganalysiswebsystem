import { useEffect, useMemo, useState } from 'react';

export type AssetKind = 'character' | 'scene' | 'product';
export type AssetModalMode = 'detail' | 'edit';

export type AssetInteractionEntity = {
  id: number;
  kind: AssetKind;
  name: string;
  typeLabel: string;
  description: string;
  prompt: string;
  imageUrl: string | null;
  sourceLabel: '系统生成' | '用户参考图';
  voiceStyle?: string;
  productUsage?: string;
  referenceImageDataUrl?: string;
  referenceImageName?: string;
};

export type AssetEditorPayload = {
  name: string;
  typeLabel: string;
  description: string;
  prompt: string;
  voiceStyle?: string;
  productUsage?: string;
  referenceImageDataUrl?: string;
  referenceImageName?: string;
};

type Props = {
  asset: AssetInteractionEntity | null;
  mode: AssetModalMode;
  saving?: boolean;
  regenerating?: boolean;
  onClose: () => void;
  onSave: (payload: AssetEditorPayload) => Promise<void>;
  onRegenerate: (payload: AssetEditorPayload) => Promise<void>;
  onOpenEdit: () => void;
  onReferenceSelected?: (payload: { name: string }) => void;
};

export function AssetInteractionModal({
  asset,
  mode,
  saving = false,
  regenerating = false,
  onClose,
  onSave,
  onRegenerate,
  onOpenEdit,
  onReferenceSelected,
}: Props) {
  const [name, setName] = useState('');
  const [typeLabel, setTypeLabel] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('');
  const [productUsage, setProductUsage] = useState('');
  const [referenceImageDataUrl, setReferenceImageDataUrl] = useState<string | undefined>(undefined);
  const [referenceImageName, setReferenceImageName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!asset) return;
    setName(asset.name || '');
    setTypeLabel(asset.typeLabel || '');
    setDescription(asset.description || '');
    setPrompt(asset.prompt || '');
    setVoiceStyle(asset.voiceStyle || '');
    setProductUsage(asset.productUsage || '');
    setReferenceImageDataUrl(asset.referenceImageDataUrl);
    setReferenceImageName(asset.referenceImageName);
  }, [asset]);

  const previewImage = useMemo(
    () => referenceImageDataUrl || asset?.referenceImageDataUrl || asset?.imageUrl || null,
    [referenceImageDataUrl, asset?.referenceImageDataUrl, asset?.imageUrl],
  );

  if (!asset) return null;

  const payload: AssetEditorPayload = {
    name,
    typeLabel,
    description,
    prompt,
    voiceStyle: asset.kind === 'character' ? voiceStyle : undefined,
    productUsage: asset.kind === 'product' ? productUsage : undefined,
    referenceImageDataUrl,
    referenceImageName,
  };

  const title = mode === 'detail' ? '查看详情' : '编辑资产';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white lg:grid-cols-[1.1fr_1.4fr]">
        <div className="relative flex min-h-[340px] items-center justify-center bg-[#F5F5F7] p-4">
          {regenerating ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-[#E9EAED]" />
          ) : previewImage ? (
            <img src={previewImage} alt={asset.name} className="max-h-[68vh] w-full object-contain" />
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-[#E9EAED]" />
          )}
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[20px] font-black text-[#1D1D1F]">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-lg border border-[#EAEAEA] px-3 py-1.5 text-[12px]">
              关闭
            </button>
          </div>
          <div className="mb-4 text-[12px] text-[#8E8E93]">图像来源：{referenceImageDataUrl || asset.referenceImageDataUrl ? '用户参考图' : asset.sourceLabel}</div>

          <div className="space-y-3">
            <label className="block text-[12px] text-[#6E6E73]">
              名称
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mode === 'detail'}
                className="mt-1 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] disabled:bg-[#F7F8FA]"
              />
            </label>

            <label className="block text-[12px] text-[#6E6E73]">
              类型标签
              <input
                value={typeLabel}
                onChange={(e) => setTypeLabel(e.target.value)}
                disabled={mode === 'detail'}
                className="mt-1 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] disabled:bg-[#F7F8FA]"
              />
            </label>

            <label className="block text-[12px] text-[#6E6E73]">
              描述
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={mode === 'detail'}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] disabled:bg-[#F7F8FA]"
              />
            </label>

            <label className="block text-[12px] text-[#6E6E73]">
              Prompt
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={mode === 'detail'}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] disabled:bg-[#F7F8FA]"
              />
            </label>

            {asset.kind === 'character' ? (
              <label className="block text-[12px] text-[#6E6E73]">
                音色
                <input
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                  disabled={mode === 'detail'}
                  placeholder="暂未开放"
                  className="mt-1 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] disabled:bg-[#F7F8FA]"
                />
              </label>
            ) : null}

            {asset.kind === 'product' ? (
              <label className="block text-[12px] text-[#6E6E73]">
                产品使用方式
                <input
                  value={productUsage}
                  onChange={(e) => setProductUsage(e.target.value)}
                  disabled={mode === 'detail'}
                  className="mt-1 w-full rounded-lg border border-[#EAEAEA] px-3 py-2 text-[13px] disabled:bg-[#F7F8FA]"
                />
              </label>
            ) : null}

            <label className="block text-[12px] text-[#6E6E73]">
              上传参考图
              <input
                type="file"
                accept="image/*"
                disabled={mode === 'detail'}
                className="mt-1 block w-full text-[12px]"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setReferenceImageName(f.name);
                  onReferenceSelected?.({ name: f.name });
                  const reader = new FileReader();
                  reader.onload = () => setReferenceImageDataUrl(typeof reader.result === 'string' ? reader.result : undefined);
                  reader.readAsDataURL(f);
                }}
              />
              <p className="mt-1 text-[11px] text-[#8E8E93]">上传本身不触发重生成，保存后生效。</p>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {mode === 'detail' ? (
              <button type="button" onClick={onOpenEdit} className="rounded-lg bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white">
                编辑
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void onSave(payload)}
                  disabled={saving}
                  className="rounded-lg bg-[#1D1D1F] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => void onRegenerate(payload)}
                  disabled={regenerating}
                  className="rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-4 py-2 text-[12px] font-medium disabled:opacity-60"
                >
                  {regenerating ? '重新生成中...' : '重新生成'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
