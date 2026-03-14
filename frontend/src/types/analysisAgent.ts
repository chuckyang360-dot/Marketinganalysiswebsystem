import type { EvidenceItem } from './analysis';

export interface AnalysisAgentInput {
  evidence: EvidenceItem[];
  maxItems?: number;  // Limit to top N items by engagement
  query?: string;      // Original search query for context
}

export interface Topic {
  name: string;
  frequency: number;
  platforms: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export interface KeyInsight {
  category: 'opportunity' | 'risk' | 'trend' | 'gap';
  title: string;
  description: string;
  supportingEvidence: number;
  platforms: string[];
}

export interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  mixed?: number;
  dominant: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
}

export interface EmergingPattern {
  pattern: string;
  evidence_count: number;
  confidence: 'high' | 'medium' | 'low';
  platforms: string[];
  timeframe?: string;
}

export interface RecommendedAngle {
  angle: string;
  rationale: string;
  targetAudience?: string;
  contentType?: 'post' | 'video' | 'story' | 'article';
  platforms: string[];
}

export interface AnalysisAgentOutput {
  topics: Topic[];
  key_insights: KeyInsight[];
  sentiment_summary: SentimentSummary;
  emerging_patterns: EmergingPattern[];
  recommended_angles: RecommendedAngle[];
  meta: {
    total_evidence_analyzed: number;
    platforms_covered: string[];
    analysis_timestamp: string;
  };
}

export interface EvidenceItemWithEngagement extends EvidenceItem {
  engagementScore?: number;
}
