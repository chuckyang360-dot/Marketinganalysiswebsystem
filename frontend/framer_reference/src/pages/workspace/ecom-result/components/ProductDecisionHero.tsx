import { useState } from "react";
import type { EcomResultData } from "@/mocks/ecomResult";
import ProductImageGallery, { type GalleryImage } from "./ProductImageGallery";

const renderMiniStars = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <i key={i} className="ri-star-fill text-[10px]" style={{ color: "#f59e0b" }} />;
        if (i === full && half) return <i key={i} className="ri-star-half-fill text-[10px]" style={{ color: "#f59e0b" }} />;
        return <i key={i} className="ri-star-line text-[10px]" style={{ color: "#D0D0D0" }} />;
      })}
    </div>
  );
};

interface Props {
  data: EcomResultData;
  onSetReference?: (img: GalleryImage) => void;
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  Amazon: { bg: "rgba(255,153,0,0.10)", color: "#d97706", icon: "ri-amazon-fill" },
  Shopee: { bg: "rgba(238,77,45,0.10)", color: "#ee4d2d", icon: "ri-shopping-bag-line" },
  Lazada: { bg: "rgba(0,149,255,0.10)", color: "#0095ff", icon: "ri-shopping-cart-line" },
  TikTok: { bg: "rgba(0,0,0,0.07)", color: "#111111", icon: "ri-tiktok-fill" },
};

const SEVERITY_MAP = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "高优先" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "中优先" },
  low: { color: "#6b7280", bg: "rgba(107,114,128,0.08)", label: "低优先" },
};

