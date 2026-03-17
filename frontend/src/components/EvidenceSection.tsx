import { useState, useMemo, useEffect } from 'react';
import type { FullAnalysisResponse, EvidenceItem } from '../types/analysis';
import { EvidenceCard } from './EvidenceCard';
import { normalizeSentiment, normalizeXMention, normalizeRedditMention, normalizeSEOMention } from '../utils/normalizeEvidence';

interface Props {
  data: FullAnalysisResponse;
}

// Filter Types - 为未来多维筛选预留结构
type AudienceSizeFilter = 'all' | '10k+' | '100k+' | '1M+';

type SortBy = 'latest' | 'engagement';

type MinEngagementFilter = 'all' | '1%+' | '3%+' | '5%+';

// 预留的筛选状态结构
interface EvidenceFilters {
  audienceSize: AudienceSizeFilter;
  sortBy: SortBy;
  minEngagement: MinEngagementFilter;
}

export function EvidenceSection({ data }: Props) {
  const [filters, setFilters] = useState<EvidenceFilters>({
    audienceSize: 'all',
    sortBy: 'latest',
    minEngagement: 'all',
  });

  const reddit_analysis = data?.reddit_analysis || {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  };
  const seo_analysis = data?.seo_analysis || {
    summary: '',
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topics: [],
    alerts: [],
    mentions: []
  };
  const x_analysis = data?.x_analysis || {
    summary: '',
    stats: { total_mentions: 0, positive_count: 0, negative_count: 0, neutral_count: 0 },
    alerts: [],
    topics: [],
    mentions: []
  };

  // Normalize all mentions to unified EvidenceItem format（不再前端截断为 5 条）
  const allRedditEvidence: EvidenceItem[] = (reddit_analysis.mentions ?? []).map(
    normalizeRedditMention
  );

  const allSeoEvidence: EvidenceItem[] = (seo_analysis.mentions ?? []).map(
    normalizeSEOMention
  );

  const allXEvidence: EvidenceItem[] = (x_analysis.mentions ?? []).map(
    normalizeXMention
  );

  // 获取受众规模（仅使用 follower_count 和 subscriber_count）
  const getAudienceSize = (item: EvidenceItem): number => {
    if (!item.source) return 0;
    return Math.max(
      item.source.follower_count ?? 0,
      item.source.subscriber_count ?? 0
    );
  };

  // 检查是否有受众规模数据
  const hasAudienceSize = (item: EvidenceItem): boolean => {
    if (!item.source) return false;
    return !!(item.source.follower_count || item.source.subscriber_count);
  };

  // 获取互动率，降级逻辑：analysis.engagement_rate > derived from metrics
  const getEngagementRate = (item: EvidenceItem): number => {
    // 优先使用已计算的 engagement_rate
    if (item.analysis?.engagement_rate !== undefined) {
      return item.analysis.engagement_rate;
    }

    // 降级：从 metrics 派生
    if (!item.metrics) return 0;

    // 计算方法：所有互动指标之和 / 触达或受众规模
    const totalEngagement =
      (item.metrics.likes ?? 0) +
      (item.metrics.comments ?? 0) +
      (item.metrics.reposts ?? 0) +
      (item.metrics.shares ?? 0) +
      (item.metrics.upvotes ?? 0);

    const reach = item.metrics.reach ?? getAudienceSize(item);
    const views = item.metrics.views ?? 0;

    const denominator = Math.max(views, reach);

    if (!denominator) {
      return 0;
    }

    return (totalEngagement / denominator) * 100;
  };

  // 受众规模筛选
  const filterByAudienceSize = (item: EvidenceItem): boolean => {
    if (!hasAudienceSize(item)) {
      return true;
    }
    const audienceSize = getAudienceSize(item);
    switch (filters.audienceSize) {
      case '10k+': return audienceSize >= 10000;
      case '100k+': return audienceSize >= 100000;
      case '1M+': return audienceSize >= 1000000;
      default: return true;
    }
  };

  // 最小互动率筛选
  const filterByMinEngagement = (item: EvidenceItem): boolean => {
    const engagementRate = getEngagementRate(item);
    switch (filters.minEngagement) {
      case '1%+': return engagementRate >= 1;
      case '3%+': return engagementRate >= 3;
      case '5%+': return engagementRate >= 5;
      default: return true;
    }
  };

  // Engagement 排序 - 优先级降级逻辑（仅使用互动信号，不使用 views）
  const getEngagementScore = (item: EvidenceItem): number => {
    // 1. 优先使用系统计算的 engagement_rate
    if (item.analysis?.engagement_rate !== undefined) {
      return item.analysis.engagement_rate;
    }

    const metrics = item.metrics ?? {};

    const likes = metrics.likes ?? 0;
    const comments = metrics.comments ?? 0;
    const reposts = metrics.reposts ?? 0;
    const shares = metrics.shares ?? 0;
    const upvotes = metrics.upvotes ?? 0;

    // 2. 使用互动信号的总和作为排序依据
    const totalEngagement = likes + comments + reposts + shares + upvotes;

    return totalEngagement;
  };

  // 组合所有筛选条件
  const applyFilters = (items: EvidenceItem[]): EvidenceItem[] => {
    return items.filter(filterByAudienceSize).filter(filterByMinEngagement);
  };

  // 应用筛选并排序
  const redditEvidence = useMemo(() => {
    const filtered = applyFilters(allRedditEvidence);
    if (filters.sortBy === 'engagement') {
      return filtered.sort((a, b) => getEngagementScore(b) - getEngagementScore(a));
    }
    return filtered; // latest order preserved
  }, [allRedditEvidence, filters]);

  const seoEvidence = useMemo(() => {
    const filtered = applyFilters(allSeoEvidence);
    if (filters.sortBy === 'engagement') {
      return filtered.sort((a, b) => getEngagementScore(b) - getEngagementScore(a));
    }
    return filtered;
  }, [allSeoEvidence, filters]);

  const xEvidence = useMemo(() => {
    const filtered = applyFilters(allXEvidence);
    if (filters.sortBy === 'engagement') {
      return filtered.sort((a, b) => getEngagementScore(b) - getEngagementScore(a));
    }
    return filtered;
  }, [allXEvidence, filters]);

  // visibleMentions：真正参与渲染的证据列表（经过所有清洗 + 筛选）
  const redditVisible = redditEvidence;
  const seoVisible = seoEvidence;
  const xVisible = xEvidence;

  // 真实 DOM 计数
  const [domCounts, setDomCounts] = useState({ reddit: 0, seo: 0, x: 0 });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const redditDom = document.querySelectorAll('[data-evidence-card="reddit"]').length;
    const seoDom = document.querySelectorAll('[data-evidence-card="seo"]').length;
    const xDom = document.querySelectorAll('[data-evidence-card="x"]').length;
    setDomCounts({ reddit: redditDom, seo: seoDom, x: xDom });
  }, [redditVisible, seoVisible, xVisible]);

  // 统一情绪统计：基于 visibleMentions 重新计算
  const countSentiments = (items: EvidenceItem[]) => {
    return items.reduce(
      (acc, item) => {
        const s = normalizeSentiment(item.analysis?.sentiment);
        if (s === 'positive') acc.positive += 1;
        else if (s === 'negative') acc.negative += 1;
        else acc.neutral += 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );
  };

  const redditSentiments = countSentiments(redditVisible);
  const seoSentiments = countSentiments(seoVisible);
  const xSentiments = countSentiments(xVisible);

  // Debug: log backend-provided sentiment for Reddit / SEO
  useEffect(() => {
    if (!reddit_analysis || !seo_analysis) return;

    const redditFirst5 = (reddit_analysis.mentions ?? []).slice(0, 5).map((m: any, idx: number) => ({
      idx,
      sentiment: m.sentiment ?? null,
      sentiment_score: m.sentiment_score ?? null,
    }));
    const seoFirst5 = (seo_analysis.mentions ?? []).slice(0, 5).map((m: any, idx: number) => ({
      idx,
      sentiment: m.sentiment ?? null,
      sentiment_score: m.sentiment_score ?? null,
    }));

    // Aggregate (backend-provided) – if present
    const redditAgg = (reddit_analysis as any).sentiment ?? null;
    const seoAgg = (seo_analysis as any).sentiment ?? null;

    // Console debug output
    // You can copy these objects directly from DevTools console
    // to verify per-item vs aggregate sentiment for current request.
    // Example key: REDDIT_SENTIMENT_DEBUG, SEO_SENTIMENT_DEBUG.
    // This uses the actual /api/full-analysis response already loaded on the page.
    // No mock data.
    // eslint-disable-next-line no-console
    console.log('REDDIT_SENTIMENT_DEBUG =', {
      aggregate: redditAgg,
      first5: redditFirst5,
    });
    // eslint-disable-next-line no-console
    console.log('SEO_SENTIMENT_DEBUG =', {
      aggregate: seoAgg,
      first5: seoFirst5,
    });
  }, [reddit_analysis, seo_analysis]);

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="space-y-4">
          {/* 第一行：受众规模 + 排序 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">受众规模筛选：</span>
              <div className="flex gap-2">
                {(['all', '10k+', '100k+', '1M+'] as AudienceSizeFilter[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFilters({ ...filters, audienceSize: size })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filters.audienceSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size === 'all' ? '全部' : size}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">排序：</span>
              <div className="flex gap-2">
                {(['latest', 'engagement'] as SortBy[]).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setFilters({ ...filters, sortBy: sort })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filters.sortBy === sort
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sort === 'latest' ? '最新' : '互动量'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 第二行：最小互动率 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">最小互动率：</span>
              <div className="flex gap-2">
                {(['all', '1%+', '3%+', '5%+'] as MinEngagementFilter[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilters({ ...filters, minEngagement: level })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filters.minEngagement === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === 'all' ? '全部' : level}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              总计: {redditVisible.length + seoVisible.length + xVisible.length} 条证据
            </div>
          </div>
        </div>

        {/* 筛选说明 */}
        <div className="space-y-1">
          {filters.audienceSize !== 'all' && (
            <div className="text-xs text-gray-400">
              注：仅对有粉丝/订阅数据的证据生效（X/Instagram/YouTube），Reddit 和 SEO 证据不受此筛选影响
            </div>
          )}
          {filters.minEngagement !== 'all' && (
            <div className="text-xs text-gray-400">
              注：互动率计算优先使用 analysis.engagement_rate，降级使用各平台 metrics
            </div>
          )}
          {filters.sortBy === 'engagement' && (
            <div className="text-xs text-gray-400">
              注：互动量排序优先级: engagement_rate &gt; views &gt; likes &gt; comments &gt; score
            </div>
          )}
        </div>
      </div>
      {/* Reddit Evidence */}
      <div id="section-reddit-evidence" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">💬</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Reddit 证据</h2>
          <div className="ml-2 text-xs text-gray-500 space-y-0.5">
            <div>{redditVisible.length} 条讨论</div>
            <div>
              raw {allRedditEvidence.length} / filtered {redditEvidence.length} / visible {redditVisible.length} / realDOM {domCounts.reddit} / sentiment {redditSentiments.positive}-{redditSentiments.negative}-{redditSentiments.neutral}
            </div>
          </div>
        </div>

        {/* Reddit Sentiment */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{redditSentiments.positive}</div>
            <div className="text-sm text-gray-600 mt-1">正面</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{redditSentiments.negative}</div>
            <div className="text-sm text-gray-600 mt-1">负面</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{redditSentiments.neutral}</div>
            <div className="text-sm text-gray-600 mt-1">中性</div>
          </div>
        </div>

        {/* Reddit Evidence Cards */}
        <div className="space-y-3">
          {redditVisible.map((item, idx) => (
            <EvidenceCard key={`reddit-${idx}`} item={item} />
          ))}
        </div>
      </div>

      {/* SEO Evidence */}
      <div id="section-seo-evidence" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">SEO 证据</h2>
          <div className="ml-2 text-xs text-gray-500 space-y-0.5">
            <div>{seoVisible.length} 条内容</div>
            <div>
              raw {allSeoEvidence.length} / filtered {seoEvidence.length} / visible {seoVisible.length} / realDOM {domCounts.seo} / sentiment {seoSentiments.positive}-{seoSentiments.negative}-{seoSentiments.neutral}
            </div>
          </div>
        </div>

        {/* SEO Sentiment */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{seoSentiments.positive}</div>
            <div className="text-sm text-gray-600 mt-1">正面</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{seoSentiments.negative}</div>
            <div className="text-sm text-gray-600 mt-1">负面</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{seoSentiments.neutral}</div>
            <div className="text-sm text-gray-600 mt-1">中性</div>
          </div>
        </div>

        {/* SEO Evidence Cards */}
        <div className="space-y-3">
          {seoVisible.map((item, idx) => (
            <EvidenceCard key={`seo-${idx}`} item={item} />
          ))}
        </div>
      </div>

      {/* X Sentiment Evidence */}
      {xVisible.length > 0 && (
        <div id="section-x-sentiment" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">X 舆情证据</h2>
            <div className="ml-2 text-xs text-gray-500 space-y-0.5">
              <div>{xVisible.length} 条提及</div>
              <div>
                raw {allXEvidence.length} / filtered {xEvidence.length} / visible {xVisible.length} / realDOM {domCounts.x} / sentiment {xSentiments.positive}-{xSentiments.negative}-{xSentiments.neutral}
              </div>
            </div>
          </div>

          {/* X Sentiment */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{xSentiments.positive}</div>
              <div className="text-sm text-gray-600 mt-1">正面</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{xSentiments.negative}</div>
              <div className="text-sm text-gray-600 mt-1">负面</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{xSentiments.neutral}</div>
              <div className="text-sm text-gray-600 mt-1">中性</div>
            </div>
          </div>

          {/* X Evidence Cards */}
          <div className="space-y-3">
            {xVisible.map((item, idx) => (
              <EvidenceCard key={`x-${idx}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
