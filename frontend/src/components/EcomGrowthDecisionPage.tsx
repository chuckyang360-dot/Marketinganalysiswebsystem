import { useEffect, useMemo, useState } from 'react';
import { runFullAnalysis } from '../services/api';
import type { EcomProductAnalysisResult } from '../types/analysis';
import { isEcomProductAnalysisResult } from '../types/analysis';

interface Props {
  data: EcomProductAnalysisResult;
  productUrl: string;
  analysisId: string;
  onNewAnalysis?: () => void;
  onEcomResultUpdate?: (next: EcomProductAnalysisResult) => void;
}

const HERO_PROBLEMS = ['主图吸引力偏弱', '卖点表达不够聚焦', '价格区间竞争激烈'];
const HERO_ACTIONS = ['优化主图', '重写标题', '提炼 3 条差异化 Bullet Points'];
type HeroDirection = {
  key: string;
  title: string;
  description: string;
  prompt: string;
  rationale?: string;
};
type DirectionKey = string;
type DirectionState = {
  key: string;
  label: string;
  icon: string;
  description: string;
  prompt: string;
  generatedImages: string[];
  selectedImage: string;
  generating: boolean;
  error: string;
};

function getFallbackDirectionsByProduct(pd: any): HeroDirection[] {
  const title = String(pd?.title || '').toLowerCase();
  const category = String(pd?.category || '').toLowerCase();
  const text = `${title} ${category}`;
  if (/(vacuum|cleaner|mop|扫地|清洁)/.test(text)) {
    return [
      { key: 'home_use_scene', title: '家庭清洁场景图', description: '展示真实家居环境中的使用状态', prompt: '家庭清洁场景图：保持当前商品主体不变，仅优化场景和信息层级。' },
      { key: 'function_closeup', title: '功能特写图', description: '突出吸力、避障、拖地等核心能力', prompt: '功能特写图：保持当前商品主体不变，强化功能细节表达。' },
      { key: 'effect_comparison', title: '清洁效果对比图', description: '展示前后差异和结果证明', prompt: '清洁效果对比图：保持当前商品主体不变，强化对比结果。' },
    ];
  }
  if (/(headphone|earbud|耳机)/.test(text)) {
    return [
      { key: 'commute_scene', title: '通勤场景主图', description: '展示通勤/办公等高频使用情境', prompt: '通勤场景主图：保持当前商品主体不变，强调通勤代入感。' },
      { key: 'product_closeup', title: '产品特写主图', description: '突出佩戴细节、工艺和质感', prompt: '产品特写主图：保持当前商品主体不变，强化细节特写。' },
      { key: 'noise_compare', title: '降噪对比效果图', description: '对比降噪前后听感场景', prompt: '降噪对比效果图：保持当前商品主体不变，突出前后差异。' },
    ];
  }
  if (/(dress|shirt|fashion|服|女装|上衣|裤)/.test(text)) {
    return [
      { key: 'wear_scene', title: '上身场景图', description: '展示真人穿搭与出行场景', prompt: '上身场景图：保持当前商品主体不变，强调穿搭场景代入。' },
      { key: 'fit_highlight', title: '版型卖点图', description: '突出剪裁、版型与显瘦细节', prompt: '版型卖点图：保持当前商品主体不变，突出版型细节。' },
      { key: 'fabric_closeup', title: '面料细节图', description: '展示材质纹理和触感信息', prompt: '面料细节图：保持当前商品主体不变，强化面料细节。' },
    ];
  }
  return [
    { key: 'usage_scene', title: '使用场景主图', description: '展示商品在真实生活中的使用情境', prompt: '使用场景主图：保持当前商品主体不变，优化场景表达。' },
    { key: 'feature_closeup', title: '功能特写主图', description: '突出关键功能和核心卖点', prompt: '功能特写主图：保持当前商品主体不变，强化核心功能信息。' },
    { key: 'benefit_compare', title: '效果对比图', description: '可视化展示使用前后差异', prompt: '效果对比图：保持当前商品主体不变，突出结果对比。' },
  ];
}

