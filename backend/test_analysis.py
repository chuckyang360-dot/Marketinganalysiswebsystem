#!/usr/bin/env python3
"""
Test script to validate analysis quality with realistic evidence samples.
"""

import asyncio
import json
from datetime import datetime

# Test evidence samples - realistic X/Reddit/SEO data
test_evidence = [
    # X Evidence
    {
        "platform": "x",
        "author": "TechGuru23",
        "content": "Just tried the new AI writing assistant from Vibe Marketing. Actually impressed with how it understands brand voice. The content suggestions are way better than ChatGPT for marketing copy.",
        "url": "https://x.com/TechGuru23/status/1234567890",
        "title": None,
        "source": {
            "username": "TechGuru23",
            "display_name": "Tech Guru",
            "follower_count": 45000,
            "verified": True
        },
        "metrics": {
            "likes": 2340,
            "comments": 156,
            "reposts": 423,
            "views": 89000
        },
        "analysis": {
            "sentiment": "positive",
            "engagement_rate": 3.2
        },
        "metadata": {
            "published_at": "2026-03-14T10:30:00Z",
            "content_type": "tweet"
        }
    },
    {
        "platform": "x",
        "author": "MarketingPro",
        "content": "Vibe Marketing's CEO Agent feature is a game-changer for small teams. No more juggling multiple tools - one dashboard that actually coordinates everything.",
        "url": "https://x.com/MarketingPro/status/1234567891",
        "title": None,
        "source": {
            "username": "MarketingPro",
            "display_name": "Sarah Chen - Marketing",
            "follower_count": 120000,
            "verified": True
        },
        "metrics": {
            "likes": 5670,
            "comments": 412,
            "reposts": 890,
            "views": 245000
        },
        "analysis": {
            "sentiment": "positive",
            "engagement_rate": 2.8
        },
        "metadata": {
            "published_at": "2026-03-14T09:15:00Z",
            "content_type": "tweet"
        }
    },
    {
        "platform": "x",
        "author": "DisappointedUser",
        "content": "Tried Vibe Marketing for a week. The Reddit monitoring is decent but the SEO analyzer keeps crashing. Support ticket has been open for 3 days now.",
        "url": "https://x.com/DisappointedUser/status/1234567892",
        "title": None,
        "source": {
            "username": "DisappointedUser",
            "display_name": "John Smith",
            "follower_count": 3200,
            "verified": False
        },
        "metrics": {
            "likes": 89,
            "comments": 234,
            "reposts": 45,
            "views": 12000
        },
        "analysis": {
            "sentiment": "negative",
            "engagement_rate": 1.95
        },
        "metadata": {
            "published_at": "2026-03-14T08:45:00Z",
            "content_type": "tweet"
        }
    },
    {
        "platform": "x",
        "author": "StartupFounder",
        "content": "Anyone using Vibe Marketing for their startup? The pricing is steep for early stage but the Reddit insights are gold. Need cheaper tier.",
        "url": "https://x.com/StartupFounder/status/1234567893",
        "title": None,
        "source": {
            "username": "StartupFounder",
            "display_name": "Alex Johnson",
            "follower_count": 8900,
            "verified": False
        },
        "metrics": {
            "likes": 456,
            "comments": 67,
            "reposts": 89,
            "views": 23000
        },
        "analysis": {
            "sentiment": "mixed",
            "engagement_rate": 2.6
        },
        "metadata": {
            "published_at": "2026-03-14T07:30:00Z",
            "content_type": "tweet"
        }
    },

    # Reddit Evidence
    {
        "platform": "reddit",
        "author": "digital_marketer_2024",
        "content": "Been using Vibe Marketing for my agency for 2 months now. The Reddit monitoring is surprisingly good - catches brand mentions across multiple subreddits. However, the sentiment analysis seems to misinterpret sarcasm about 30% of the time.",
        "url": "https://reddit.com/r/marketing/comments/abc123",
        "title": "Review: Vibe Marketing after 2 months",
        "source": {
            "username": "digital_marketer_2024",
            "author_karma": 12000
        },
        "metrics": {
            "upvotes": 234,
            "downvotes": 12,
            "score": 222,
            "comments": 89
        },
        "analysis": {
            "sentiment": "mixed"
        },
        "metadata": {
            "subreddit": "r/marketing",
            "published_at": "2026-03-14T06:00:00Z",
            "content_type": "post"
        }
    },
    {
        "platform": "reddit",
        "author": "SEO_specialist",
        "content": "The SEO analyzer is missing a key feature: keyword gap analysis by search intent. I can see what keywords competitors rank for, but not whether those are informational, transactional, or navigational queries. This is crucial for content strategy.",
        "url": "https://reddit.com/r/SEO/comments/abc124",
        "title": "Feature request: Intent-based keyword analysis",
        "source": {
            "username": "SEO_specialist",
            "author_karma": 5600
        },
        "metrics": {
            "upvotes": 156,
            "downvotes": 3,
            "score": 153,
            "comments": 45
        },
        "analysis": {
            "sentiment": "neutral"
        },
        "metadata": {
            "subreddit": "r/SEO",
            "published_at": "2026-03-14T05:30:00Z",
            "content_type": "post"
        }
    },
    {
        "platform": "reddit",
        "author": "brand_manager",
        "content": "Vibe Marketing's CEO Agent saved us during a PR crisis last week. We detected a negative trend on Reddit and the agent coordinated our response across all channels. The recommended content angles were spot-on.",
        "url": "https://reddit.com/r/marketing/comments/abc125",
        "title": "How the CEO Agent handled our crisis",
        "source": {
            "username": "brand_manager",
            "author_karma": 2800
        },
        "metrics": {
            "upvotes": 445,
            "downvotes": 8,
            "score": 437,
            "comments": 112
        },
        "analysis": {
            "sentiment": "positive"
        },
        "metadata": {
            "subreddit": "r/marketing",
            "published_at": "2026-03-14T04:15:00Z",
            "content_type": "post"
        }
    },
    {
        "platform": "reddit",
        "author": "startup_bro",
        "content": "$499/month is way too expensive for a 3-person startup. The features are great but pricing needs a solo founder tier around $99/mo. Currently using Buffer + Hootsuite instead.",
        "url": "https://reddit.com/r/startups/comments/abc126",
        "title": "Feedback on pricing model",
        "source": {
            "username": "startup_bro",
            "author_karma": 1500
        },
        "metrics": {
            "upvotes": 678,
            "downvotes": 45,
            "score": 633,
            "comments": 234
        },
        "analysis": {
            "sentiment": "negative"
        },
        "metadata": {
            "subreddit": "r/startups",
            "published_at": "2026-03-14T03:00:00Z",
            "content_type": "post"
        }
    },

    # SEO Evidence
    {
        "platform": "seo",
        "author": "Ahrefs Blog",
        "content": "Vibe Marketing has emerged as a strong competitor in the marketing intelligence space, particularly with its multi-agent approach to social listening. However, users report that the SEO module lacks the depth of established tools like SEMrush.",
        "url": "https://ahrefs.com/blog/marketing-tools-2026",
        "title": "Top Marketing Intelligence Tools of 2026",
        "source": {
            "domain": "ahrefs.com",
            "domain_authority": 92
        },
        "metrics": {
            "traffic": 2500000,
            "backlinks": 15600
        },
        "analysis": {
            "sentiment": "neutral",
            "authority_score": 92.0
        },
        "metadata": {
            "domain": "ahrefs.com",
            "published_at": "2026-03-13T15:00:00Z",
            "content_type": "article"
        }
    },
    {
        "platform": "seo",
        "author": "Moz",
        "content": "The CEO Agent feature in Vibe Marketing represents a shift toward AI orchestration in marketing. Rather than replacing human marketers, it automates coordination and frees up strategic thinking. This is the direction the industry is heading.",
        "url": "https://moz.com/blog/ai-orchestration-marketing",
        "title": "AI Orchestration: The Future of Marketing",
        "source": {
            "domain": "moz.com",
            "domain_authority": 95
        },
        "metrics": {
            "traffic": 1800000,
            "backlinks": 12400
        },
        "analysis": {
            "sentiment": "positive",
            "authority_score": 95.0
        },
        "metadata": {
            "domain": "moz.com",
            "published_at": "2026-03-13T12:00:00Z",
            "content_type": "article"
        }
    },
    {
        "platform": "seo",
        "author": "Search Engine Journal",
        "content": "Enterprise users report that Vibe Marketing's Reddit monitoring is excellent for crisis detection, but the SEO keyword research lacks SERP analysis and ranking history. For full SEO functionality, most users still pair it with a dedicated SEO tool.",
        "url": "https://searchenginejournal.com/review/vibe-marketing",
        "title": "Vibe Marketing Review: Enterprise Edition",
        "source": {
            "domain": "searchenginejournal.com",
            "domain_authority": 93
        },
        "metrics": {
            "traffic": 1200000,
            "backlinks": 8900
        },
        "analysis": {
            "sentiment": "mixed",
            "authority_score": 93.0
        },
        "metadata": {
            "domain": "searchenginejournal.com",
            "published_at": "2026-03-13T10:00:00Z",
            "content_type": "article"
        }
    },
    # Duplicate-like content for testing deduplication
    {
        "platform": "x",
        "author": "MarketingFan",
        "content": "Just tried Vibe Marketing's CEO Agent feature - it actually coordinates the whole marketing team. Much better than using separate tools for everything.",
        "url": "https://x.com/MarketingFan/status/1234567999",
        "title": None,
        "source": {
            "username": "MarketingFan",
            "display_name": "Marketing Fan",
            "follower_count": 2100,
            "verified": False
        },
        "metrics": {
            "likes": 234,
            "comments": 45,
            "reposts": 67,
            "views": 8900
        },
        "analysis": {
            "sentiment": "positive",
            "engagement_rate": 3.9
        },
        "metadata": {
            "published_at": "2026-03-14T09:30:00Z",
            "content_type": "tweet"
        }
    }
]

