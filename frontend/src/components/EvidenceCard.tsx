import type { EvidenceItem, SentimentType } from '../types/analysis';

interface Props {
  item: EvidenceItem;
}

const SENTIMENT_COLORS: Record<SentimentType, { bg: string; text: string; label: string }> = {
  positive: { bg: 'bg-green-50', text: 'text-green-600', label: '正面' },
  negative: { bg: 'bg-red-50', text: 'text-red-600', label: '负面' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', label: '中性' },
  mixed: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: '混合' },
};

function isZeroLikeValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return value === 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return (
      trimmed === '' ||
      trimmed === '0' ||
      trimmed === '00' ||
      trimmed === '0000' ||
      trimmed === '00000'
    );
  }
  return false;
}

function isMeaningfulAuthor(author?: string | null): boolean {
  if (!author) return false;
  const trimmed = author.trim();
  if (!trimmed) return false;

  // 内部 ID 如 t2_xxx / t3_xxx
  if (/^t[23]_[A-Za-z0-9]+$/.test(trimmed)) return false;

  // 明显占位
  if (
    trimmed.toLowerCase() === 'reddit' ||
    trimmed.toLowerCase() === 'unknown' ||
    trimmed === '未知作者'
  ) {
    return false;
  }

  return true;
}

function getDisplayAuthor(item: EvidenceItem): string {
  const raw = ((item as any).author || (item as any).author_username || '').trim();

  if (item.platform === 'reddit') {
    const subreddit = ((item as any).platform_metadata?.subreddit as string) || 'ecommerce';
    const title = ((item as any).platform_metadata?.title as string) || '';
    // 从 title 提取 r/xxx 如果有
    const rMatch = title.match(/r\/([A-Za-z0-9_]+)/i);
    if (rMatch) return `r/${rMatch[1]} 用户`;
    return `${subreddit} subreddit 用户`;
  }

  if (item.platform === 'seo') {
    try {
      const hostname = item.url ? new URL(item.url).hostname.replace('www.', '') : '';
      const friendlyMap: Record<string, string> = {
        'ads.tiktok.com': 'TikTok Ads Manager',
        'seller.tiktok.com': 'TikTok Seller Center',
        'business.tiktok.com': 'TikTok Business',
        'shop.tiktok.com': 'TikTok Shop',
        'developers.tiktok.com': 'TikTok Developers',
        'help.tiktok.com': 'TikTok 帮助中心',
      };
      if (!hostname) return 'TikTok 官方内容';
      return (
        friendlyMap[hostname] ||
        `${hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)} 官方`
      );
    } catch {
      return 'TikTok 官方内容';
    }
  }

  if (item.platform === 'x') {
    return (item as any).author_username || item.author || 'X 用户';
  }

  return isMeaningfulAuthor(raw) ? raw : '社区用户';
}

function cleanContentPreview(raw?: string | null): string {
  if (!raw) return '';
  let text = raw;

  // 第一层：强规则直接判死（页面壳子/模板占比极高）
  const hardKillPatterns = [
    'Reddit - The heart of the internet',
    'Skip to main content',
    'first-child',
    'rounded',
    'mb-',
    'Go to ',
    'Privacy Policy',
    'User Agreement',
    'Shopify today',
    'Start free trial',
    'Start selling with Shopify',
  ];

  const lower = text.toLowerCase();
  let hardKillHitCount = 0;
  for (const pat of hardKillPatterns) {
    const patLower = pat.toLowerCase();
    const firstIdx = lower.indexOf(patLower);
    if (firstIdx !== -1) {
      hardKillHitCount += 1;
      // 前 100 字符内出现也算强噪声
      if (firstIdx < 100) hardKillHitCount += 1;
    }
  }
  if (hardKillHitCount >= 2) return '';

  // 第二层：提取“人话”句子
  const splitCandidates = text
    .split(/[\n。.!?]+| - /)
    .map(s => s.trim())
    .filter(Boolean);

  const templateSubstrings = [
    'skip to content',
    'skip to main content',
    'start selling with shopify today',
    'start your free trial',
    'start for free',
    'subscribe',
    'popular posts',
    'sell anywhere with shopify',
    'back to all',
    'read more',
    'read article',
    'read story',
    'click here',
    'share',
    'promoted',
    'continue this thread',
    'automoderator',
    'privacy policy',
    'user agreement',
  ];

  const isTemplatey = (s: string) => {
    const ls = s.toLowerCase();
    return templateSubstrings.some(t => ls.includes(t));
  };

  const humanSegments: string[] = [];
  for (const seg of splitCandidates) {
    if (seg.length <= 20) continue;
    if (isTemplatey(seg)) continue;
    humanSegments.push(seg);
    if (humanSegments.length >= 2) break;
  }

  let cleaned = humanSegments.join(' ').trim();

  // 第三层：最终过滤
  if (!cleaned) return '';
  if (cleaned.length < 20) return '';
  if (isZeroLikeValue(cleaned)) return '';

  // 只包含符号或重复字符（如 ==== 或 ****** 等）
  const noLettersOrDigits = !/[a-zA-Z0-9一-龥]/.test(cleaned);
  if (noLettersOrDigits) return '';

  // 限制长度，最多 200 字
  if (cleaned.length > 200) cleaned = cleaned.slice(0, 200);

  return cleaned;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatTimestamp(iso?: string | null): string {
  if (!iso) return '未知时间';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '未知时间';
    return d.toLocaleDateString('zh-CN');
  } catch {
    return '未知时间';
  }
}

