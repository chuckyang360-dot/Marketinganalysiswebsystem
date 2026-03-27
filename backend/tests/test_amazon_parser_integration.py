import pytest

from app.parsers.amazon_parser import AmazonParser


@pytest.mark.asyncio
async def test_amazon_parser_pipeline_end_to_end_with_mock_adapter(monkeypatch):
    parser = AmazonParser()

    async def fake_fetch_raw_product(url: str):
        return {
            "platform": "amazon",
            "url": url,
            "product_id": "B0ABCDEF12",
            "title": "Test Product",
            "brand": "TestBrand",
            "price": "$29.99",
            "rating": 4.6,
            "review_count": 321,
            "description": "A test description",
            "bullet_points": ["point 1", "point 2"],
            "raw_images": [
                "https://cdn.example.com/logo.png",
                "https://cdn.example.com/product_main.jpg",
                "https://cdn.example.com/product_main.jpg",
                "https://cdn.example.com/product_thumb.jpg",
            ],
            "raw_reviews": [
                {"content": ""},
                {"content": "short"},
                {"content": "Great quality and useful product.", "author": "A"},
                {"content": "Great   quality and useful product.", "author": "B"},
                {"content": "Works very well in daily use.", "author": "C"},
            ],
            "seller": "Sample Seller",
            "raw_data": {"mock": True},
            "original_price": "$39.99",
        }

    monkeypatch.setattr(parser.adapter, "fetch_raw_product", fake_fetch_raw_product)

    parsed = await parser.parse("https://www.amazon.com/dp/B0ABCDEF12")

    # clean_images / main_image / reason
    assert parsed["clean_images"] == [
        "https://cdn.example.com/product_main.jpg",
        "https://cdn.example.com/product_thumb.jpg",
    ]
    assert parsed["main_image"] == "https://cdn.example.com/product_main.jpg"
    assert parsed.get("image_selection_reason")

    # clean_reviews
    assert len(parsed["clean_reviews"]) == 2
    assert parsed["clean_reviews"][0]["content"] == "Great quality and useful product."
    assert parsed["clean_reviews"][1]["content"] == "Works very well in daily use."

    # ParsedProduct key fields
    required_keys = {
        "platform",
        "url",
        "product_id",
        "title",
        "brand",
        "price",
        "currency",
        "rating",
        "review_count",
        "main_image",
        "clean_images",
        "raw_images",
        "image_selection_reason",
        "description",
        "bullet_points",
        "clean_reviews",
        "raw_reviews",
        "seller",
        "raw_data",
    }
    assert required_keys.issubset(set(parsed.keys()))


@pytest.mark.asyncio
async def test_amazon_parser_pipeline_with_missing_optional_fields(monkeypatch):
    parser = AmazonParser()

    async def fake_fetch_raw_product(url: str):
        return {
            "platform": "amazon",
            "url": url,
            "product_id": "",
            "title": "No Optional Product",
            "price": "N/A",
            "raw_images": [],
            "raw_reviews": [],
            # intentionally missing: brand/description/bullet_points/seller/raw_data
        }

    monkeypatch.setattr(parser.adapter, "fetch_raw_product", fake_fetch_raw_product)

    parsed = await parser.parse("https://www.amazon.com/dp/B000000000")

    assert parsed["platform"] == "amazon"
    assert parsed["title"] == "No Optional Product"
    assert parsed["brand"] == "N/A"
    assert parsed["description"] == ""
    assert parsed["bullet_points"] == []
    assert parsed["seller"] == ""
    assert parsed["raw_data"] == {}
    assert parsed["clean_images"] == []
    assert parsed["clean_reviews"] == []