function copyText(value: string) {
  if (!value) return;
  navigator.clipboard.writeText(value).catch(() => undefined);
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isSupportedEcomUrl(value: string): boolean {
  const url = String(value || '').toLowerCase();
  return url.includes('amazon.') || url.includes('shopee.') || url.includes('lazada.');
}

export default function EcomGrowthDecisionPage({
  data,
  productUrl,
  analysisId,
  onNewAnalysis,
  onEcomResultUpdate
}: Props) {
  const pd = data.parse_data || {};
  const ceoText = String(data.ceo_analysis || '');
  const heroDirections = useMemo<HeroDirection[]>(
    () =>
      Array.isArray(data.hero_image_directions) && data.hero_image_directions.length > 0
        ? data.hero_image_directions.slice(0, 3)
        : getFallbackDirectionsByProduct(pd),
    [data.hero_image_directions, pd]
  );
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedReferenceImage, setSelectedReferenceImage] = useState<string>('');
  const [generateError, setGenerateError] = useState<string>('');
  const [imageDirections, setImageDirections] = useState<Record<DirectionKey, DirectionState>>({});
  const [comparePreview, setComparePreview] = useState<{ ref: string; generated: string; title: string } | null>(null);
  const [zoomPreview, setZoomPreview] = useState<{ image: string; title: string } | null>(null);
  const [expandedFunnel, setExpandedFunnel] = useState<string>('曝光 / CTR');
  const [titleItems, setTitleItems] = useState<string[]>([]);
  const [bulletItems, setBulletItems] = useState<string[]>([]);

  const images = useMemo(() => {
    const list = [
      ...(Array.isArray((pd as any).images) ? ((pd as any).images as string[]) : []),
      ...(pd.main_image ? [String(pd.main_image)] : []),
    ]
      .map((x) => String(x || '').trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [pd]);

  useEffect(() => {
    if (images.length > 0) setSelectedImage(images[0]);
  }, [images]);

  useEffect(() => {
    setImageDirections((prev) => {
      const next: Record<DirectionKey, DirectionState> = {};
      heroDirections.forEach((dir, idx) => {
        const existing = prev[dir.key];
        next[dir.key] = {
          key: dir.key,
          label: dir.title,
          icon: idx === 0 ? 'ri-cursor-line' : idx === 1 ? 'ri-focus-3-line' : 'ri-scales-3-line',
          description: dir.description,
          prompt: existing?.prompt || dir.prompt,
          generatedImages: existing?.generatedImages || [],
          selectedImage: existing?.selectedImage || '',
          generating: existing?.generating || false,
          error: existing?.error || '',
        };
      });
      return next;
    });
  }, [heroDirections]);

  useEffect(() => {
    if (!Array.isArray(data.generated_images) || data.generated_images.length === 0) return;
    const first = data.generated_images.find((item) => item && typeof item.url === 'string' && item.url.trim());
    if (!first) return;
    const match = heroDirections.find((d) => d.title === (first.direction || '') || d.key === (first.direction || ''));
    if (!match) return;
    setImageDirections((prev) => ({
      ...prev,
      [match.key]: {
        ...prev[match.key],
        generatedImages: [first.url],
        selectedImage: first.url,
      },
    }));
  }, [data.generated_images, heroDirections]);

  const displayTitle = String(pd.title || '未提取到商品标题');
  const score = useMemo(() => {
    const match = ceoText.match(/(\d{2,3})\s*\/\s*100|(\d{2,3})分/);
    const value = Number(match?.[1] || match?.[2] || 72);
    return Math.max(1, Math.min(100, value));
  }, [ceoText]);

  const decisionTag = score >= 75 ? '可以做' : score >= 55 ? '谨慎' : '不建议';
  const summary =
    ceoText.split('\n').find((line) => line.trim().length >= 18) ||
    '当前页面具备基础转化能力，但主图表达与标题关键词仍存在明显优化空间。';
  const titleOptions = [
    displayTitle,
    `${displayTitle} | 高转化标题版本`,
    `${String(pd.brand || '').trim()} ${displayTitle}`.trim(),
  ].filter(Boolean);

  const funnelItems = useMemo(() => {
    const structured = (data as any)?.funnel_diagnosis?.stages ?? (data as any)?.parse_data?.funnel_diagnosis?.stages;
    if (Array.isArray(structured) && structured.length > 0) {
      return structured.slice(0, 3).map((item: any, index: number) => ({
        title: String(item?.title || item?.name || ['曝光 / CTR', '点击 / 转化', '信任 / 复购'][index] || `阶段${index + 1}`),
        level: String(item?.level || item?.grade || '中'),
        score: Number(item?.score || 60),
        issue_summary: String(item?.issue_summary || item?.issues || ''),
        impact_summary: String(item?.impact_summary || item?.impact || ''),
        recommendation_list: Array.isArray(item?.recommendation_list)
          ? item.recommendation_list.map((x: unknown) => String(x))
          : [],
      }));
    }
    // TODO: 后续后端输出 funnel_diagnosis 结构化字段后，替换当前 fallback 映射。
    return [
      {
        title: '曝光 / CTR',
        level: '中',
        score: 67,
        issue_summary: '首图信息密度偏低，核心卖点未在首屏第一眼建立。',
        impact_summary: '曝光到点击的转化受阻，首屏吸引力与点击意愿偏弱。',
        recommendation_list: ['主图加入高意图场景元素', '强化主卖点文案层级', '首图做对比与结果导向表达'],
      },
      {
        title: '点击 / 转化',
        level: '中低',
        score: 58,
        issue_summary: '标题关键词不够聚焦，和类目高意图词覆盖不足。',
        impact_summary: '进页流量与购买意图错配，导致详情页转化效率下降。',
        recommendation_list: ['重写标题关键词结构', '前 80 字符放核心卖点', '统一标题与首图信息'],
      },
      {
        title: '信任 / 复购',
        level: '中',
        score: 63,
        issue_summary: '评价亮点提炼不足，品牌信任信息呈现不完整。',
        impact_summary: '用户对品质稳定性判断成本高，复购与推荐意愿不足。',
        recommendation_list: ['提炼评价高频认可点', '补充质保与售后承诺', '增加品牌背书内容'],
      },
    ];
  }, [data]);

  useEffect(() => {
    setTitleItems(titleOptions.slice(0, 3));
  }, [displayTitle, pd.brand]);

  useEffect(() => {
    const list = (Array.isArray(pd.bullet_points) ? pd.bullet_points : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    setBulletItems(list);
  }, [pd.bullet_points]);

  const setReference = (img: string) => {
    setSelectedReferenceImage(img);
    setGenerateError('');
  };

  const regenerateSingleTitle = (index: number) => {
    setTitleItems((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = `${displayTitle} | 转化优化版 ${index + 1}`;
      return next.slice(0, 3);
    });
  };

  const regenerateSingleBullet = (index: number) => {
    setBulletItems((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      const fallback = ['高转化卖点表达', '差异化价值说明', '购买风险降低承诺'][index] || '高转化卖点';
      next[index] = `${fallback}（优化版）`;
      return next.slice(0, 3);
    });
  };

  const regenerateAllTitles = () => {
    setTitleItems([
      `${displayTitle} | 核心卖点强化版`,
      `${displayTitle} | 高意图关键词版`,
      `${String(pd.brand || '').trim()} ${displayTitle} | 转化提升版`.trim(),
    ].filter(Boolean).slice(0, 3));
  };

  const downloadImage = async (url: string) => {
    if (!url) return;
    try {
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
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const batchDownload = async () => {
    for (const img of images.slice(0, 6)) {
      await downloadImage(img);
    }
  };

  const updateDirection = (key: DirectionKey, patch: Partial<DirectionState>) => {
    setImageDirections((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const updateDirectionPrompt = (key: DirectionKey, value: string) => {
    updateDirection(key, { prompt: value });
  };

  const generateOptimizedImages = async (
    key: DirectionKey,
    options?: { promptOverride?: string; referenceOverride?: string }
  ) => {
    const state = imageDirections[key];
    if (!state) {
      setGenerateError('方向配置缺失，请刷新后重试');
      return;
    }
    const referenceImage = options?.referenceOverride || selectedReferenceImage;
    const requestPrompt = String(options?.promptOverride || state.prompt || '').trim();
    const requestDirection = state.label;
    if (!referenceImage) {
      setGenerateError('请先选择参考图');
      return;
    }
    if (!requestPrompt) {
      setGenerateError('请先填写优化 Prompt');
      return;
    }
    const url = String(pd.url || productUrl || '').trim();
    if (!url || !isHttpUrl(url)) {
      setGenerateError('缺少原始商品URL，无法生成主图');
      return;
    }
    if (!isSupportedEcomUrl(url)) {
      setGenerateError('缺少有效商品链接，无法生成主图');
      return;
    }
    updateDirection(key, { generating: true, error: '' });
    setGenerateError('');
    console.log('[ECOM_IMAGE_GENERATE_REQUEST]', {
      analysis_id: analysisId,
      query: url,
      selected_reference_images: [referenceImage],
      optimize_direction: requestDirection,
      user_prompt: requestPrompt,
      product_context: {
        title: pd.title || '',
        platform: pd.platform || '',
        brand: pd.brand || '',
        price: pd.price || '',
        url: pd.url || url,
        main_image: pd.main_image || '',
        clean_images: Array.isArray(pd.images) ? pd.images : [],
        bullet_points: Array.isArray(pd.bullet_points) ? pd.bullet_points : [],
      },
    });
    try {
      const res = await runFullAnalysis(url, {
        action: 'ecom_optimize_images',
        user_prompt: requestPrompt,
        selected_reference_images: [referenceImage],
        analysis_id: analysisId,
        optimize_direction: requestDirection,
        product_context: {
          title: pd.title || '',
          platform: pd.platform || '',
          brand: pd.brand || '',
          price: pd.price || '',
          url: pd.url || url,
          main_image: pd.main_image || '',
          clean_images: Array.isArray(pd.images) ? pd.images : [],
          bullet_points: Array.isArray(pd.bullet_points) ? pd.bullet_points : [],
        },
      });
      console.log('[ECOM_IMAGE_GENERATE_RESPONSE]', res);
      if (!isEcomProductAnalysisResult(res)) throw new Error('响应类型异常');
      const nextGenerated = Array.isArray(res.generated_images)
        ? res.generated_images
            .filter((item) => item && typeof item.url === 'string' && item.url.trim())
            .slice(0, 1)
            .map((item) => ({
              url: item.url,
              prompt: item.prompt || '',
              direction: item.direction || requestDirection,
            }))
        : [];
      if (nextGenerated.length === 0) {
        throw new Error('接口返回空结果，请稍后重试');
      }
      updateDirection(key, {
        generatedImages: nextGenerated.map((item) => item.url),
        selectedImage: nextGenerated[0]?.url || '',
      });
      onEcomResultUpdate?.({
        ...data,
        ...res,
        parse_data: { ...(data.parse_data || {}), ...(res.parse_data || {}) },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '图像生成服务报错，请稍后重试';
      updateDirection(key, { error: message });
      setGenerateError(message);
      console.error('[ECOM_IMAGE_GENERATE_ERROR]', error);
    } finally {
      updateDirection(key, { generating: false });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-0">
      <section className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
        <div className="h-0.5 w-full bg-[linear-gradient(90deg,#7B61FF,#5B8CFF,rgba(91,140,255,0.2))]" />
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {[
                { icon: 'ri-search-line', label: '商品解析' },
                { icon: 'ri-bar-chart-2-line', label: '增长分析' },
                { icon: 'ri-file-text-line', label: '报告生成' },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2">
                  {idx > 0 ? <span className="h-px w-7 bg-[#EAEAEA]" /> : null}
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(123,97,255,0.1)]">
                      <i className="ri-check-line text-[10px] text-[#7B61FF]" />
                    </span>
                    <span className="text-[11px] font-medium text-[#666666]">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#AAAAAA]">analysisId: <span className="text-[#888888]">{analysisId || '-'}</span></span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(22,163,74,0.08)] px-3 py-1 text-[11px] font-semibold text-[#16a34a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                分析完成
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-6">
        <div className="mb-5 flex items-center gap-2 px-1 text-[12px]">
          <span className="text-[#AAAAAA]">工作台</span>
          <i className="ri-arrow-right-s-line text-[#CCCCCC]" />
          <span className="text-[#AAAAAA]">电商分析</span>
          <i className="ri-arrow-right-s-line text-[#CCCCCC]" />
          <span className="font-medium text-[#444444]">商品增长决策</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#EAEAEA]">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-4 border-b border-[#EAEAEA] bg-white p-6 xl:border-b-0 xl:border-r">
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(123,97,255,0.08)] px-3 py-1 text-[11px] font-semibold text-[#7B61FF]">
                      <i className="ri-store-2-line text-[11px]" />
                    {pd.platform || 'Unknown'}
                  </span>
                  <span className="rounded-full border border-[#EAEAEA] bg-[#F7F8FA] px-3 py-1 text-[11px] text-[#888888]">
                    {(pd as any).category || 'General'}
                  </span>
                </div>

                <div className="rounded-2xl border border-[#EAEAEA] bg-[#F7F8FA] p-4">
                  {selectedImage ? (
                    <img src={selectedImage} alt={displayTitle} className="h-80 w-full rounded-xl object-contain" />
                  ) : (
                    <div className="flex h-80 items-center justify-center text-[#BBBBBB]">暂无主图</div>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img) => (
                    <div key={img} className={`w-20 flex-shrink-0 rounded-lg border p-1 ${selectedImage === img ? 'border-[#7B61FF]' : 'border-[#EAEAEA]'}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className="h-14 w-full overflow-hidden rounded"
                      >
                        <img src={img} alt="thumb" className="h-full w-full bg-[#F7F8FA] object-contain" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReference(img)}
                        className={`mt-1 w-full rounded border px-1 py-0.5 text-[10px] ${
                          selectedReferenceImage === img
                            ? 'border-[#7B61FF] bg-[#7B61FF] text-white'
                            : 'border-[#EAEAEA] bg-white text-[#666666]'
                        }`}
                      >
                        设为参考
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => downloadImage(selectedImage)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm text-[#555555]"><i className="ri-download-line text-[12px]" />保存原图</button>
                  <button type="button" onClick={batchDownload} className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm text-[#555555]"><i className="ri-folder-download-line text-[12px]" />批量下载</button>
                  <button type="button" onClick={() => selectedImage && setReference(selectedImage)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] px-3 py-2 text-sm text-[#555555]"><i className="ri-focus-3-line text-[12px]" />设为参考</button>
                  {selectedReferenceImage ? (
                    <span className="rounded-lg bg-[rgba(123,97,255,0.08)] px-3 py-2 text-sm text-[#7B61FF]">当前参考图已选中</span>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-4">
                  <div className="mb-2 text-xs text-[#888888]">商品身份信息</div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pd.brand ? <span className="rounded-md border border-[#EAEAEA] bg-white px-2 py-1 text-xs text-[#555555]">品牌: {pd.brand}</span> : null}
                  </div>
                  <h1 className="text-[20px] font-bold leading-snug text-[#111111]">{displayTitle}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="text-[28px] font-bold text-[#111111]">{pd.price || '-'}</div>
                    {pd.original_price ? <div className="text-[#AAAAAA] line-through">{pd.original_price}</div> : null}
                    <div className="inline-flex items-center gap-1 text-[#f59e0b]"><i className="ri-star-fill text-[12px]" />{pd.rating || 0}</div>
                    <div className="text-[#777777]">{pd.review_count || 0} reviews</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-[#FAFBFF] p-6">
                <div className="rounded-2xl border border-[#EAEAEA] bg-[linear-gradient(180deg,#FFFFFF,#FAFBFF)] p-5">
                  <div className="mb-3 text-sm text-[#777777]">增长评分</div>
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <svg className="absolute inset-0" width="96" height="96" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#EAEAEA" strokeWidth="8" />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          fill="none"
                          stroke={score >= 75 ? '#16a34a' : score >= 55 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(2 * Math.PI * 38 * score) / 100} ${2 * Math.PI * 38}`}
                          transform="rotate(-90 48 48)"
                        />
                      </svg>
                      <span className="text-[26px] font-bold text-[#111111]">{score}</span>
                    </div>
                    <div>
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
                        style={{
                          background: score >= 75 ? 'rgba(22,163,74,0.12)' : score >= 55 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                          color: score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#ef4444',
                        }}
                      >
                        {decisionTag}
                      </span>
                      <p className="mt-3 text-sm leading-relaxed text-[#555555]">{summary}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#EAEAEA] bg-[#FFF7F7] p-5">
                    <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-error-warning-line text-[14px] text-[#ef4444]" />核心问题</div>
                    <ul className="space-y-2 text-sm text-[#555555]">
                      {HERO_PROBLEMS.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[#EAEAEA] bg-[#F0EEFF] p-5">
                    <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-flashlight-line text-[14px] text-[#7B61FF]" />优先动作</div>
                    <ul className="space-y-2 text-sm text-[#555555]">
                      {HERO_ACTIONS.map((item) => <li key={item}>- {item}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-[0_2px_8px_rgba(17,24,39,0.04)]">
                  <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-bar-chart-grouped-line text-[14px] text-[#7B61FF]" />竞品评分对比</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#555555]">当前商品</span><span className="font-medium text-[#111111]">{score}</span></div>
                    <div className="flex justify-between"><span className="text-[#555555]">头部竞品均值</span><span className="font-medium text-[#111111]">81</span></div>
                    <div className="flex justify-between"><span className="text-[#555555]">类目中位数</span><span className="font-medium text-[#111111]">69</span></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#7B61FF,#5B8CFF)] px-4 py-2.5 text-white shadow-[0_10px_20px_rgba(123,97,255,0.26)]"><i className="ri-flashlight-fill text-[14px]" />立即优化这个商品</button>
                  <button className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAEAEA] bg-white px-4 py-2.5 text-[#555555] hover:border-[#CCCCCC] hover:text-[#111111]"><i className="ri-share-line text-[13px]" />分享报告</button>
                </div>
              </div>
          </div>
        </div>
      </section>

      <div className="px-2 py-6">
        <div className="h-px w-full bg-[#EAEAEA]" />
      </div>

      <section className="rounded-3xl border border-[#EAEAEA] bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 text-[20px] font-bold text-[#111111]"><i className="ri-bar-chart-2-line text-[18px] text-[#7B61FF]" />增长漏斗诊断</h2>
            <p className="mt-1 text-[13px] text-[#888888]">从曝光到复购，逐层定位增长瓶颈</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-4">
            {funnelItems.map((item) => (
              <div key={item.title} className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-[#FCFCFD]">
                <div className="flex items-start gap-4 p-5">
                  <div className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7B61FF,#5B8CFF)] text-[11px] font-bold text-white sm:flex">
                    {funnelItems.findIndex((x) => x.title === item.title) + 1}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setExpandedFunnel((prev) => (prev === item.title ? '' : item.title))}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <div className="inline-flex items-center gap-2">
                          <span className="rounded-full bg-[rgba(123,97,255,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#7B61FF]">
                            {funnelItems.findIndex((x) => x.title === item.title) === 0 ? 'A' : funnelItems.findIndex((x) => x.title === item.title) === 1 ? 'B' : 'C'}
                          </span>
                          <span className="text-[11px] font-semibold text-[#7B61FF]">{item.title}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-[#EAEAEA]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, item.score))}%`,
                                background: item.score >= 75 ? '#16a34a' : item.score >= 55 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span
                            className="text-[13px] font-semibold"
                            style={{ color: item.score >= 75 ? '#16a34a' : item.score >= 55 ? '#d97706' : '#ef4444' }}
                          >
                            {item.score}
                          </span>
                        </div>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAEAEA] bg-white text-sm text-[#999999]">
                        <i className={`ri-arrow-down-s-line transition-transform ${expandedFunnel === item.title ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                  </div>
                </div>
                {expandedFunnel === item.title ? (
                  <div className="grid grid-cols-1 gap-3 border-t border-[#EEEEEE] bg-white p-5 md:grid-cols-3">
                    <div className="rounded-xl border border-[rgba(239,68,68,0.12)] bg-[#FFF7F7] p-4">
                      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#ef4444]"><i className="ri-close-circle-line text-[13px]" />发现问题</div>
                      <div className="text-sm leading-relaxed text-[#555555]">{item.issue_summary}</div>
                    </div>
                    <div className="rounded-xl border border-[rgba(245,158,11,0.15)] bg-[#FFFBF0] p-4">
                      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#d97706]"><i className="ri-alert-line text-[13px]" />影响分析</div>
                      <div className="text-sm leading-relaxed text-[#555555]">{item.impact_summary}</div>
                    </div>
                    <div className="rounded-xl border border-[rgba(22,163,74,0.12)] bg-[#F0FFF4] p-4">
                      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#16a34a]"><i className="ri-lightbulb-line text-[13px]" />优化建议</div>
                      <ul className="space-y-1 text-sm text-[#555555]">
                        {(item.recommendation_list || []).map((rec: string) => (
                          <li key={rec}>- {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="px-2 py-6">
        <div className="h-px w-full bg-[#EAEAEA]" />
      </div>

      <section className="rounded-3xl border border-[#EAEAEA] bg-white p-6">
        <div className="mb-6">
          <h2 className="inline-flex items-center gap-2 text-[20px] font-bold text-[#111111]"><i className="ri-magic-line text-[18px] text-[#7B61FF]" />可执行输出</h2>
          <p className="mt-1 text-[13px] text-[#888888]">标题、卖点与主图方向均可直接执行与复用</p>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-text text-[14px] text-[#7B61FF]" />标题优化（3 个方案）</div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[rgba(123,97,255,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[#7B61FF]">{titleItems.slice(0, 3).length} 个方案</span>
                <button onClick={regenerateAllTitles} className="inline-flex items-center gap-1 rounded-lg border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] px-2 py-1 text-xs text-[#d97706]"><i className="ri-refresh-line text-[11px]" />重新生成全部</button>
              </div>
            </div>
            <div className="space-y-2">
              {titleItems.slice(0, 3).map((item, index) => (
                <div key={item} className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 ${index === 0 ? 'border-[rgba(123,97,255,0.25)] bg-[rgba(123,97,255,0.05)]' : 'border-[#EAEAEA] bg-[#F7F8FA]'}`}>
                  <span className={`truncate text-sm ${index === 0 ? 'font-semibold text-[#7B61FF]' : 'text-[#555555]'}`}>{item}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyText(item)} className="inline-flex items-center gap-1 rounded-lg border border-[rgba(123,97,255,0.2)] bg-[rgba(123,97,255,0.07)] px-2 py-1 text-xs text-[#7B61FF]"><i className="ri-clipboard-line text-[11px]" />复制</button>
                    <button onClick={() => regenerateSingleTitle(index)} className="inline-flex items-center gap-1 rounded-lg border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] px-2 py-1 text-xs text-[#d97706]"><i className="ri-refresh-line text-[11px]" />重生成</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-list-check-3 text-[14px] text-[#0ea5e9]" />核心卖点（最多 3 条 Bullet Points）</div>
              <span className="rounded-full bg-[rgba(14,165,233,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[#0ea5e9]">{bulletItems.slice(0, 3).length} 条</span>
            </div>
            <div className="space-y-2">
              {bulletItems.slice(0, 3).map((item, index) => (
                <div key={item} className="flex items-center justify-between gap-2 rounded-lg border border-[#EAEAEA] bg-[#F7F8FA] p-2.5">
                  <span className="text-sm text-[#555555]">{item}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyText(item)} className="inline-flex items-center gap-1 rounded-lg border border-[rgba(123,97,255,0.2)] bg-[rgba(123,97,255,0.07)] px-2 py-1 text-xs text-[#7B61FF]"><i className="ri-clipboard-line text-[11px]" />复制</button>
                    <button onClick={() => regenerateSingleBullet(index)} className="inline-flex items-center gap-1 rounded-lg border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] px-2 py-1 text-xs text-[#d97706]"><i className="ri-refresh-line text-[11px]" />重生成</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <div className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-image-line text-[14px] text-[#f59e0b]" />主图优化方向（3 个）</div>
            <div className="mb-4 rounded-xl border border-[rgba(123,97,255,0.22)] bg-[rgba(123,97,255,0.03)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
                    {selectedReferenceImage ? (
                      <img src={selectedReferenceImage} alt="current-reference" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#BBBBBB]">未选择</div>
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111]"><i className="ri-focus-3-fill text-[12px] text-[#7B61FF]" />当前参考图</div>
                    <div className="mt-1 text-xs text-[#666666]">
                      参考图用于约束场景、氛围、人物状态与信息层级，不替换商品主体
                    </div>
                  </div>
                </div>
                <button className="inline-flex items-center gap-1 rounded-lg border border-[rgba(123,97,255,0.24)] bg-white px-2 py-1 text-xs text-[#7B61FF]">
                  <i className="ri-focus-3-line text-[11px]" /> {selectedReferenceImage ? '已绑定参考图' : '更换参考图'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {heroDirections.map((direction) => {
                const key = direction.key;
                const dir = imageDirections[key];
                if (!dir) return null;
                const cardImage = dir.selectedImage || dir.generatedImages[0] || '';
                return (
                  <div key={key} className="flex h-full flex-col gap-3 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-[#111111]">
                          <i className={`${dir.icon} text-[14px] text-[#f59e0b]`} />
                          <span>{dir.label}</span>
                        </div>
                        <div className="mt-1 text-xs text-[#666666]">{dir.description}</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#EAEAEA] bg-white p-2 text-xs text-[#666666]">
                      基于参考图提取人物动作、环境氛围、情绪表达，用于当前商品主图生成。
                    </div>

                    <div className="flex h-56 items-center justify-center rounded-lg border border-[#EAEAEA] bg-white p-2">
                      {cardImage ? (
                        <img
                          src={cardImage}
                          alt={`${dir.label}-generated`}
                          className="h-full w-full rounded object-contain"
                        />
                      ) : (
                        <div className="text-center text-xs text-[#BBBBBB]">
                          暂未生成该场景图片
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-[rgba(123,97,255,0.2)] bg-[rgba(123,97,255,0.07)] px-2.5 py-1.5 text-xs text-[#7B61FF]"
                        onClick={() => {
                          if (!selectedReferenceImage || !cardImage) return;
                          setComparePreview({
                            ref: selectedReferenceImage,
                            generated: cardImage,
                            title: dir.label,
                          });
                        }}
                      >
                        <i className="ri-layout-column-line text-[10px]" /> 预览对比
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-[rgba(14,165,233,0.2)] bg-[rgba(14,165,233,0.06)] px-2.5 py-1.5 text-xs text-[#0ea5e9]"
                        onClick={() => {
                          if (!cardImage) return;
                          setZoomPreview({ image: cardImage, title: dir.label });
                        }}
                      >
                        <i className="ri-zoom-in-line text-[10px]" /> 放大预览
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.06)] px-2.5 py-1.5 text-xs text-[#16a34a]"
                        onClick={() => {
                          if (cardImage) downloadImage(cardImage);
                        }}
                      >
                        <i className="ri-download-2-line text-[10px]" /> 下载
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] px-2.5 py-1.5 text-xs text-[#d97706] disabled:opacity-50"
                        onClick={() => generateOptimizedImages(key)}
                        disabled={dir.generating}
                      >
                        <i className={`${dir.generating ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'} text-[10px]`} /> {dir.generating ? '生成中...' : '重新生成'}
                      </button>
                    </div>

                    <div className="mt-auto rounded-lg border border-[#EAEAEA] bg-white p-3">
                      <div className="mb-2 text-xs font-medium text-[#555555]">Prompt 调整（仅当前场景）</div>
                      <textarea
                        value={dir.prompt}
                        onChange={(e) => updateDirectionPrompt(key, e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-[#EAEAEA] p-2 text-sm"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded border border-[rgba(123,97,255,0.2)] bg-[rgba(123,97,255,0.07)] px-2 py-1 text-xs text-[#7B61FF]"
                          onClick={() => copyText(dir.prompt)}
                        >
                          <i className="ri-clipboard-line text-[10px]" /> 复制 prompt
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.06)] px-2 py-1 text-xs text-[#d97706] disabled:opacity-50"
                          onClick={() => generateOptimizedImages(key)}
                          disabled={dir.generating}
                        >
                          <i className={`${dir.generating ? 'ri-loader-4-line animate-spin' : 'ri-magic-line'} text-[10px]`} /> {dir.generating ? '生成中...' : '基于当前 Prompt 生成'}
                        </button>
                      </div>
                      {dir.error ? <div className="mt-2 text-xs text-red-600">{dir.error}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {generateError ? <div className="mt-3 text-sm text-red-600">{generateError}</div> : null}
          </div>
        </div>
      </section>

      <section className="py-6">
        <footer className="rounded-2xl border border-[#EAEAEA] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(17,24,39,0.04)]">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-[12px] text-[#888888]">结果已生成，可直接执行或继续新建分析。</p>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-white px-4 py-2 text-[13px] text-[#555555] hover:border-[#CCCCCC]" onClick={onNewAnalysis}><i className="ri-add-line text-[13px]" />新建分析</button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-white px-4 py-2 text-[13px] text-[#555555] hover:border-[#CCCCCC]"><i className="ri-save-line text-[13px]" />保存报告</button>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#7B61FF,#5B8CFF)] px-4 py-2 text-[13px] text-white shadow-[0_10px_20px_rgba(123,97,255,0.24)]"><i className="ri-send-plane-line text-[13px]" />应用全部优化</button>
            </div>
          </div>
        </footer>
      </section>

      {comparePreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setComparePreview(null)}>
          <div className="w-full max-w-5xl rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold text-gray-900">预览对比 · {comparePreview.title}</div>
              <button className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm" onClick={() => setComparePreview(null)}><i className="ri-close-line text-[12px]" />关闭</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-2">
                <div className="mb-1 text-xs text-gray-500">参考图</div>
                <img src={comparePreview.ref} alt="compare-ref" className="h-80 w-full rounded bg-gray-50 object-contain" />
              </div>
              <div className="rounded-lg border border-gray-200 p-2">
                <div className="mb-1 text-xs text-gray-500">生成图</div>
                <img src={comparePreview.generated} alt="compare-generated" className="h-80 w-full rounded bg-gray-50 object-contain" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {zoomPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setZoomPreview(null)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold text-gray-900">放大预览 · {zoomPreview.title}</div>
              <button className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm" onClick={() => setZoomPreview(null)}><i className="ri-close-line text-[12px]" />关闭</button>
            </div>
            <img src={zoomPreview.image} alt="zoom-preview" className="max-h-[70vh] w-full rounded bg-gray-50 object-contain" />
            <div className="mt-3">
              <button className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm" onClick={() => downloadImage(zoomPreview.image)}><i className="ri-download-2-line text-[12px]" />下载</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
