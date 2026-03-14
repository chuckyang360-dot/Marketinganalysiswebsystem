# Analysis Agent

## Overview

The Analysis Agent transforms raw `EvidenceItem[]` into structured marketing intelligence insights using AI-powered analysis via Grok API.

## Architecture

```
EvidenceItem[] (raw)
       ↓
   Sort by engagement + limit to top N
       ↓
   Generate analysis prompt
       ↓
   Call Grok API (if API key provided)
       ↓
   Parse JSON response
       ↓
   AnalysisAgentOutput (structured insights)
```

## Input

```typescript
interface AnalysisAgentInput {
  evidence: EvidenceItem[];    // Raw evidence from normalizeEvidence
  maxItems?: number;          // Default: 10 (top N by engagement)
  query?: string;             // Original search query for context
}
```

## Output

```typescript
interface AnalysisAgentOutput {
  topics: Topic[];              // Dominant themes (3-5)
  key_insights: KeyInsight[];    // Critical insights (3-5)
  sentiment_summary: SentimentSummary;  // Sentiment distribution
  emerging_patterns: EmergingPattern[];  // Trends and patterns
  recommended_angles: RecommendedAngle[];  // Content strategies (3-5)
  meta: {
    total_evidence_analyzed: number;
    platforms_covered: string[];
    analysis_timestamp: string;
  };
}
```

## Analysis Categories

### 1. Topics
- Dominant themes from evidence
- Frequency per topic
- Platforms where topic appears
- Overall sentiment per topic

### 2. Key Insights
Categories:
- **Opportunity**: Underserved areas, content gaps, untapped audiences
- **Risk**: Negative patterns, PR risks, misinformation
- **Trend**: Emerging topics, rising concerns, viral content
- **Gap**: Missing content types, unaddressed questions

### 3. Sentiment Summary
- Count of positive, negative, neutral, mixed items
- Dominant sentiment identification
- Distribution across platforms

### 4. Emerging Patterns
- Recurring customer complaints
- Consistent misinformation or rumors
- Viral content characteristics
- Platform-specific behavior differences
- Confidence level (high/medium/low)
- Timeframe (recent/ongoing/seasonal)

### 5. Recommended Content Angles
- Clear angle (e.g., "Address misconception X")
- Rationale (why this angle works)
- Target audience
- Content type (post, video, story, article)
- Best suited platforms

## Grok Prompt Template

The prompt includes:

1. **Context**: Evidence summary with platform, author, content, engagement metrics, sentiment
2. **Tasks**: 5 clear analysis objectives
3. **Output Format**: Strict JSON structure with all fields

### Evidence Summary Format
```
[N] X - @author
Content: [truncated content]
Engagement: X likes, Y comments, Z views
Sentiment: positive/negative/neutral
Subreddit: r/subreddit (if Reddit)
Domain: example.com (if SEO)
```

### JSON Output Structure
```json
{
  "topics": [
    {
      "name": "topic name",
      "frequency": 5,
      "platforms": ["x", "reddit"],
      "sentiment": "positive"
    }
  ],
  "key_insights": [
    {
      "category": "opportunity",
      "title": "concise title",
      "description": "detailed explanation",
      "supportingEvidence": 3,
      "platforms": ["x", "reddit"]
    }
  ],
  "sentiment_summary": {
    "positive": 7,
    "negative": 2,
    "neutral": 3,
    "mixed": 1,
    "dominant": "positive"
  },
  "emerging_patterns": [
    {
      "pattern": "description",
      "evidence_count": 4,
      "confidence": "high",
      "platforms": ["reddit", "seo"],
      "timeframe": "recent"
    }
  ],
  "recommended_angles": [
    {
      "angle": "specific angle",
      "rationale": "why it works",
      "targetAudience": "who to target",
      "contentType": "video",
      "platforms": ["x", "youtube"]
    }
  ]
}
```

## Engagement Calculation

Used for sorting evidence items before analysis:

**Priority**: Use system-calculated `engagement_rate` if available
**Fallback**: Sum of interaction signals (likes + comments + reposts + shares + upvotes)

```typescript
function calculateEngagementScore(item: EvidenceItem): number {
  if (item.analysis?.engagement_rate !== undefined) {
    return item.analysis.engagement_rate;
  }

  const metrics = item.metrics ?? {};
  return (
    (metrics.likes ?? 0) +
    (metrics.comments ?? 0) +
    (metrics.reposts ?? 0) +
    (metrics.shares ?? 0) +
    (metrics.upvotes ?? 0)
  );
}
```

## Usage Example

```typescript
import { analyzeEvidence } from './agents/analysisAgent';
import { EvidenceItem } from './types/analysis';

const evidence: EvidenceItem[] = [/* ... */];

const result = await analyzeEvidence({
  evidence,
  maxItems: 10,
  query: 'product marketing strategy',
}, grokApiKey);

console.log(result.topics);
console.log(result.key_insights);
console.log(result.sentiment_summary);
```

## API Integration

### Grok API Endpoint
```
POST https://api.x.ai/v1/chat/completions
```

### Model
- `grok-beta`

### Headers
```
Content-Type: application/json
Authorization: Bearer {api_key}
```

### Fallback Behavior
If Grok API is unavailable or fails:
- Perform basic keyword/topic extraction
- Count sentiment distribution
- Return structured output with limited insights
- Log error for debugging

## Future Enhancements

- [ ] Cache analysis results for similar queries
- [ ] Incremental analysis (new items only)
- [ ] Platform-specific prompt variations
- [ ] Multi-turn conversation for refinement
- [ ] Export insights to markdown/PDF
