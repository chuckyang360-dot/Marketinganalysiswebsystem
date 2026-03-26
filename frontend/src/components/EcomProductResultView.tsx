import type { EcomProductAnalysisResult } from '../types/analysis';
import { isEcomProductAnalysisResult } from '../types/analysis';
import { useEffect, useMemo, useState } from 'react';
import { runFullAnalysis } from '../services/api';

interface Props {
  data: EcomProductAnalysisResult;
  /** 当前 Workspace 分析所用的商品 URL（与 CEO action 共用同一入口） */
  productUrl: string;
  onEcomResultUpdate?: (next: EcomProductAnalysisResult) => void;
}

export default function EcomProductResultView({ data, productUrl, onEcomResultUpdate }: Props) {
  const pd = data.parse_data || {};
  const ceoText = String(data.ceo_analysis || '暂无分析');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [displayTitle, setDisplayTitle] = useState<string>(String(pd.title || '未提取到标题'));
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [selectedReferencePreview, setSelectedReferencePreview] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [generatedOptimizedImages, setGeneratedOptimizedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  // V1.0 用户评价洞察 - 严格按产品需求实现
  const [visibleReviews, setVisibleReviews] = useState<number>(5);
  const [expandedReviewKeys, setExpandedReviewKeys] = useState<Set<string>>(() => new Set());

  const extractSection = (label: string) => {
    // 简单 fallback：尝试用标题关键字截取；取不到则返回空字符串（由 UI 兜底展示）
    const text = ceoText;
    const idx = text.toLowerCase().indexOf(label.toLowerCase());
    if (idx === -1) return '';
    const rest = text.slice(idx);
    const nextHeading = rest.slice(1).search(/\n#{1,6}\s|(\n\d+\.)/);
    return nextHeading === -1 ? rest.trim() : rest.slice(0, nextHeading + 1).trim();
  };

  const sections = {
    vibe: extractSection('vibe') || ceoText,
    title: extractSection('标题') || extractSection('title'),
    image: extractSection('主图') || extractSection('image'),
    pricing: extractSection('价格') || extractSection('pricing'),
    bullets: extractSection('卖点') || extractSection('bullet'),
    reviews: extractSection('评价') || extractSection('review'),
  };

  const images = useMemo(() => {
    const canonicalize = (rawUrl: string) => {
      const u = String(rawUrl || '').trim();
      if (!u) return '';
      // 1) strip querystring
      const noQuery = u.split('?')[0];
      // 2) collapse amazon size variants: .../xxxx._AC_SX679_.jpg -> .../xxxx.jpg
      const m = noQuery.match(/^(.*?)(\._[^.]+)?\.(jpg|jpeg|png|webp)$/i);
      if (m) return `${m[1]}.${m[3].toLowerCase()}`;
      return noQuery;
    };

    const list = [
      ...(Array.isArray((pd as any).images) ? ((pd as any).images as string[]) : []),
      ...(pd.main_image ? [String(pd.main_image)] : []),
    ]
      .map((x) => String(x || '').trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const out: string[] = [];
    for (const url of list) {
      const key = canonicalize(url);
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(url);
    }
    return out;
  }, [pd]);

  const activeImage = selectedImage || images[0] || '';

  const downloadImage = async (url: string) => {
    if (!url) return;
    try {
      setDownloadingUrl(url);
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `product-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      // 兜底：如果跨域导致下载失败，直接打开新标签页让用户手动保存
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingUrl(null);
    }
  };

  const generateTitleSuggestions = () => {
    const base = String(displayTitle || '').trim();
    const price = pd.price ? String(pd.price) : '';
    const brand = pd.brand && pd.brand !== 'N/A' ? String(pd.brand) : '';

    const candidates = [
      base,
      brand ? `${brand} ${base}` : '',
      price ? `${base} | ${price} 限时优惠` : '',
      brand ? `${brand}｜${base}（升级版）` : '',
      `${base} - 更强卖点版标题（可直接用于Listing）`,
    ]
      .map((x) => String(x || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    setTitleSuggestions(Array.from(new Set(candidates)).slice(0, 5));
    setShowTitleSuggestions(true);
  };

  const referenceCandidates = useMemo(() => images.slice(0, 6), [images]);

  useEffect(() => {
    if (referenceCandidates.length === 0) {
      setSelectedReferenceImages([]);
      setSelectedReferencePreview('');
      return;
    }
    // 最终调整：默认全部不勾选，用户手动选择
    setSelectedReferenceImages([]);
    setSelectedReferencePreview(referenceCandidates[0] || '');
  }, [referenceCandidates]);

  useEffect(() => {
    if (!userPrompt.trim()) {
      setUserPrompt(sections.image || '请基于参考图优化主图的构图、文案层级与转化表现。');
    }
  }, [sections.image]);

  useEffect(() => {
    const opt = data.parse_data?.optimized_images;
    if (Array.isArray(opt) && opt.length > 0) {
      setGeneratedOptimizedImages(opt.slice(0, 4));
      setHasGenerated(true);
    }
  }, [data.parse_data?.optimized_images]);

  const toggleReferenceImage = (img: string) => {
    setSelectedReferenceImages((prev) => {
      if (prev.includes(img)) return prev.filter((x) => x !== img);
      return [...prev, img];
    });
  };

  const generateOptimizedImages = async () => {
    if (selectedReferenceImages.length === 0 || !userPrompt.trim()) return;
    const url = String(productUrl || pd.url || '').trim();
    if (!url) {
      alert('缺少商品 URL，无法请求 CEO 编排主图优化');
      return;
    }
    setHasGenerated(true);
    setIsGenerating(true);
    try {
      const res = await runFullAnalysis(url, {
        action: 'ecom_optimize_images',
        user_prompt: userPrompt.trim(),
        selected_reference_images: selectedReferenceImages.slice(0, 6),
      });
      if (!isEcomProductAnalysisResult(res)) {
        throw new Error('响应类型异常');
      }
      if (res.status === 'error') {
        alert(String(res.ceo_analysis || res.message || '主图优化失败'));
        setGeneratedOptimizedImages([]);
        return;
      }
      const nextImages = Array.isArray(res.parse_data?.optimized_images)
        ? res.parse_data.optimized_images.slice(0, 4)
        : [];
      setGeneratedOptimizedImages(nextImages);
      onEcomResultUpdate?.(res);
    } catch (e) {
      setGeneratedOptimizedImages([]);
      alert(e instanceof Error ? e.message : '主图优化请求失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 紧急修复 Amazon 价格解析失败（$,, 问题）：前端渲染兜底
  const safePrice = useMemo(() => {
    const raw = String((pd as any).price ?? '').trim();
    const cleaned = raw.replace(/\s+/g, '');
    const invalid =
      !cleaned ||
      cleaned === '$,' ||
      cleaned === '$,,' ||
      /^[\$￥€£\.,]+$/.test(cleaned) ||
      !/\d/.test(cleaned);
    if (!invalid) return raw;
    const orig = String((pd as any).original_price ?? '').trim();
    if (orig && /\d/.test(orig) && !/^[\$￥€£\.,]+$/.test(orig)) return orig;
    return '';
  }, [pd]);

  // V1.0 用户评价洞察 - 真实渲染
  const reviews = useMemo(() => {
    const direct = Array.isArray((pd as any).reviews) ? ((pd as any).reviews as any[]) : [];
    const nested = Array.isArray((pd as any)?.structured_data?.reviews)
      ? (((pd as any).structured_data.reviews as any[]) || [])
      : [];
    const arr = direct.length > 0 ? direct : nested;
    return arr
      .map((r) => ({
        rating: Number(r?.rating || 0),
        title: String(r?.title || '').trim(),
        content: String(r?.content || '').trim(),
        author: String(r?.author || '').trim(),
        date: String(r?.date || '').trim(),
        verified_purchase: Boolean(r?.verified_purchase),
        helpful_votes: Number(r?.helpful_votes || 0),
      }))
      .filter((r) => r.content); // 只展示有正文的纯文字评论
  }, [pd]);

  const toggleReviewExpand = (key: string) => {
    setExpandedReviewKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderStars = (rating: number) => {
    const full = Math.max(0, Math.min(5, Math.floor(rating)));
    const empty = Math.max(0, 5 - full);
    return `${'★'.repeat(full)}${'☆'.repeat(empty)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      {/* ==================== 商品信息层（顶部英雄区） ==================== */}
      <section
        id="product-overview"
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-8 lg:gap-10">
          {/* 大主图（支持未来多图，当前先做单图 + 缩略图横向滚动列表） */}
          <div className="w-full">
            {activeImage ? (
              <div className="rounded-2xl border bg-gray-50 overflow-hidden shadow-sm">
                <img
                  src={activeImage}
                  alt={displayTitle || 'product'}
                  className="w-full h-80 lg:w-[360px] lg:h-[360px] object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-80 lg:w-[360px] lg:h-[360px] rounded-2xl border bg-gray-50 flex items-center justify-center text-gray-400">
                暂无主图
              </div>
            )}

            {images.length > 0 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((img) => {
                  const isActive = img === activeImage;
                  return (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 rounded-xl border overflow-hidden bg-white flex-shrink-0 ${
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="切换主图"
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-contain bg-gray-50" />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* 操作按钮：仅“保存原图”（真实下载功能） */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => downloadImage(activeImage)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-800 disabled:opacity-60"
                disabled={!activeImage || downloadingUrl === activeImage}
              >
                {downloadingUrl === activeImage ? '下载中...' : '保存原图'}
              </button>
            </div>
          </div>

          {/* 商品标题（大字体） + 价格 + 评分星级 + 评价数量 + Brand */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900 mb-6">
              {displayTitle || '未提取到标题'}
            </h1>

            <div className="flex flex-wrap items-end gap-6 mb-6">
              <div className="text-6xl font-bold text-emerald-600 flex-shrink-0 min-w-[12rem]">
                {safePrice || '价格解析异常'}
              </div>

              {Number(pd.rating) > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 text-3xl font-semibold">⭐ {pd.rating}</span>
                  <span className="text-gray-500 text-lg">
                    (
                    {pd.review_count?.toLocaleString?.()
                      ? pd.review_count.toLocaleString()
                      : pd.review_count || 0}{' '}
                    reviews)
                  </span>
                </div>
              ) : (
                <div className="text-gray-400 text-lg">暂无评分</div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {pd.brand && pd.brand !== 'N/A' ? (
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                  Brand: {pd.brand}
                </span>
              ) : null}
              {pd.platform ? (
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {pd.platform}
                </span>
              ) : null}
            </div>

            {pd.url ? (
              <a
                href={pd.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline break-all"
              >
                {pd.url}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* ==================== CEO分析层（中间主体）：垂直单列大卡片 ==================== */}
      <div className="grid grid-cols-1 gap-8">
      <section
        id="vibe-diagnosis"
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>🧠</span> Vibe 诊断
        </h2>
        <div className="text-[15.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
          {sections.vibe || '暂无'}
        </div>
      </section>

      <section
        id="bullet-points"
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>✨</span> 卖点提炼
        </h2>
        <div className="text-[15.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
          {sections.bullets || '暂无'}
        </div>
      </section>

      <section
        id="image-optimization"
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>🖼️</span> 视觉诊断 / 主图优化
        </h2>
        <div className="text-[15.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
          {sections.image || '暂无'}
        </div>
      </section>

      <section
        id="title-optimization"
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>📝</span> 标题优化
        </h2>
        <div className="text-[15.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
          {sections.title || '暂无'}
        </div>
      </section>

      <section
        id="pricing-strategy"
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>💲</span> 定价策略
        </h2>
        <div className="text-[15.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
          {sections.pricing || '暂无'}
        </div>
      </section>

      {/* 用户评价洞察（V1.0） */}
      <section
        id="reviews-insights"
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span>💬</span> 用户评价洞察
        </h2>

        {reviews.length === 0 ? (
          <div className="text-sm text-gray-500">暂无用户评价数据</div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, visibleReviews).map((r, idx) => {
              const key = `${r.author || 'anon'}-${r.date || 'date'}-${idx}`;
              const expanded = expandedReviewKeys.has(key);
              const showHelpful = (r.helpful_votes || 0) > 0;
              return (
                <div key={key} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  {/* 星级（5星图标 + 数字，例如 ★★★★☆ 4.5） */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-amber-500 font-semibold">
                      {renderStars(r.rating)}{' '}
                      <span className="text-gray-800 font-bold">{Number.isFinite(r.rating) ? r.rating.toFixed(1) : '0.0'}</span>
                    </div>
                    {r.verified_purchase ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        ✅ Verified Purchase
                      </span>
                    ) : null}
                  </div>

                  {/* 评论标题（粗体） */}
                  <div className="mt-3 font-bold text-gray-900">{r.title || '（无标题）'}</div>

                  {/* 评论正文（支持换行，超出3行可展开） */}
                  <div
                    className={
                      expanded
                        ? 'mt-2 text-sm text-gray-700 whitespace-pre-line'
                        : 'mt-2 text-sm text-gray-700 whitespace-pre-line overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]'
                    }
                  >
                    {r.content}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleReviewExpand(key)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {expanded ? '收起' : '展开'}
                    </button>
                    {showHelpful ? (
                      <span className="text-xs text-gray-600">{r.helpful_votes} 人觉得有帮助</span>
                    ) : null}
                  </div>

                  {/* 作者 + 日期（灰色小字） */}
                  <div className="mt-3 text-xs text-gray-500">
                    {r.author || '匿名'} {r.date ? `· ${r.date}` : ''}
                  </div>
                </div>
              );
            })}

            {reviews.length > visibleReviews ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleReviews((v) => Math.min(reviews.length, v + 5))}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-800"
                >
                  加载更多
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
      </div>

      {/* ==================== 内容输出层（底部独立区域） ==================== */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">内容输出（V1.0）</h2>

        {/* 标题生成：显示原标题 + “生成新标题”按钮 → 点击后展示建议 → 一键替换 */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">标题生成</div>
              <div className="text-sm text-gray-600 mt-1">
                原标题：<span className="font-medium text-gray-900">{pd.title || '未提取到标题'}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                当前标题：<span className="font-medium text-gray-900">{displayTitle || '未提取到标题'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={generateTitleSuggestions}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
              >
                生成新标题
              </button>
              {showTitleSuggestions ? (
                <button
                  type="button"
                  onClick={() => setShowTitleSuggestions(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-800"
                >
                  收起建议
                </button>
              ) : null}
            </div>
          </div>

          {showTitleSuggestions ? (
            <div className="mt-4 space-y-2">
              {titleSuggestions.map((s) => (
                <div
                  key={s}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl bg-white border border-gray-200 p-3"
                >
                  <div className="flex-1 text-sm text-gray-800">{s}</div>
                  <button
                    type="button"
                    onClick={() => setDisplayTitle(s)}
                    className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium"
                  >
                    一键替换
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* 图片优化：前6张候选 + Prompt 编辑 + 生成后左右分栏 */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          {!hasGenerated ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">图片优化</div>
                  <div className="text-sm text-gray-600 mt-1">从商品主图中选择参考图并编辑优化 Prompt</div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium disabled:opacity-60"
                  onClick={generateOptimizedImages}
                  disabled={selectedReferenceImages.length === 0 || !userPrompt.trim()}
                >
                  立即生成
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {referenceCandidates.map((img) => {
                  const checked = selectedReferenceImages.includes(img);
                  return (
                    <label key={img} className="rounded-xl border bg-white p-2 cursor-pointer">
                      <img src={img} alt="reference" className="w-full h-28 object-contain bg-gray-50 rounded-lg" />
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleReferenceImage(img)}
                        />
                        <span className="text-gray-700">参考图</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold text-gray-900 mb-2">优化 Prompt</div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                  onClick={generateOptimizedImages}
                  disabled={selectedReferenceImages.length === 0 || !userPrompt.trim()}
                >
                  立即生成
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：原图参考区 */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">图片优化 · 原图参考区</div>
                {selectedReferencePreview ? (
                  <div className="rounded-xl border bg-gray-50 overflow-hidden">
                    <img
                      src={selectedReferencePreview}
                      alt="reference-preview"
                      className="w-full h-72 object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-72 rounded-xl border bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                    未选择参考图
                  </div>
                )}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {selectedReferenceImages.map((img) => {
                    const isActive = img === selectedReferencePreview;
                    return (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setSelectedReferencePreview(img)}
                        className={`w-20 h-20 rounded-lg border overflow-hidden flex-shrink-0 ${
                          isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                        }`}
                      >
                        <img src={img} alt="reference-thumb" className="w-full h-full object-contain bg-gray-50" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 右侧：生成结果区 */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">图片优化 · 生成结果区</div>
                {isGenerating ? (
                  <div className="h-[22rem] rounded-xl border bg-gray-50 flex flex-col items-center justify-center text-gray-600">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <div className="text-sm">正在根据你的 Prompt 生成优化主图...</div>
                  </div>
                ) : generatedOptimizedImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedOptimizedImages.map((img, idx) => (
                      <div key={`${img}-${idx}`} className="rounded-xl border bg-gray-50 p-2">
                        <div className="relative rounded-lg overflow-hidden border bg-white">
                          <img src={img} alt={`optimized-${idx + 1}`} className="w-full h-36 object-contain" />
                          <button
                            type="button"
                            onClick={() => downloadImage(img)}
                            className="absolute right-2 bottom-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs"
                          >
                            保存这张图
                          </button>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800"
                          >
                            设为主展示图
                          </button>
                          <button
                            type="button"
                            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800"
                          >
                            加入详情图
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[22rem] rounded-xl border bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                    暂无生成结果
                  </div>
                )}

                <div className="mt-4">
                  <div className="text-xs font-semibold text-gray-900 mb-2">继续优化 Prompt</div>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={generateOptimizedImages}
                      disabled={selectedReferenceImages.length === 0 || !userPrompt.trim() || isGenerating}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                    >
                      立即生成
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

