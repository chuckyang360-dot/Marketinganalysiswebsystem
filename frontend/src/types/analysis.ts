export type Platform = "x" | "reddit" | "seo" | "youtube" | "instagram";
export type SourceType = "individual" | "brand" | "media" | "community" | "site";
export type ContentType = "post" | "comment" | "tweet" | "article" | "video" | "caption";
export type SentimentType = "positive" | "negative" | "neutral" | "mixed";

// 原始来源字段 - 从平台原始数据直接获取
export interface EvidenceSource {
  username?: string;
  display_name?: string;
  author_id?: string;
  follower_count?: number;
  subscriber_count?: number;
  author_karma?: number;
  verified?: boolean;
  domain_authority?: number;
  source_type?: SourceType;
}

// 原始指标字段 - 从平台原始数据直接获取
export interface EvidenceMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  views?: number;           // 查看次数
  reach?: number;           // 触达人数
  impressions?: number;      // 展示次数
  upvotes?: number;
  downvotes?: number;
  score?: number;
}

// 派生分析字段 - 系统计算的分析结果
export interface EvidenceAnalysis {
  sentiment?: SentimentType;
  relevance_score?: number;
  quality_score?: number;
  authority_score?: number;
  overall_weight?: number;
  engagement_rate?: number;
}

// 平台特定元数据
export interface EvidenceMetadata {
  subreddit?: string;
  domain?: string;
  published_at?: string;
  media_type?: string;
  content_type?: ContentType;
}

// 兼容性：保留旧结构中的 sentiment 在 metadata 中
export interface EvidenceMetadataCompat extends EvidenceMetadata {
  sentiment?: string;
}

export interface EvidenceItem {
  platform: Platform;
  author: string;
  content: string;
  url: string;
  title?: string;
  source?: EvidenceSource;
  metrics?: EvidenceMetrics;
  analysis?: EvidenceAnalysis;
  metadata?: EvidenceMetadata;
}

export interface Sentiment {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Mention {
  title: string;
  url?: string;
  content?: string;
  platform?: string;
  date?: string;
  score?: number;
}

export interface Alert {
  level: string;
  message: string;
  count: number;
  affected_users: string[];
}

export interface RedditAnalysis {
  summary: string;
  sentiment: Sentiment;
  topics: string[];
  alerts: Alert[];
  mentions: Mention[];
}

export interface SEOAnalysis {
  summary: string;
  sentiment: Sentiment;
  topics: string[];
  alerts: Alert[];
  mentions: Mention[];
}

export interface Opportunity {
  keyword: string;
  gap_score: number;
  demand: number;
  supply: number;
}

export interface GapAnalysis {
  reddit_topics: string[];
  seo_topics: string[];
  opportunities: Opportunity[];
}

export interface ContentIdea {
  title: string;
  format: string;
  reason: string;
  target_keyword: string;
}

export interface XAnalysis {
  summary: string;
  stats: {
    total_mentions: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
  };
  alerts: string[];
  topics: string[];
  mentions: {
    text: string;
    author: string;
    engagement: number;
    sentiment: string;
  }[];
}

// AI Report 相关类型（占位实现）
export interface StrategyRecommendation {
  market_judgment?: string;
  channels?: string[];
  positioning?: string;
  content_strategy?: string;
  timing?: string;
  format?: string;
}

export interface Method {
  name: string;
  steps: string[];
  metrics?: string[];
}

export interface ContentPlan {
  articles: Array<{
    title: string;
    outline: string;
    estimated_length?: string;
  }>;
  social_posts: Array<{
    platform: string;
    content: string;
    hashtags?: string[];
  }>;
  video_ideas: Array<{
    title: string;
    script_outline: string;
    estimated_duration?: string;
  }>;
  poster_ideas: Array<{
    headline: string;
    key_message: string;
    cta_text?: string;
  }>;
}

export interface AIReport {
  executive_summary: string;
  market_analysis: string;
  key_findings: string[];
  strategy_recommendations: StrategyRecommendation[];
  methods: Method[];
  content_plan: ContentPlan;
}

// 更新 FullAnalysisResponse，添加 report 字段
export interface FullAnalysisResponse {
  status?: string;
  query: string;
  reddit_analysis: RedditAnalysis;
  seo_analysis: SEOAnalysis;
  x_analysis?: XAnalysis;
  gap_analysis: GapAnalysis;
  content_ideas: ContentIdea[];
  report?: AIReport;  // ← 添加 report 字段（占位实现）
}
