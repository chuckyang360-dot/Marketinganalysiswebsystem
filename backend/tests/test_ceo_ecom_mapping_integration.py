import pytest

from app.services.ceo_agent import CEOAgent


@pytest.mark.asyncio
async def test_ceo_mapping_from_parsed_product_to_parse_data(monkeypatch):
    ceo = CEOAgent()
    parsed_product = {
        "platform": "amazon",
        "url": "https://www.amazon.com/dp/B0ABCDEF12",
        "title": "Mapped Product",
        "price": "$19.99",
        "original_price": "$29.99",
        "rating": 4.4,
        "review_count": 88,
        "main_image": "https://cdn.example.com/main.jpg",
        "clean_images": [
            "https://cdn.example.com/main.jpg",
            "https://cdn.example.com/2.jpg",
        ],
        "clean_reviews": [
            {"content": "review a"},
            {"content": "review b"},
        ],
        "brand": "BrandX",
        "bullet_points": ["p1"],
        "description": "desc",
    }

    async def fake_parse_product_url(url: str):
        return parsed_product

    async def fake_grok_analysis(prompt: str):
        return "mock_ceo_analysis"

    monkeypatch.setattr(ceo, "_parse_product_url", fake_parse_product_url)
    monkeypatch.setattr(ceo, "_call_grok_analysis", fake_grok_analysis)

    result = await ceo._call_ecom_parser("https://www.amazon.com/dp/B0ABCDEF12")
    parse_data = result["parse_data"]

    assert result["type"] == "ecom_product_analysis"
    assert parse_data["images"] == parsed_product["clean_images"]
    assert parse_data["reviews"] == parsed_product["clean_reviews"]

    # frontend depended core fields still present
    assert parse_data["main_image"] == parsed_product["main_image"]
    assert parse_data["title"] == parsed_product["title"]
    assert parse_data["price"] == parsed_product["price"]
    assert parse_data["rating"] == parsed_product["rating"]
    assert parse_data["review_count"] == parsed_product["review_count"]
    assert parse_data["brand"] == parsed_product["brand"]
    assert parse_data["bullet_points"] == parsed_product["bullet_points"]
    assert parse_data["description"] == parsed_product["description"]
    assert parse_data["url"] == parsed_product["url"]
    assert parse_data["platform"] == "amazon"


@pytest.mark.asyncio
async def test_ceo_mapping_parse_data_keys_not_missing(monkeypatch):
    ceo = CEOAgent()
    parsed_product = {
        "platform": "amazon",
        "url": "https://www.amazon.com/dp/B0ABCDE999",
        "title": "Minimal Product",
        "price": "N/A",
        "rating": 0.0,
        "review_count": 0,
        "main_image": "",
        "clean_images": [],
        "clean_reviews": [],
        "brand": "N/A",
        "bullet_points": [],
        "description": "",
    }

    async def fake_parse_product_url(url: str):
        return parsed_product

    async def fake_grok_analysis(prompt: str):
        return "ok"

    monkeypatch.setattr(ceo, "_parse_product_url", fake_parse_product_url)
    monkeypatch.setattr(ceo, "_call_grok_analysis", fake_grok_analysis)

    result = await ceo._call_ecom_parser(parsed_product["url"])
    parse_data = result["parse_data"]

    expected_keys = {
        "title",
        "price",
        "original_price",
        "rating",
        "review_count",
        "reviews",
        "main_image",
        "images",
        "brand",
        "bullet_points",
        "description",
        "url",
        "platform",
    }
    assert expected_keys.issubset(set(parse_data.keys()))