request_payload = {
    "evidence": test_evidence,
    "max_items": 10,
    "query": "Vibe Marketing platform analysis"
}

print("=" * 80)
print("ANALYSIS QUALITY VALIDATION TEST")
print("=" * 80)
print(f"\nTimestamp: {datetime.now().isoformat()}")
print(f"Total evidence items: {len(test_evidence)}")
print(f"Max items for analysis: {request_payload['max_items']}")
print(f"\nQuery: {request_payload['query']}")

print("\n" + "=" * 80)
print("REQUEST PAYLOAD (truncated for display)")
print("=" * 80)
print(json.dumps({
    "evidence": f"[{len(test_evidence)} items]",
    "max_items": request_payload["max_items"],
    "query": request_payload["query"]
}, indent=2))

print("\n" + "=" * 80)
print("CALLING /api/analyze ENDPOINT")
print("=" * 80)

import httpx

async def call_analyze_api():
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://localhost:8000/api/analyze/analyze",
                json=request_payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code != 200:
                print(f"\n❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                return None

            result = response.json()
            return result

    except Exception as e:
        print(f"\n❌ Error calling API: {e}")
        import traceback
        traceback.print_exc()
        return None

result = asyncio.run(call_analyze_api())

if result:
    print("\n" + "=" * 80)
    print("ANALYSIS OUTPUT")
    print("=" * 80)

    print("\n--- TOPICS ---")
    for i, topic in enumerate(result.get("topics", []), 1):
        print(f"\n{i}. {topic.get('name', 'N/A')}")
        print(f"   Frequency: {topic.get('frequency', 0)}")
        print(f"   Platforms: {', '.join(topic.get('platforms', []))}")
        print(f"   Sentiment: {topic.get('sentiment', 'N/A')}")

    print("\n--- KEY INSIGHTS ---")
    for i, insight in enumerate(result.get("key_insights", []), 1):
        print(f"\n{i}. [{insight.get('category', 'N/A').upper()}] {insight.get('title', 'N/A')}")
        print(f"   Description: {insight.get('description', 'N/A')[:200]}...")
        print(f"   Supporting Evidence: {insight.get('supporting_evidence', 0)}")
        print(f"   Platforms: {', '.join(insight.get('platforms', []))}")

    print("\n--- SENTIMENT SUMMARY ---")
    sentiment = result.get("sentiment_summary", {})
    print(f"Positive: {sentiment.get('positive', 0)}")
    print(f"Negative: {sentiment.get('negative', 0)}")
    print(f"Neutral: {sentiment.get('neutral', 0)}")
    print(f"Mixed: {sentiment.get('mixed', 0)}")
    print(f"Dominant: {sentiment.get('dominant', 'N/A')}")

    print("\n--- EMERGING PATTERNS ---")
    for i, pattern in enumerate(result.get("emerging_patterns", []), 1):
        print(f"\n{i}. {pattern.get('pattern', 'N/A')}")
        print(f"   Evidence Count: {pattern.get('evidence_count', 0)}")
        print(f"   Confidence: {pattern.get('confidence', 'N/A')}")
        print(f"   Platforms: {', '.join(pattern.get('platforms', []))}")
        print(f"   Timeframe: {pattern.get('timeframe', 'N/A')}")

    print("\n--- RECOMMENDED ANGLES ---")
    for i, angle in enumerate(result.get("recommended_angles", []), 1):
        print(f"\n{i}. {angle.get('angle', 'N/A')}")
        print(f"   Rationale: {angle.get('rationale', 'N/A')[:200]}...")
        print(f"   Target Audience: {angle.get('target_audience', 'N/A')}")
        print(f"   Content Type: {angle.get('content_type', 'N/A')}")
        print(f"   Platforms: {', '.join(angle.get('platforms', []))}")

    print("\n--- META ---")
    meta = result.get("meta", {})
    print(f"Total Evidence Analyzed: {meta.get('total_evidence_analyzed', 0)}")
    print(f"Platforms Covered: {', '.join(meta.get('platforms_covered', []))}")
    print(f"Analysis Timestamp: {meta.get('analysis_timestamp', 'N/A')}")

    print("\n" + "=" * 80)
    print("QUALITY EVALUATION")
    print("=" * 80)

    # Evaluate topics
    topics = result.get("topics", [])
    print(f"\n✓ Topics Found: {len(topics)}")
    if len(topics) > 0:
        print("  - Topics are grouped by common themes")
        print("  - Each topic has frequency and platform data")
    else:
        print("  - ⚠ No topics identified - analysis may be using fallback")

    # Evaluate key insights
    insights = result.get("key_insights", [])
    print(f"\n✓ Key Insights: {len(insights)}")
    if len(insights) > 0:
        categories = set(i.get('category') for i in insights)
        print(f"  - Categories found: {', '.join(categories)}")
        has_specific = any(len(i.get('description', '')) > 50 for i in insights)
        print(f"  - Insights are specific: {'Yes' if has_specific else 'No - may be generic'}")
    else:
        print("  - ⚠ No insights - likely using fallback analysis")

    # Evaluate recommended angles
    angles = result.get("recommended_angles", [])
    print(f"\n✓ Recommended Angles: {len(angles)}")
    if len(angles) > 0:
        actionable = all(len(a.get('rationale', '')) > 20 for a in angles)
        print(f"  - Actionable: {'Yes' if actionable else 'No - too generic'}")
        has_targets = any(a.get('target_audience') for a in angles)
        print(f"  - Has target audiences: {'Yes' if has_targets else 'No'}")
    else:
        print("  - ⚠ No recommended angles - fallback analysis")

    # Evaluate sentiment
    sentiment_sum = result.get("sentiment_summary", {})
    total_sentiment = sentiment_sum.get('positive', 0) + sentiment_sum.get('negative', 0) + sentiment_sum.get('neutral', 0) + sentiment_sum.get('mixed', 0)
    print(f"\n✓ Sentiment Summary")
    print(f"  - Total sentiment counts: {total_sentiment}")
    print(f"  - Expected from evidence: 4 positive, 2 negative, 2 neutral, 2 mixed")
    actual_pos = sentiment_sum.get('positive', 0)
    expected_pos = 4
    print(f"  - Positive accuracy: {actual_pos}/{expected_pos} ({'✓' if actual_pos == expected_pos else '⚠'})")

    # Evaluate patterns
    patterns = result.get("emerging_patterns", [])
    print(f"\n✓ Emerging Patterns: {len(patterns)}")
    if len(patterns) > 0:
        has_evidence = all(p.get('evidence_count', 0) > 0 for p in patterns)
        print(f"  - Supported by evidence: {'Yes' if has_evidence else 'No'}")
    else:
        print("  - ⚠ No patterns - fallback analysis")

    print("\n" + "=" * 80)
    print("SAMPLE PAYLOADED FOR REVIEW")
    print("=" * 80)

    # Save sample request and response for review
    with open("/Users/johnstills/Documents/Vibe Marckrting/backend/test_payloads.json", "w") as f:
        json.dump({
            "request": request_payload,
            "response": result
        }, f, indent=2)

    print("\nSample payloads saved to: backend/test_payloads.json")

    print("\n" + "=" * 80)
    print("NEXT IMPROVEMENTS NEEDED")
    print("=" * 80)

    # Check if this is fallback analysis
    is_fallback = (
        len(result.get("topics", [])) == 0 and
        len(result.get("emerging_patterns", [])) == 0 and
        len(result.get("recommended_angles", [])) == 0 and
        any("fallback" in i.get("description", "").lower() or "ai-powered" in i.get("description", "").lower()
            for i in result.get("key_insights", []))
    )

    if is_fallback:
        print("\n⚠ FALLBACK ANALYSIS DETECTED")
        print("Grok API is not available (XAI_API_KEY not configured)")
        print("Output is limited to basic sentiment counting")
    else:
        print("\n✓ FULL AI ANALYSIS (Grok)")

    print("\n1. Add deduplication before top-N selection")
    print("2. Make fallback output clearly indicate limitations")
    print("3. Improve topic extraction (may need better prompt)")
    print("4. Consider adding relevance scoring based on query")
    print("5. Add confidence metrics to all insights")

else:
    print("\n❌ No response received from API")
    print("\nCheck that:")
    print("1. Backend server is running: uvicorn app.main:app --reload")
    print("2. XAI_API_KEY is configured in environment")
    print("3. Network connectivity to Grok API")
