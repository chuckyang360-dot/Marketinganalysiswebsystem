"""
Test script for Data Layer v1 - Unified Mention Model
"""

import asyncio
from datetime import datetime
from app.models import Mention, Platform, Sentiment, InfluencerTier, MentionList
from app.providers import XProvider, x_provider


def test_mention_model():
    """Test Mention model creation and properties."""
    print("\n=== Testing Mention Model ===")

    # Test 1: Create a simple Mention
    mention = Mention(
        id="12345",
        platform=Platform.X,
        author="John Doe",
        author_username="johndoe",
        text="This is a great product!",
        url="https://x.com/johndoe/status/12345",
        timestamp=datetime.now(),
        likes=100,
        comments=10,
        shares=5,
        followers=5000
    )

    print(f"Created Mention: {mention.id}")
    print(f"Platform: {mention.platform}")
    print(f"Author: {mention.author} (@{mention.author_username})")
    print(f"Text: {mention.text}")
    print(f"Engagement: {mention.engagement_total} (likes:{mention.likes} + comments:{mention.comments} + shares:{mention.shares})")
    print(f"To dict: {mention.to_dict()['engagement_total']}")

    # Test 2: Create with all fields
    full_mention = Mention(
        id="67890",
        platform=Platform.X,
        author="Jane Smith",
        author_username="janesmith",
        author_display_name="Jane Smith",
        text="Amazing experience!",
        url="https://x.com/janesmith/status/67890",
        timestamp=datetime.now(),
        likes=500,
        comments=50,
        shares=25,
        followers=150000,
        sentiment=Sentiment.POSITIVE,
        sentiment_score=0.9,
        influencer_tier=InfluencerTier.MID,
        platform_metadata={
            "quote_count": 10,
            "conversation_id": "abc123"
        },
        raw={"original_api_data": "..."}
    )

    print(f"\nFull Mention created with sentiment: {full_mention.sentiment}")
    print(f"Influencer tier: {full_mention.influencer_tier}")

    # Test 3: MentionList
    mention_list = MentionList(mentions=[mention, full_mention])
    print(f"\nMentionList contains {mention_list.total_count} mentions")


def test_x_provider_to_mention():
    """Test X Provider _to_mention conversion."""
    print("\n=== Testing X Provider to_mention Conversion ===")

    # Mock X API tweet response
    mock_tweet = {
        "id": "1234567890",
        "text": "Just tried the new GlobalPulseAI and it's amazing! #AI",
        "created_at": "2026-03-12T10:30:00.000Z",
        "public_metrics": {
            "like_count": 150,
            "retweet_count": 30,
            "reply_count": 15,
            "quote_count": 5
        },
        "author_id": "author123"
    }

    # Mock user data
    mock_user = {
        "id": "author123",
        "username": "techreviewer",
        "name": "Tech Reviewer",
        "public_metrics": {
            "followers_count": 25000
        }
    }

    users_map = {"author123": mock_user}

    # Test conversion
    mention = x_provider._to_mention(mock_tweet, users_map)

    if mention:
        print(f"Converted Mention:")
        print(f"  ID: {mention.id}")
        print(f"  Platform: {mention.platform}")
        print(f"  Author: {mention.author} (@{mention.author_username})")
        print(f"  Text: {mention.text}")
        print(f"  URL: {mention.url}")
        print(f"  Timestamp: {mention.timestamp}")
        print(f"  Likes: {mention.likes}")
        print(f"  Comments: {mention.comments}")
        print(f"  Shares: {mention.shares}")
        print(f"  Followers: {mention.followers}")
        print(f"  Engagement Total: {mention.engagement_total}")
        print(f"  Sentiment: {mention.sentiment}")
        print(f"  Platform Metadata: {mention.platform_metadata}")
        print(f"  Has Raw Data: {len(mention.raw) > 0}")
    else:
        print("Failed to convert mention")


async def test_x_provider_search():
    """Test X Provider search_mentions (requires API key)."""
    print("\n=== Testing X Provider search_mentions ===")

    try:
        # This will fail if X_BEARER_TOKEN is not set
        mentions = await x_provider.search_mentions("AI", limit=5)
        print(f"Found {len(mentions)} mentions from X API")
        for i, mention in enumerate(mentions[:3]):
            print(f"\nMention {i+1}:")
            print(f"  Author: @{mention.author_username}")
            print(f"  Text: {mention.text[:80]}...")
            print(f"  Engagement: {mention.engagement_total}")
    except ValueError as e:
        print(f"Skipping API test (expected): {e}")
    except Exception as e:
        print(f"Error: {e}")


def test_enums():
    """Test all enums."""
    print("\n=== Testing Enums ===")

    print(f"Platform values: {[p.value for p in Platform]}")
    print(f"Sentiment values: {[s.value for s in Sentiment]}")
    print(f"InfluencerTier values: {[t.value for t in InfluencerTier]}")


if __name__ == "__main__":
    print("Data Layer v1 Test Suite")
    print("=" * 50)

    test_enums()
    test_mention_model()
    test_x_provider_to_mention()

    # Async test
    asyncio.run(test_x_provider_search())

    print("\n" + "=" * 50)
    print("All tests completed!")