function CompetitorComparison({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { competitors } = data as typeof data & { competitors: Array<{
    id: string; name: string; brand: string; price: string; rating: number;
    reviewCount: number; score: number; badge: string; badgeColor: string;
    strengths: string[]; isSelf?: boolean;
  }> };

  if (!competitors || competitors.length === 0) return null;

  const maxScore = Math.max(...competitors.map((c) => c.score));

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-bar-chart-grouped-line text-[14px]" style={{ color: "#7B61FF" }} />
          </div>
          <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>竞品评分对比</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}>
            {competitors.length} 个竞品
          </span>
        </div>
        {expanded
          ? <i className="ri-arrow-up-s-line text-[14px]" style={{ color: "#AAAAAA" }} />
          : <i className="ri-arrow-down-s-line text-[14px]" style={{ color: "#AAAAAA" }} />
        }
      </button>

      {/* Collapsed: mini bar preview */}
      {!expanded && (
        <div className="px-4 pb-3">
          <div className="flex items-end gap-2">
            {competitors.map((c) => {
              const pct = Math.round((c.score / maxScore) * 100);
              return (
                <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: c.isSelf ? "#7B61FF" : "#888888" }}>{c.score}</span>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: "4px", background: "#F0F0F0" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: c.isSelf ? "linear-gradient(90deg, #7B61FF, #5B8CFF)" : "#D0D0D0",
                      }} />
                  </div>
                  <span className="text-[9px] truncate w-full text-center" style={{ color: c.isSelf ? "#7B61FF" : "#AAAAAA" }}>
                    {c.brand}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded: full table */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {competitors.map((c) => {
            const pct = Math.round((c.score / maxScore) * 100);
            const isBest = c.score === maxScore;
            return (
              <div key={c.id}
                className="rounded-lg p-3 transition-all duration-150"
                style={{
                  background: c.isSelf ? "rgba(123,97,255,0.04)" : "#FAFAFA",
                  border: c.isSelf ? "1px solid rgba(123,97,255,0.18)" : "1px solid #F0F0F0",
                }}>
                <div className="flex items-center gap-3">
                  {/* Score circle */}
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full font-bold text-[13px]"
                    style={{
                      background: c.isSelf ? "linear-gradient(135deg, #7B61FF22, #5B8CFF22)" : "#F0F0F0",
                      color: c.isSelf ? "#7B61FF" : "#666666",
                    }}>
                    {c.score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[12px] font-semibold truncate" style={{ color: "#111111" }}>{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: `${c.badgeColor}15`, color: c.badgeColor }}>
                        {c.badge}
                      </span>
                      {isBest && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                          style={{ background: "rgba(245,158,11,0.10)", color: "#d97706" }}>
                          <i className="ri-trophy-fill text-[9px]" /> 评分最高
                        </span>
                      )}
                    </div>
                    {/* Score bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#EBEBEB" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: c.isSelf ? "linear-gradient(90deg, #7B61FF, #5B8CFF)" : "#C8C8C8",
                          }} />
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "#888888" }}>{pct}%</span>
                    </div>
                    {/* Meta row */}
                    <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] font-semibold" style={{ color: "#111111" }}>{c.price}</span>
                      <div className="flex items-center gap-1">
                        {renderMiniStars(c.rating)}
                        <span className="text-[10px]" style={{ color: "#888888" }}>{c.rating}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: "#AAAAAA" }}>
                        {c.reviewCount.toLocaleString()} 评论
                      </span>
                    </div>
                    {/* Strengths */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {c.strengths.map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{ background: "#F5F5F5", color: "#666666", border: "1px solid #EBEBEB" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary hint */}
          <div className="mt-1 flex items-start gap-2 px-1">
            <i className="ri-lightbulb-line text-[12px] mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "#888888" }}>
              当前商品在同价位竞品中综合评分相近，但与高端竞品（Sony）存在明显差距。建议重点强化<strong style={{ color: "#555555" }}>差异化卖点</strong>，在性价比区间建立护城河。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDecisionHero({ data, onSetReference }: Props) {
  const { product, decision } = data;
  const platform = PLATFORM_COLORS[data.platform] ?? PLATFORM_COLORS.Amazon;

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <i key={i} className="ri-star-fill text-[12px]" style={{ color: "#f59e0b" }} />;
          if (i === full && half) return <i key={i} className="ri-star-half-fill text-[12px]" style={{ color: "#f59e0b" }} />;
          return <i key={i} className="ri-star-line text-[12px]" style={{ color: "#D0D0D0" }} />;
        })}
      </div>
    );
  };

  const productWithImages = product as typeof product & {
    images?: Array<{ id: string; url: string; label: string; tag: string }>;
  };

  return (
    <section className="w-full px-6 lg:px-10 pt-8 pb-6">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[12px]" style={{ color: "#AAAAAA" }}>工作台</span>
          <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />
          <span className="text-[12px]" style={{ color: "#AAAAAA" }}>电商分析</span>
          <i className="ri-arrow-right-s-line text-[11px]" style={{ color: "#CCCCCC" }} />
          <span className="text-[12px] font-medium" style={{ color: "#444444" }}>商品增长决策</span>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #EAEAEA", background: "#ffffff" }}>
          <div className="flex flex-col lg:flex-row">

            {/* Left: Product Card — 40% */}
            <div className="lg:w-[40%] p-6 flex flex-col gap-5" style={{ borderRight: "1px solid #EAEAEA" }}>
              {/* Platform + Category */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: platform.bg, color: platform.color }}>
                  <i className={`${platform.icon} text-[11px]`} />
                  {data.platform}
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full"
                  style={{ background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }}>
                  {product.category}
                </span>
              </div>

              {/* Product Image Gallery */}
              {productWithImages.images && productWithImages.images.length > 0 ? (
                <ProductImageGallery
                  images={productWithImages.images}
                  productTitle={product.title}
                  onSetReference={onSetReference}
                />
              ) : (
                <div className="w-full rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ height: "220px", background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                  <div className="flex flex-col items-center gap-2">
                    <i className="ri-image-line text-[32px]" style={{ color: "#CCCCCC" }} />
                    <span className="text-[11px]" style={{ color: "#CCCCCC" }}>商品图片</span>
                  </div>
                </div>
              )}

              {/* Brand */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium px-2 py-1 rounded-md"
                  style={{ background: "rgba(123,97,255,0.07)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.15)" }}>
                  {product.brand}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-[14px] font-semibold leading-snug"
                style={{
                  color: "#111111",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                {product.title}
              </h2>

              {/* Price + Rating */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[24px] font-bold" style={{ color: "#111111" }}>{product.price}</span>
                  {product.originalPrice && (
                    <span className="ml-2 text-[13px] line-through" style={{ color: "#AAAAAA" }}>{product.originalPrice}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {renderStars(product.rating)}
                  <span className="text-[11px]" style={{ color: "#888888" }}>
                    {product.rating} · {product.reviewCount.toLocaleString()} 评论
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Decision Card — 60% */}
            <div className="lg:w-[60%] p-6 flex flex-col gap-5" style={{ background: "#FAFBFF" }}>

              {/* Score + Verdict */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Score Ring */}
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="27" fill="none" stroke="#EAEAEA" strokeWidth="5" />
                      <circle cx="32" cy="32" r="27" fill="none"
                        stroke={decision.verdictColor}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 27 * decision.score / 100} ${2 * Math.PI * 27}`}
                        transform="rotate(-90 32 32)" />
                    </svg>
                    <span className="text-[15px] font-bold" style={{ color: decision.verdictColor }}>{decision.score}</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold"
                      style={{ background: decision.verdictBg, color: decision.verdictColor }}>
                      <i className="ri-checkbox-circle-fill text-[14px]" />
                      {decision.verdict}
                    </span>
                    <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "#555555" }}>
                      {decision.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Problems + Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Top Problems */}
                <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-error-warning-line text-[14px]" style={{ color: "#ef4444" }} />
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>3 个核心问题</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {decision.topProblems.map((p) => {
                      const sev = SEVERITY_MAP[p.severity];
                      return (
                        <div key={p.rank} className="flex items-center gap-2.5">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 text-white"
                            style={{ background: sev.color }}>
                            {p.rank}
                          </span>
                          <span className="text-[12px] flex-1" style={{ color: "#444444" }}>{p.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: sev.bg, color: sev.color }}>
                            {sev.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Actions */}
                <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-flashlight-line text-[14px]" style={{ color: "#7B61FF" }} />
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: "#111111" }}>3 个优先动作</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {decision.priorityActions.map((a) => (
                      <div key={a.rank} className="flex items-center gap-2.5">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 text-white"
                          style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
                          {a.rank}
                        </span>
                        <span className="text-[12px]" style={{ color: "#444444" }}>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Competitor Comparison */}
              <CompetitorComparison data={data} />

              {/* CTA */}
              <div className="flex items-center gap-3 mt-1">
                <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white cursor-pointer transition-opacity duration-200 hover:opacity-88 whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
                  <i className="ri-flashlight-fill text-[14px]" />
                  立即优化这个商品
                </button>
                <button className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                  style={{ background: "#ffffff", border: "1px solid #EAEAEA", color: "#555555" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#CCCCCC"; (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#EAEAEA"; (e.currentTarget as HTMLElement).style.color = "#555555"; }}>
                  <i className="ri-share-line text-[13px]" />
                  分享报告
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
