import type { EvidenceItem, SentimentType } from '../types/analysis';

interface Props {
  item: EvidenceItem;
}

const PLATFORM_CONFIG: Record<EvidenceItem['platform'], { icon: string; color: string; label: string }> = {
  x: { icon: 'X', color: 'from-indigo-500 to-purple-500', label: 'X' },
  reddit: { icon: '💬', color: 'from-orange-500 to-red-500', label: 'Reddit' },
  seo: { icon: '🔍', color: 'from-blue-500 to-cyan-500', label: 'Web' },
  youtube: { icon: '▶️', color: 'from-red-500 to-pink-500', label: 'YouTube' },
  instagram: { icon: '📷', color: 'from-pink-500 to-purple-500', label: 'Instagram' },
};

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
    return trimmed === '' || trimmed === '0' || trimmed === '00' || trimmed === '0000' || trimmed === '00000';
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
  if (trimmed.toLowerCase() === 'reddit' || trimmed.toLowerCase() === 'unknown' || trimmed === '未知作者') {
    return false;
  }
  return true;
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
      if (firstIdx < 100) {
        hardKillHitCount += 1;
      }
    }
  }
  if (hardKillHitCount >= 2) {
    return '';
  }

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
  const noLettersOrDigits = !/[a-zA-Z0-9\u4e00-\u9fa5]/.test(cleaned);
  if (noLettersOrDigits) return '';

  // 限制长度，最多 200 字
  if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 200);
  }

  return cleaned;
}

interface EvidenceSignal {
  label: string;
  value: string;
}

interface EvidenceViewModel {
  platform: EvidenceItem['platform'];
  primaryText: string;
  secondaryText: string;
  metaText: string;
  signals: EvidenceSignal[];
  linkUrl?: string;
  sentiment?: SentimentType | null;
}

function buildViewModel(item: EvidenceItem): EvidenceViewModel {
  const platform = item.platform;
  const sentiment = item.analysis?.sentiment ?? null;
  const cleanedContent = cleanContentPreview(item.content);
  let primaryText = '';
  let secondaryText = cleanedContent || '';
  let metaText = '';
  const signals: EvidenceSignal[] = [];
  const linkUrl = item.url;

  // Helper: safe date
  const getDateText = (iso?: string | null): string => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('zh-CN');
    } catch {
      return '';
    }
  };

  if (platform === 'reddit') {
    // Primary: title -> author
    if (item.title) {
      primaryText = item.title;
    } else if (isMeaningfulAuthor(item.author)) {
      primaryText = item.author!.trim();
    }

    // Meta: published_at
    metaText = getDateText(item.metadata?.published_at);

    // Signals: upvotes / comments / score
    const m = item.metrics || {};
    if (m.upvotes && m.upvotes > 0 && !isZeroLikeValue(m.upvotes)) {
      signals.push({ label: '👍', value: formatNumber(m.upvotes) });
    }
    if (m.comments && m.comments > 0 && !isZeroLikeValue(m.comments)) {
      signals.push({ label: '💬', value: formatNumber(m.comments) });
    }
    if (m.score && m.score > 0 && !isZeroLikeValue(m.score)) {
      signals.push({ label: '⬆️', value: formatNumber(m.score) });
    }
  } else if (platform === 'seo') {
    // Primary: title
    if (item.title) {
      primaryText = item.title;
    }

    // Meta: author + date
    const author = isMeaningfulAuthor(item.author) ? item.author!.trim() : '';
    const dateText = getDateText(item.metadata?.published_at);
    const metaParts: string[] = [];
    if (author) metaParts.push(author);
    if (dateText) metaParts.push(dateText);
    metaText = metaParts.join(' · ');

    // No signals for SEO by default
  } else if (platform === 'x') {
    // Primary: author_display / author
    const displayName = (item.source as any)?.display_name || item.author;
    if (isMeaningfulAuthor(displayName)) {
      primaryText = String(displayName).trim();
    }

    // Meta: created_at / published_at
    metaText = getDateText(item.metadata?.published_at);

    const m = item.metrics || {};
    if (m.likes && m.likes > 0 && !isZeroLikeValue(m.likes)) {
      signals.push({ label: '❤️', value: formatNumber(m.likes) });
    }
    if (m.comments && m.comments > 0 && !isZeroLikeValue(m.comments)) {
      signals.push({ label: '💬', value: formatNumber(m.comments) });
    }
    if (m.reposts && m.reposts > 0 && !isZeroLikeValue(m.reposts)) {
      signals.push({ label: '🔄', value: formatNumber(m.reposts) });
    }
  } else {
    // Fallback for other platforms: title / author / content
    if (item.title) {
      primaryText = item.title;
    } else if (isMeaningfulAuthor(item.author)) {
      primaryText = item.author!.trim();
    }
    metaText = getDateText(item.metadata?.published_at);
  }

  // If no secondary but we have title, try not to duplicate
  if (!secondaryText && item.title && primaryText !== item.title) {
    secondaryText = item.title;
  }

  return {
    platform,
    primaryText: primaryText.trim(),
    secondaryText: secondaryText.trim(),
    metaText: metaText.trim(),
    signals,
    linkUrl,
    sentiment,
  };
}

export function EvidenceCard({ item }: Props) {
  const vm = buildViewModel(item);
  const config = PLATFORM_CONFIG[vm.platform];
  const sentimentInfo = vm.sentiment ? SENTIMENT_COLORS[vm.sentiment] : null;

  return (
    <div
      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
      data-evidence-card={vm.platform}
    >
      {/* Header: Platform & Author */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs text-white font-bold">{config.icon}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {vm.primaryText && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {vm.primaryText}
              </span>
            </div>
          )}
          {sentimentInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentInfo.bg} ${sentimentInfo.text} flex-shrink-0`}>
              {sentimentInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Secondary & meta lines */}
      {vm.secondaryText && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-1">{vm.secondaryText}</p>
      )}
      {vm.metaText && (
        <div className="text-xs text-gray-400 mb-2">{vm.metaText}</div>
      )}

      {/* Signals line */}
      {vm.signals.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {vm.signals.map((sig, idx) => (
            <span key={idx} className="text-xs text-gray-500">
              {sig.label} {sig.value}
            </span>
          ))}
        </div>
      )}

      {/* X-specific debug info for link verification */}
      {vm.platform === 'x' && (
        <div className="mt-1 text-[10px] text-gray-400 space-y-0.5">
          {(() => {
            const url = vm.linkUrl || '';
            const tweetMatch = url.match(/status\/([^/?#]+)/);
            const userMatch = url.match(/x\.com\/([^/]+)/);
            const debugTweetId = tweetMatch ? tweetMatch[1] : 'empty';
            const debugAuthorUsername = userMatch ? userMatch[1] : 'empty';
            const debugAuthor = item.author || 'empty';
            return (
              <>
                <div>
                  resolvedUrl: {url || 'empty'}
                </div>
                <div>
                  tweet_id: {debugTweetId} &nbsp;|&nbsp; author_username: {debugAuthorUsername} &nbsp;|&nbsp; author:{' '}
                  {debugAuthor}
                </div>
                <div>linkRendered: {vm.linkUrl ? 'yes' : 'no'}</div>
              </>
            );
          })()}
        </div>
      )}

      {/* Link */}
      {vm.linkUrl && (
        <a
          href={vm.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
        >
          查看原文-V2 →
        </a>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
