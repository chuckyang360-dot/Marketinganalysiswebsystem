import { useState, useEffect } from 'react';

interface Topic {
  name: string;
  frequency: number;
  platforms: string[];
  sentiment?: string;
}

interface KeyInsight {
  category: string;
  title: string;
  description: string;
  supporting_evidence: number;
  platforms: string[];
}

interface SentimentSummary {
  positive: number;
  negative: number;
  neutral: number;
  mixed?: number;
  dominant: string | null;
}

interface EmergingPattern {
  pattern: string;
  evidence_count: number;
  confidence: string;
  platforms: string[];
  timeframe?: string;
}

interface RecommendedAngle {
  angle: string;
  rationale: string;
  target_audience?: string;
  content_type?: string;
  platforms: string[];
}

interface AnalysisMeta {
  total_evidence_analyzed: number;
  platforms_covered: string[];
  analysis_timestamp: string;
}

interface AnalysisOutput {
  topics: Topic[];
  key_insights: KeyInsight[];
  sentiment_summary: SentimentSummary;
  emerging_patterns: EmergingPattern[];
  recommended_angles: RecommendedAngle[];
  meta: AnalysisMeta;
}

interface Props {
  data: {
    reddit_analysis: any;
    seo_analysis: any;
    x_analysis: any;
  };
}

export function AnalysisInsights({ data }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);

  // Extract evidence from data and call backend API
  useEffect(() => {
    const analyzeEvidence = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract evidence items from all platforms
        const evidence: any[] = [];

        if (data.reddit_analysis?.mentions) {
          evidence.push(...data.reddit_analysis.mentions);
        }
        if (data.seo_analysis?.mentions) {
          evidence.push(...data.seo_analysis.mentions);
        }
        if (data.x_analysis?.mentions) {
          evidence.push(...data.x_analysis.mentions);
        }

        if (evidence.length === 0) {
          setAnalysis({
            topics: [],
            key_insights: [],
            sentiment_summary: {
              positive: 0,
              negative: 0,
              neutral: 0,
              dominant: null,
            },
            emerging_patterns: [],
            recommended_angles: [],
            meta: {
              total_evidence_analyzed: 0,
              platforms_covered: [],
              analysis_timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Call backend analyze API
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            evidence: evidence,
            max_items: 10,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result: AnalysisOutput = await response.json();
        setAnalysis(result);
      } catch (err) {
        console.error('Analysis failed:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setLoading(false);
      }
    };

    // Only analyze when we have evidence
    const hasEvidence =
      (data.reddit_analysis?.mentions?.length ?? 0) > 0 ||
      (data.seo_analysis?.mentions?.length ?? 0) > 0 ||
      (data.x_analysis?.mentions?.length ?? 0) > 0;

    if (hasEvidence) {
      analyzeEvidence();
    }
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">正在分析证据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
        <div className="text-red-600 font-semibold mb-2">分析失败</div>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const sentimentTotal = (
    (analysis.sentiment_summary.positive || 0) +
    (analysis.sentiment_summary.negative || 0) +
    (analysis.sentiment_summary.neutral || 0) +
    (analysis.sentiment_summary.mixed || 0)
  );

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-gray-600 bg-gray-50';
      case 'mixed':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'opportunity':
        return '💡';
      case 'risk':
        return '⚠️';
      case 'trend':
        return '📈';
      case 'gap':
        return '🔍';
      default:
        return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 shadow-sm text-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          <span>智能分析洞察</span>
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold text-center mb-2">
              {analysis.topics.length}
            </div>
            <div className="text-center font-medium">主导主题</div>
          </div>

          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold text-center mb-2">
              {analysis.key_insights.length}
            </div>
            <div className="text-center font-medium">关键洞察</div>
          </div>

          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold text-center mb-2">
              {analysis.sentiment_summary.positive}
            </div>
            <div className="text-center font-medium">正面</div>
          </div>

          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold text-center mb-2">
              {analysis.sentiment_summary.negative}
            </div>
            <div className="text-center font-medium">负面</div>
          </div>

          <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-4xl font-bold text-center mb-2">
              {analysis.sentiment_summary.neutral}
            </div>
            <div className="text-center font-medium">中性</div>
          </div>
        </div>
      </div>

      {/* Sentiment Summary */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">情绪分布</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 bg-green-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{analysis.sentiment_summary.positive}</div>
            <div className="text-sm text-green-700">正面</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-600">{analysis.sentiment_summary.neutral}</div>
            <div className="text-sm text-gray-700">中性</div>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-600">{analysis.sentiment_summary.negative}</div>
            <div className="text-sm text-red-700">负面</div>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-4">
          主导情绪: {analysis.sentiment_summary.dominant || '未知'}
        </div>
      </div>

      {/* Key Insights */}
      {analysis.key_insights.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">关键洞察</h3>
          <div className="space-y-4">
            {analysis.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  insight.category === 'opportunity'
                    ? 'border-green-200 bg-green-50'
                    : insight.category === 'risk'
                    ? 'border-red-200 bg-red-50'
                    : insight.category === 'trend'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{getCategoryIcon(insight.category)}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{insight.supporting_evidence} 条证据支持</span>
                  <span>• {insight.platforms.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Angles */}
      {analysis.recommended_angles.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">推荐内容角度</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.recommended_angles.map((angle, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">{angle.angle}</h4>
                <p className="text-sm text-gray-600 mb-2">{angle.rationale}</p>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  {angle.target_audience && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">🎯 {angle.target_audience}</span>
                  )}
                  {angle.content_type && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">📹 {angle.content_type}</span>
                  )}
                  <span className="text-gray-500">• {angle.platforms.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta Info */}
      <div className="text-xs text-gray-400 text-center">
        分析了 {analysis.meta.total_evidence_analyzed} 条证据 • 覆盖平台: {analysis.meta.platforms_covered.join(', ')} • {new Date(analysis.meta.analysis_timestamp).toLocaleString()}
      </div>
    </div>
  );
}
