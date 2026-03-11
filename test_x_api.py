import requests

BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAHTB8AEAAAAAoi3pZleL5%2FGVasZSGpQdKhaWxOQ%3DC9EfwWdD1L4sH38Q9CnJaxjZBXSpMpL0QwKMzHiMGnNp2w0rqK"

url = "https://api.x.com/2/tweets/search/recent"

params = {
    "query": "openai",
    "max_results": 10,
    "tweet.fields": "created_at,public_metrics"
}

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}"
}

response = requests.get(url, headers=headers, params=params)

print(response.status_code)
print(response.json())
