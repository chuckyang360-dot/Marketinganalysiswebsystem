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

export interface FullAnalysisResponse {
  status: string;
  query: string;
  reddit_analysis: RedditAnalysis;
  seo_analysis: SEOAnalysis;
  gap_analysis: GapAnalysis;
  content_ideas: ContentIdea[];
}
