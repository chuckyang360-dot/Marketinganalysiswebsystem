import { useState } from 'react';
import { mockCategories, mockMarkets } from '../data/mockShortDrama';
import type { ProductInputDraft } from '../types/shortDrama';
import { ri, sdColors } from '../utils/shortDramaHelpers';
import { UploadDropzone } from './UploadDropzone';

type Props = {
  draft: ProductInputDraft;
  setDraft: (next: ProductInputDraft | ((prev: ProductInputDraft) => ProductInputDraft)) => void;
};

export function ProductInputForm({ draft, setDraft }: Props) {
  const [spInput, setSpInput] = useState('');
  const inputCls =
    'w-full rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[#1D1D1F] focus:bg-white';

  const toggleMarket = (m: string) => {
    setDraft((prev) => ({
      ...prev,
      targetMarkets: prev.targetMarkets.includes(m)
        ? prev.targetMarkets.filter((x) => x !== m)
        : [...prev.targetMarkets, m],
    }));
  };

  const addSellingPoint = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setDraft((prev) => ({ ...prev, sellingPoints: [...prev.sellingPoints, t] }));
  };

  const removeSellingPoint = (idx: number) => {
    setDraft((prev) => ({ ...prev, sellingPoints: prev.sellingPoints.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 text-[13px] font-bold text-[#444444]">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: sdColors.surface2 }}
          >
            <i className={ri('ri-information-line', 'text-[12px] text-[#1D1D1F]')} aria-hidden />
          </span>
          基础信息
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">产品名称 *</label>
            <input
              className={inputCls}
              value={draft.productName}
              onChange={(e) => setDraft((p) => ({ ...p, productName: e.target.value }))}
              placeholder="例如：夏季轻薄连衣裙"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">品牌名称</label>
            <input
              className={inputCls}
              value={draft.brandName}
              onChange={(e) => setDraft((p) => ({ ...p, brandName: e.target.value }))}
              placeholder="例如：NordHome"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">目标用户</label>
            <input
              className={inputCls}
              value={draft.targetUser}
              onChange={(e) => setDraft((p) => ({ ...p, targetUser: e.target.value }))}
              placeholder="例如：25-40 岁欧洲都市家庭"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">产品分类</label>
            <select
              className={`${inputCls} cursor-pointer`}
              value={draft.category}
              onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="">选择分类</option>
              {mockCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-[12px] font-medium text-[#6E6E73]">目标市场（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {mockMarkets.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMarket(m)}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={{
                  background: draft.targetMarkets.includes(m) ? sdColors.ink : sdColors.surface,
                  border: `1px solid ${draft.targetMarkets.includes(m) ? sdColors.ink : sdColors.border}`,
                  color: draft.targetMarkets.includes(m) ? '#fff' : '#6E6E73',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 text-[13px] font-bold text-[#444444]">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: sdColors.surface2 }}
          >
            <i className={ri('ri-file-list-3-line', 'text-[12px] text-[#1D1D1F]')} aria-hidden />
          </span>
          产品描述
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#6E6E73]">核心卖点</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {draft.sellingPoints.map((sp, idx) => (
                <span
                  key={`${sp}-${idx}`}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] px-3 py-1.5 text-[12px] text-[#1D1D1F]"
                >
                  {sp}
                  <button type="button" onClick={() => removeSellingPoint(idx)} className="text-[#8E8E93]">
                    <i className={ri('ri-close-line', 'text-[11px]')} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={spInput}
                onChange={(e) => setSpInput(e.target.value)}
                placeholder="输入卖点，回车添加"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSellingPoint(spInput);
                    setSpInput('');
                  }
                }}
              />
              <button
                type="button"
                className="whitespace-nowrap rounded-lg border border-[#EAEAEA] bg-[#F5F5F7] px-4 py-2.5 text-[13px] font-medium text-[#444444] hover:bg-[#1D1D1F] hover:text-white"
                onClick={() => {
                  addSellingPoint(spInput);
                  setSpInput('');
                }}
              >
                添加
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">使用场景</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={draft.useScene}
              onChange={(e) => setDraft((p) => ({ ...p, useScene: e.target.value }))}
              placeholder="例如：周末家庭聚餐、新居布置"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">品牌调性</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={draft.brandTone}
              onChange={(e) => setDraft((p) => ({ ...p, brandTone: e.target.value }))}
              placeholder="例如：温暖、自然、克制、高级感"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#6E6E73]">补充说明</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={draft.extraNotes}
              onChange={(e) => setDraft((p) => ({ ...p, extraNotes: e.target.value }))}
              placeholder="其他希望 AI 了解的信息（本轮仅本地保存）"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-5 flex items-center gap-2 text-[13px] font-bold text-[#444444]">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: sdColors.surface2 }}
          >
            <i className={ri('ri-image-add-line', 'text-[12px] text-[#1D1D1F]')} aria-hidden />
          </span>
          资料上传（占位）
        </h2>
        <div className="mb-4 flex flex-wrap gap-3">
          {['主图 A', '主图 B', '主图 C'].map((label) => (
            <div key={label} className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <UploadDropzone label={label} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <UploadDropzone variant="row" label="上传企业介绍资料" />
          <UploadDropzone variant="row" label="上传产品详情截图" />
        </div>
      </section>
    </div>
  );
}