function buildHeadline(item: EvidenceItem): string {
  // headline = 内容骨干（优先清洗后的 content），兜底 title
  const cleaned = cleanContentPreview(item.content);
  const fallback = item.title || item.content || '';
  return (cleaned || fallback || '暂无内容').trim();
}

function buildInteractionsText(item: EvidenceItem): string {
  if (item.platform === 'seo') return '搜索结果';

  const likes = ((item as any).likes ?? 0) as number;
  const comments = ((item as any).comments ?? 0) as number;
  const engagement = ((item as any).engagement ?? 0) as number;

  if (item.platform === 'reddit') {
    if (likes === 0 && comments === 0) return '互动：暂无';
    return `互动：${formatNumber(likes)} 赞 · ${formatNumber(comments)} 评`;
  }

  if (item.platform === 'x') {
    if (engagement === 0) return '互动：暂无';
    return `互动：${formatNumber(engagement)} 总互动`;
  }

  return '互动：暂无';
}

function getDisplayTimestamp(item: EvidenceItem): string {
  const candidates = [
    (item as any).created_at,
    (item as any).timestamp,
    (item as any).platform_metadata?.publishedDate,
    (item as any).platform_metadata?.published_at,
  ].filter(Boolean) as string[];

  for (const ts of candidates) {
    const formatted = formatTimestamp(ts);
    if (formatted !== '未知时间') return formatted;
  }

  if (item.platform === 'seo') return 'TikTok 官方更新';
  if (item.platform === 'reddit') return '社区最近讨论';
  if (item.platform === 'x') return '最近发布';
  return '最近';
}

export function EvidenceCard({ item }: Props) {
  // 1) 作者
  const authorText = getDisplayAuthor(item);

  // 2) 情绪标签
  const sentiment: SentimentType = (item.analysis?.sentiment ?? 'neutral') as SentimentType;
  const sentimentInfo = SENTIMENT_COLORS[sentiment] ?? SENTIMENT_COLORS.neutral;

  // 3) 内容骨干
  const headline = buildHeadline(item);

  // 4) 互动数字 / 5) 发布时间 / 6) 查看原文
  const interactionsText = buildInteractionsText(item);
  const timestampText = getDisplayTimestamp(item);
  const originalUrl = item.url || '';

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="text-lg font-bold text-gray-900 truncate">{authorText}</div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${sentimentInfo.bg} ${sentimentInfo.text}`}
        >
          {sentimentInfo.label}
        </span>
      </div>

      <p className="mt-3 text-base leading-7 line-clamp-4 font-medium text-gray-900">{headline}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-700">{interactionsText}</div>
        <div className="text-xs text-gray-500 whitespace-nowrap">{timestampText}</div>
        {originalUrl ? (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            查看原文 →
          </a>
        ) : (
          <span className="text-sm font-semibold text-gray-400">查看原文</span>
        )}
      </div>
    </div>
  );
}
