#!/usr/bin/env python3
"""
Test deduplication functionality.
"""

import json
import requests

# Test evidence with near-duplicates
test_evidence = [
    {
        "platform": "x",
        "author": "User1",
        "content": "Vibe Marketing's CEO Agent is amazing. It coordinates everything.",
        "url": "https://x.com/User1/status/1",
        "source": {"username": "User1", "follower_count": 1000},
        "metrics": {"likes": 500, "comments": 50, "reposts": 100},
        "analysis": {"sentiment": "positive"},
    },
    {
        "platform": "x",
        "author": "User2",
        "content": "Vibe Marketing's CEO Agent is amazing. It coordinates everything.",  # Exact duplicate
        "url": "https://x.com/User2/status/2",
        "source": {"username": "User2", "follower_count": 2000},
        "metrics": {"likes": 100, "comments": 10, "reposts": 20},  # Lower engagement
        "analysis": {"sentiment": "positive"},
    },
    {
        "platform": "x",
        "author": "User3",
        "content": "Vibe Marketing's CEO Agent is great. It coordinates our team.",  # Near-duplicate
        "url": "https://x.com/User3/status/3",
        "source": {"username": "User3", "follower_count": 5000},
        "metrics": {"likes": 1000, "comments": 100, "reposts": 200},  # Higher engagement
        "analysis": {"sentiment": "positive"},
    },
    {
        "platform": "reddit",
        "author": "Redditor1",
        "content": "The CEO Agent from Vibe Marketing coordinates everything perfectly.",
        "url": "https://reddit.com/r/test/comments/1",
        "source": {"username": "Redditor1", "author_karma": 5000},
        "metrics": {"upvotes": 300, "comments": 30},
        "analysis": {"sentiment": "positive"},
    },
    {
        "platform": "reddit",
        "author": "Redditor2",
        "content": "Totally different topic: The Reddit monitoring feature is good.",
        "url": "https://reddit.com/r/test/comments/2",
        "source": {"username": "Redditor2", "author_karma": 1000},
        "metrics": {"upvotes": 100, "comments": 10},
        "analysis": {"sentiment": "positive"},
    },
]

request_payload = {
    "evidence": test_evidence,
    "max_items": 10,
    "query": "CEO Agent feature"
}

print("=" * 80)
print("DEDUPLICATION TEST")
print("=" * 80)
print(f"\nTotal evidence items: {len(test_evidence)}")
print("\nEvidence content (truncated):")
for i, e in enumerate(test_evidence, 1):
    engagement = sum([
        e['metrics'].get('likes', 0),
        e['metrics'].get('comments', 0),
        e['metrics'].get('reposts', 0),
        e['metrics'].get('upvotes', 0)
    ])
    print(f"{i}. [{e['platform']}] {e['content'][:60]}... (engagement: {engagement})")

print("\n" + "=" * 80)
print("CALLING /api/analyze/analyze")
print("=" * 80)

response = requests.post(
    "http://localhost:8000/api/analyze/analyze",
    json=request_payload,
    headers={"Content-Type": "application/json"},
    timeout=30
)

if response.status_code == 200:
    result = response.json()

    meta = result.get("meta", {})
    print(f"\nTotal evidence analyzed: {meta.get('total_evidence_analyzed', 0)}")
    print(f"Original items: {len(test_evidence)}")
    print(f"Items after deduplication: {meta.get('total_evidence_analyzed', 0)}")

    if meta.get('total_evidence_analyzed', 0) < len(test_evidence):
        print(f"\n✓ Deduplication working: {len(test_evidence) - meta.get('total_evidence_analyzed', 0)} duplicate(s) removed")
    else:
        print(f"\n⚠ No duplicates removed (items may be below similarity threshold)")

    print("\n" + "=" * 80)
    print("EXPECTED BEHAVIOR")
    print("=" * 80)
    print("""
Expected deduplication:
1. User2's post is exact duplicate of User1's - should be removed
2. User3's post is near-duplicate (85%+ similar) - should be removed
3. Redditor1's post is related but different enough - should be kept
4. Redditor2's post is about different topic - should be kept

Expected result: 2 items analyzed (User1, Redditor1, Redditor2)
    """)

else:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
