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
