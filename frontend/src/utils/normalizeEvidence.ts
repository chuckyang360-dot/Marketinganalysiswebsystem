import type {
  EvidenceItem,
  EvidenceSource,
  EvidenceMetrics,
  EvidenceAnalysis,
  EvidenceMetadata,
  SourceType,
  ContentType,
  SentimentType,
} from '../types/analysis';

// X platform normalization
export function normalizeXMention(mention: {
  text: string;
  author: string;
  author_id?: string;
  author_display_name?: string;
  follower_count?: number;
  verified?: boolean;
  engagement?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  sentiment?: string;
  url?: string;
  created_at?: string;
}): EvidenceItem {
  const followerCount = mention.follower_count ?? 0;
  const likes = mention.likes ?? 0;
  const replies = mention.replies ?? 0;
  const reposts = mention.reposts ?? 0;
  const totalEngagement = likes + replies + reposts;

  // TODO: Replace with proper influence calculation when backend provides data
  // Current heuristic: log10(follower_count) * 10 is a temporary proxy
  const influenceScore = followerCount > 0 ? Math.log10(followerCount) * 10 : 0;

  // TODO: Replace with proper authority calculation
  // Current: reserved for future implementation
  const authorityScore: number | undefined = undefined;

  // TODO: Replace with proper overall_weight calculation
  // Should combine relevance, quality, authority, and engagement
  const overallWeight: number | undefined = undefined;

  return {
    platform: 'x',
    author: mention.author_display_name || mention.author || 'Unknown',
    content: mention.text || '',
    url: mention.url || '',
    source: {
      username: mention.author,
      display_name: mention.author_display_name,
      author_id: mention.author_id,
      follower_count: followerCount,
      verified: mention.verified,
      source_type: mention.verified ? 'brand' : 'individual' as SourceType,
    },
    metrics: {
      likes,
      comments: replies, // Unify X replies to comments
      reposts,
      reach: followerCount, // TODO: Replace with actual reach from API
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
      engagement_rate: totalEngagement > 0 && followerCount > 0 ? (totalEngagement / followerCount) * 100 : undefined,
      authority_score: authorityScore,
      overall_weight: overallWeight,
    },
    metadata: {
      published_at: mention.created_at,
      content_type: 'tweet' as ContentType,
    },
  };
}

// Reddit platform normalization
export function normalizeRedditMention(mention: {
  title?: string;
  content?: string;
  url?: string;
  platform?: string;
  subreddit?: string;
  author?: string;
  author_id?: string;
  author_karma?: number;
  date?: string;
  score?: number;
  upvotes?: number;
  downvotes?: number;
  num_comments?: number;
  post_type?: 'post' | 'comment';
  sentiment?: string;
}): EvidenceItem {
  const isComment = mention.post_type === 'comment' || (mention.content && !mention.title);
  const authorKarma = mention.author_karma ?? 0;
  const score = mention.score ?? (mention.upvotes ?? 0) - (mention.downvotes ?? 0);
  const upvotes = mention.upvotes ?? Math.max(0, score);
  const comments = mention.num_comments ?? 0;

  // TODO: Replace with proper influence calculation
  // Current heuristic: log10(author_karma) * 5 is a temporary proxy
  const influenceScore = authorKarma > 0 ? Math.log10(authorKarma) * 5 : 0;

  // TODO: Replace with proper authority calculation
  const authorityScore: number | undefined = undefined;

  // TODO: Replace with proper overall_weight calculation
  const overallWeight: number | undefined = undefined;

  return {
    platform: 'reddit',
    author: mention.author || mention.platform || 'Reddit',
    content: mention.content || mention.title || '',
    url: mention.url || '',
    title: mention.title,
    source: {
      username: mention.author,
      author_id: mention.author_id,
      author_karma: authorKarma,
      source_type: 'community' as SourceType,
    },
    metrics: {
      upvotes,
      downvotes: mention.downvotes,
      score,
      comments,
      reach: upvotes + comments, // TODO: Replace with actual reach from API
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
      authority_score: authorityScore,
      overall_weight: overallWeight,
    },
    metadata: {
      subreddit: mention.subreddit,
      published_at: mention.date,
      content_type: isComment ? 'comment' : 'post' as ContentType,
    },
  };
}

