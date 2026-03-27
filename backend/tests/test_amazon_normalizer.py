from app.parsers.amazon.normalizer import AmazonNormalizer


def test_normalizer_outputs_parsed_product_shape():
    normalizer = AmazonNormalizer()
    raw_product = {
        "product_id": "B0ABCDEF12",
        "title": "Sample Product",
        "brand": "SampleBrand",
        "price": "$19.99",
        "rating": 4.5,
        "review_count": 123,
        "raw_images": ["https://cdn.example.com/a.jpg"],
        "description": "desc",
        "bullet_points": ["b1", "b2"],
        "raw_reviews": [{"content": "raw review"}],
        "seller": "sample seller",
        "raw_data": {"k": "v"},
        "original_price": "$29.99",
    }

    parsed = normalizer.normalize(
        url="https://www.amazon.com/dp/B0ABCDEF12",
        raw_product=raw_product,
        clean_images=["https://cdn.example.com/a.jpg"],
        main_image="https://cdn.example.com/a.jpg",
        image_selection_reason="selected_first_high_confidence_clean_image",
        clean_reviews=[{"content": "clean review"}],
    )

    assert parsed["platform"] == "amazon"
    assert parsed["url"] == "https://www.amazon.com/dp/B0ABCDEF12"
    assert parsed["product_id"] == "B0ABCDEF12"
    assert parsed["clean_images"] == ["https://cdn.example.com/a.jpg"]
    assert parsed["raw_images"] == ["https://cdn.example.com/a.jpg"]
    assert parsed["clean_reviews"] == [{"content": "clean review"}]
    assert parsed["raw_reviews"] == [{"content": "raw review"}]
    assert parsed["currency"] == "USD"
    assert parsed["image_selection_reason"] == "selected_first_high_confidence_clean_image"


def test_normalizer_currency_inference():
    normalizer = AmazonNormalizer()
    assert normalizer._infer_currency("€39.00") == "EUR"
    assert normalizer._infer_currency("£10") == "GBP"
    assert normalizer._infer_currency("￥99") == "CNY"
    assert normalizer._infer_currency("N/A") == ""

