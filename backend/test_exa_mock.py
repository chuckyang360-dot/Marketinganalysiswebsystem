#!/usr/bin/env python3
import asyncio
import sys
sys.path.insert(0, '/Users/johnstills/Documents/Vibe Marckrting/backend')

# Mock settings to bypass API key check
import app.config
app.config.settings.EXA_API_KEY = "mock_key"

from app.providers.exa_provider import ExaProvider

async def test_with_mock():
    # Test _create_mention_from_result directly with mock data
    provider = ExaProvider()

    # Mock result with Score in text
    result = {
        "id": "test123",
        "title": "Test Post - Reddit",
        "url": "https://www.reddit.com/r/electricvehicles/comments/1ji1h1x/test/",
        "publishedDate": "2025-03-23T15:12:51.000Z",
        "author": "Sunkeren",
        "text": "Have been driving Xiaomi SU7 Max.\n\nScore: 352\n\n215 Comments\n\nFull review...",
        "snippet": "Snippet"
    }

    mention = await provider._create_mention_from_result(result)

    print("=" * 60)
    print("=== TEST: Mock Exa Data with Score ===")
    print("=" * 60)
    print(f"Result text: {result['text'][:200]}")
    print(f"Result snippet: {result['snippet']}")
    print()
    print("=== MENTION FIELDS ===")
    print(f"mention.text: {mention.text[:200]}")
    print(f"mention.likes: {mention.likes}")
    print(f"mention.comments: {mention.comments}")
    print(f"mention.author: {mention.author}")

    # Now test through clean_mentions
    from app.services.reddit_agent import reddit_agent

    cleaned_mentions = reddit_agent._clean_mentions_text([mention])

    print()
    print("=== AFTER clean_mentions_text ===")
    cleaned = cleaned_mentions[0]
    print(f"Cleaned mention.text: {cleaned.text[:200]}")
    print(f"Cleaned mention.likes: {cleaned.likes}")
    print(f"Cleaned mention.comments: {cleaned.comments}")

if __name__ == "__main__":
    asyncio.run(test_with_mock())