// SEO platform normalization
export function normalizeSEOMention(mention: {
  title?: string;
  content?: string;
  url?: string;
  platform?: string;
  domain?: string;
  domain_authority?: number;
  author?: string;
  published_at?: string;
  traffic?: number;
  backlinks?: number;
  sentiment?: string;
}): EvidenceItem {
  const domainAuthority = mention.domain_authority ?? 0;
  const traffic = mention.traffic ?? 0;
  const backlinks = mention.backlinks ?? 0;

  // TODO: Replace with proper authority calculation
  // Current heuristic: domain_authority is used directly as proxy
  const authorityScore = domainAuthority > 0 ? domainAuthority : undefined;

  // TODO: Replace with proper overall_weight calculation
  const overallWeight: number | undefined = undefined;

  return {
    platform: 'seo',
    author: mention.domain || mention.author || mention.platform || 'Unknown',
    content: mention.content || mention.title || '',
    url: mention.url || '',
    title: mention.title,
    source: {
      username: mention.domain,
      domain_authority: domainAuthority,
      source_type: 'site' as SourceType,
    },
    metrics: {
      reach: traffic,
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
      authority_score: authorityScore,
      overall_weight: overallWeight,
    },
    metadata: {
      domain: mention.domain,
      published_at: mention.published_at,
      content_type: 'article' as ContentType,
    },
  };
}

// YouTube platform normalization
export function normalizeYouTubeMention(mention: {
  channel_name?: string;
  channel_id?: string;
  channel_handle?: string;
  subscriber_count?: number;
  video_title?: string;
  video_id?: string;
  description?: string;
  url?: string;
  views?: number;
  likes?: number;
  comments?: number;
  published_at?: string;
  duration?: number;
  sentiment?: string;
}): EvidenceItem {
  const subscriberCount = mention.subscriber_count ?? 0;
  const views = mention.views ?? 0;
  const likes = mention.likes ?? 0;
  const comments = mention.comments ?? 0;

  // TODO: Replace with proper influence calculation
  // Current heuristic: log10(subscriber_count) * 10 is a temporary proxy
  const influenceScore = subscriberCount > 0 ? Math.log10(subscriberCount) * 10 : 0;

  // TODO: Replace with proper authority calculation
  const authorityScore: number | undefined = undefined;

  // TODO: Replace with proper overall_weight calculation
  const overallWeight: number | undefined = undefined;

  return {
    platform: 'youtube',
    author: mention.channel_name || 'Unknown',
    content: mention.description || mention.video_title || '',
    url: mention.url || '',
    title: mention.video_title,
    source: {
      username: mention.channel_handle,
      display_name: mention.channel_name,
      author_id: mention.channel_id,
      subscriber_count: subscriberCount,
      source_type: 'individual' as SourceType,
    },
    metrics: {
      views,
      likes,
      comments,
      reach: views,
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
      engagement_rate: views > 0 ? ((likes + comments) / views) * 100 : undefined,
      authority_score: authorityScore,
      overall_weight: overallWeight,
    },
    metadata: {
      published_at: mention.published_at,
      content_type: 'video' as ContentType,
    },
  };
}

// Instagram platform normalization
export function normalizeInstagramMention(mention: {
  username?: string;
  display_name?: string;
  user_id?: string;
  follower_count?: number;
  verified?: boolean;
  caption?: string;
  url?: string;
  likes?: number;
  comments?: number;
  media_type?: 'image' | 'video' | 'carousel';
  published_at?: string;
  sentiment?: string;
}): EvidenceItem {
  const followerCount = mention.follower_count ?? 0;
  const likes = mention.likes ?? 0;
  const comments = mention.comments ?? 0;

  // TODO: Replace with proper influence calculation
  // Current heuristic: log10(follower_count) * 10 is a temporary proxy
  const influenceScore = followerCount > 0 ? Math.log10(followerCount) * 10 : 0;

  // TODO: Replace with proper authority calculation
  const authorityScore: number | undefined = undefined;

  // TODO: Replace with proper overall_weight calculation
  const overallWeight: number | undefined = undefined;

  return {
    platform: 'instagram',
    author: mention.display_name || mention.username || 'Unknown',
    content: mention.caption || '',
    url: mention.url || '',
    source: {
      username: mention.username,
      display_name: mention.display_name,
      author_id: mention.user_id,
      follower_count: followerCount,
      verified: mention.verified,
      source_type: mention.verified ? 'brand' : 'individual' as SourceType,
    },
    metrics: {
      likes,
      comments,
      reach: followerCount, // TODO: Replace with actual reach from API
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
      engagement_rate: followerCount > 0 ? ((likes + comments) / followerCount) * 100 : undefined,
      authority_score: authorityScore,
      overall_weight: overallWeight,
    },
    metadata: {
      media_type: mention.media_type,
      published_at: mention.published_at,
      content_type: 'caption' as ContentType,
    },
  };
}

export function normalizeEvidence<T extends Record<string, any>>(
  platform: EvidenceItem['platform'],
  data: T
): EvidenceItem {
  switch (platform) {
    case 'x':
      return normalizeXMention(data as any);
    case 'reddit':
      return normalizeRedditMention(data as any);
    case 'seo':
      return normalizeSEOMention(data as any);
    case 'youtube':
      return normalizeYouTubeMention(data as any);
    case 'instagram':
      return normalizeInstagramMention(data as any);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
