import type {
  EvidenceItem,
  SourceType,
  ContentType,
  SentimentType,
} from '../types/analysis';

// X platform normalization
export function normalizeXMention(mention: {
  text: string;
  author: string;
  author_username?: string;  // Backend field
  author_id?: string;
  author_display_name?: string;
  follower_count?: number;
  followers?: number;  // Backend field
  verified?: boolean;
  engagement?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  shares?: number;  // Backend field
  comments?: number;  // Backend field
  sentiment?: string;
  sentiment_score?: number;  // Backend field
  url?: string;
  created_at?: string;
  timestamp?: string;  // Backend field
  platform_metadata?: Record<string, any>;  // Backend field
  raw?: Record<string, any>;  // Backend field
}): EvidenceItem {
  const followerCount = mention.follower_count ?? mention.followers ?? 0;
  const likes = mention.likes ?? 0;
  const replies = mention.replies ?? mention.comments ?? 0;
  const reposts = mention.reposts ?? mention.shares ?? 0;
  const totalEngagement = likes + replies + reposts;

  // Map backend fields to frontend display name
  const authorName = mention.author_display_name || mention.author || 'Unknown';
  const authorHandle = mention.author_username || mention.author;

  // TODO: Replace with proper influence calculation when backend provides data
  // TODO: Replace with proper authority calculation
  // TODO: Replace with proper overall_weight calculation
  // Should combine relevance, quality, authority, and engagement

  return {
    platform: 'x',
    author: authorName,
    content: mention.text || '',
    url: mention.url || '',
    source: {
      username: authorHandle,
      display_name: authorName,
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
      engagement_rate:
        totalEngagement > 0 && followerCount > 0
          ? (totalEngagement / followerCount) * 100
          : undefined,
    },
    metadata: {
      published_at: mention.timestamp || mention.created_at,
      content_type: 'tweet' as ContentType,
    },
  };
}

// Reddit platform normalization
export function normalizeRedditMention(mention: {
  text?: string;  // Backend sends 'text' field
  title?: string;
  content?: string;
  url?: string;
  platform?: string;
  subreddit?: string;
  author?: string;
  author_username?: string;  // Backend field
  author_display_name?: string;  // Backend field
  author_id?: string;
  author_karma?: number;
  timestamp?: string;  // Backend field
  date?: string;
  score?: number;
  upvotes?: number;
  downvotes?: number;
  comments?: number;  // Backend field
  num_comments?: number;
  post_type?: 'post' | 'comment';
  sentiment?: string;
  sentiment_score?: number;  // Backend field
  followers?: number;  // Backend field
  platform_metadata?: Record<string, any>;  // Backend field
  raw?: Record<string, any>;  // Backend field
}): EvidenceItem {
  const isComment = mention.post_type === 'comment' || (mention.text && !mention.title);
  const authorKarma = mention.author_karma ?? 0;
  const score = mention.score ?? (mention.upvotes ?? 0) - (mention.downvotes ?? 0);
  const upvotes = mention.upvotes ?? Math.max(0, score);
  const comments = mention.comments ?? mention.num_comments ?? 0;

  // Map backend 'text' field to frontend 'content' field
  // Backend: text, Frontend: content
  const content = mention.text || mention.content || mention.title || '';

  // TODO: Replace with proper influence calculation
  // TODO: Replace with proper authority calculation
  // TODO: Replace with proper overall_weight calculation

  return {
    platform: 'reddit',
    author: mention.author_display_name || mention.author_username || mention.author || 'Reddit',
    content: content,
    url: mention.url || '',
    title: mention.title,
    source: {
      username: mention.author_username,
      display_name: mention.author_display_name,
      author_id: mention.author_id,
      author_karma: authorKarma,
      follower_count: mention.followers,
      source_type: 'community' as SourceType,
    },
    metrics: {
      likes: score,  // Map backend 'score' to frontend 'likes'
      upvotes,
      downvotes: mention.downvotes,
      score,
      comments,
      reach: upvotes + comments, // TODO: Replace with actual reach from API
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
    },
    metadata: {
      subreddit: mention.subreddit,
      published_at: mention.timestamp || mention.date,
      content_type: isComment ? 'comment' : 'post' as ContentType,
    },
  };
}

// SEO platform normalization
export function normalizeSEOMention(mention: {
  text?: string;  // Backend sends 'text' field
  title?: string;
  content?: string;
  url?: string;
  platform?: string;
  domain?: string;
  domain_authority?: number;
  author?: string;
  author_display_name?: string;  // Backend field
  published_at?: string;
  timestamp?: string;  // Backend field
  traffic?: number;
  followers?: number;  // Backend field
  sentiment?: string;
  sentiment_score?: number;  // Backend field
  platform_metadata?: Record<string, any>;  // Backend field
  raw?: Record<string, any>;  // Backend field
}): EvidenceItem {
  const domainAuthority = mention.domain_authority ?? 0;
  const traffic = mention.traffic ?? 0;

  // Map backend 'text' field to frontend 'content' field
  // Backend: text, Frontend: content
  const content = mention.text || mention.content || mention.title || '';

  // TODO: Replace with proper authority calculation
  // TODO: Replace with proper overall_weight calculation

  return {
    platform: 'seo',
    author: mention.author_display_name || mention.domain || mention.author || mention.platform || 'Unknown',
    content: content,
    url: mention.url || '',
    title: mention.title,
    source: {
      username: mention.domain,
      display_name: mention.author_display_name,
      domain_authority: domainAuthority,
      follower_count: mention.followers,
      source_type: 'site' as SourceType,
    },
    metrics: {
      reach: traffic,
    },
    analysis: {
      sentiment: mention.sentiment as SentimentType | undefined,
    },
    metadata: {
      domain: mention.domain,
      published_at: mention.timestamp || mention.published_at,
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
  // TODO: Replace with proper authority calculation
  // TODO: Replace with proper overall_weight calculation

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
  // TODO: Replace with proper authority calculation
  // TODO: Replace with proper overall_weight calculation

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
