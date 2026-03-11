import asyncio
from backend.app.providers.x_provider import XProvider

async def main():
    provider = XProvider()

    data = await provider.fetch_recent_tweets(
        query="openai",
        max_results=10
    )

    print("返回结果：")
    print(data["data"][0]["text"])

asyncio.run(main())
