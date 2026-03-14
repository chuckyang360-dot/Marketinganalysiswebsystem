import type {
  AnalysisAgentInput,
  AnalysisAgentOutput,
  EvidenceItemWithEngagement,
} from '../types/analysisAgent';
import type { EvidenceItem } from '../types/analysis';

const GROK_API_BASE_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Calculate engagement score for sorting evidence items
 * Uses interaction signals only (likes, comments, reposts, shares, upvotes)
 */
function calculateEngagementScore(item: EvidenceItem): number {
  // Use system-calculated engagement_rate if available
  if (item.analysis?.engagement_rate !== undefined) {
    return item.analysis.engagement_rate;
  }

  const metrics = item.metrics ?? {};
  const likes = metrics.likes ?? 0;
  const comments = metrics.comments ?? 0;
  const reposts = metrics.reposts ?? 0;
  const shares = metrics.shares ?? 0;
  const upvotes = metrics.upvotes ?? 0;

  return likes + comments + reposts + shares + upvotes;
}

/**
 * Extract topics from evidence items
 */
function extractTopics(items: EvidenceItem[]): string[] {
  const topics: string[] = [];

  for (const item of items) {
    if (item.title) {
      topics.push(item.title);
    }
    if (item.content && item.content.length > 20) {
      topics.push(item.content);
    }
  }

  return topics;
}

/**
 * Build evidence summary for prompt context
 */
function buildEvidenceSummary(items: EvidenceItem[]): string {
  return items.map((item, idx) => {
    const platform = item.platform.toUpperCase();
    const author = item.author || 'Unknown';
    const content = item.content?.substring(0, 200) || '';
    const likes = item.metrics?.likes ?? 0;
    const comments = item.metrics?.comments ?? 0;
    const views = item.metrics?.views ?? 0;
    const sentiment = item.analysis?.sentiment || 'neutral';

    let summary = `[${idx + 1}] ${platform} - ${author}\n`;
    summary += `Content: ${content}\n`;
    summary += `Engagement: ${likes} likes, ${comments} comments, ${views} views\n`;
    summary += `Sentiment: ${sentiment}\n`;

    if (item.source?.subreddit) {
      summary += `Subreddit: ${item.source.subreddit}\n`;
    }
    if (item.metadata?.domain) {
      summary += `Domain: ${item.metadata.domain}\n`;
    }

    return summary;
  }).join('\n---\n');
}

/**
 * Generate Grok analysis prompt
 */
function generateAnalysisPrompt(
  items: EvidenceItem[],
  query?: string
): string {
  const evidenceSummary = buildEvidenceSummary(items);
  const itemCount = items.length;

  return `You are a marketing intelligence analyst.

Your task is to analyze real discussions from social media and web sources.

Focus ONLY on:

1. What users are actually talking about
2. Problems, complaints, or unmet needs
3. Emerging trends or repeated discussions
4. Content opportunities based on discussions

Important rules:

- Do NOT summarize product features.
- Do NOT describe the platform itself.
- Focus on user conversations and behavior.
- Identify discussion themes, not product modules.

Query:
${query || 'N/A'}

Evidence:
${evidenceSummary}

Return JSON with:

topics (3-5 discussion themes based on user conversations)

key_insights (3-5 real insights derived from discussions)

sentiment_summary

emerging_patterns (recurring patterns or new discussion themes, not product components)

recommended_angles (actionable marketing or content opportunities)

Return VALID JSON ONLY.
No markdown.
No explanation outside JSON.`;
}

/**
 * Call Grok API for analysis
 */
async function callGrokAnalysis(prompt: string, apiKey: string): Promise<any> {
  const response = await fetch(GROK_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful marketing intelligence analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in Grok response');
  }

  // Try to parse JSON from response
  try {
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from markdown
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse Grok response as JSON');
  }
}

/**
 * Main Analysis Agent function
 */
export async function analyzeEvidence(
  input: AnalysisAgentInput,
  grokApiKey?: string
): Promise<AnalysisAgentOutput> {
  const { evidence, maxItems = 10, query } = input;

  if (!evidence || evidence.length === 0) {
    return {
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
    };
  }

  // Sort by engagement and limit to top N
  const itemsWithEngagement: EvidenceItemWithEngagement[] = evidence
    .map((item) => ({
      ...item,
      engagementScore: calculateEngagementScore(item),
    }))
    .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
    .slice(0, maxItems);

  const platformsCovered = Array.from(
    new Set(itemsWithEngagement.map((item) => item.platform))
  );

  // If API key is provided, use Grok for analysis
  if (grokApiKey) {
    try {
      const prompt = generateAnalysisPrompt(itemsWithEngagement, query);
      const analysisResult = await callGrokAnalysis(prompt, grokApiKey);

      return {
        ...analysisResult,
        meta: {
          total_evidence_analyzed: itemsWithEngagement.length,
          platforms_covered: platformsCovered,
          analysis_timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Grok analysis failed:', error);
      // Fall back to basic analysis
      return performBasicAnalysis(itemsWithEngagement, platformsCovered, query);
    }
  }

  // Basic analysis without AI
  return performBasicAnalysis(itemsWithEngagement, platformsCovered, query);
}

/**
 * Perform basic analysis without AI (fallback)
 */
function performBasicAnalysis(
  items: EvidenceItem[],
  platformsCovered: string[],
  query?: string
): AnalysisAgentOutput {
  // Count sentiment
  const sentimentCounts = {
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0,
  };

  // Extract topics from titles
  const topicMap = new Map<string, { count: number; platforms: Set<string> }>();

  for (const item of items) {
    const sentiment = item.analysis?.sentiment;
    if (sentiment) {
      sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
    }

    if (item.title && item.title.length > 0) {
      const key = item.title.split(' ')[0]; // Use first word as topic key
      const existing = topicMap.get(key);
      topicMap.set(key, {
        count: (existing?.count || 0) + 1,
        platforms: new Set([...(existing?.platforms || []), item.platform]),
      });
    }
  }

  // Determine dominant sentiment
  let dominant: 'positive' | 'negative' | 'neutral' | 'mixed' | null = null;
  let maxCount = 0;
  for (const [sentiment, count] of Object.entries(sentimentCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = sentiment as any;
    }
  }

  // Build topics
  const topics = Array.from(topicMap.entries())
    .map(([name, data]) => ({
      name,
      frequency: data.count,
      platforms: Array.from(data.platforms),
      sentiment: undefined, // Basic analysis doesn't calculate per-topic sentiment
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  return {
    topics,
    key_insights: [
      {
        category: 'opportunity',
        title: 'Evidence Analysis Complete',
        description: `Analyzed ${items.length} evidence items across ${platformsCovered.join(', ')}. Use AI-powered analysis for deeper insights.`,
        supportingEvidence: items.length,
        platforms: platformsCovered,
      },
    ],
    sentiment_summary: {
      ...sentimentCounts,
      dominant,
    },
    emerging_patterns: [],
    recommended_angles: [],
    meta: {
      total_evidence_analyzed: items.length,
      platforms_covered: platformsCovered,
      analysis_timestamp: new Date().toISOString(),
    },
  };
}

export { generateAnalysisPrompt };
