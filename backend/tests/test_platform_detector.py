from app.classifiers.platform_detector import detect_platform


def test_detect_platform_amazon_url():
    assert detect_platform("https://www.amazon.com/dp/B0ABCDEF12") == "amazon"


def test_detect_platform_tiktok_shop_url():
    assert (
        detect_platform("https://www.tiktok.com/shop/product-name/pdp/1234567890")
        == "tiktok"
    )


def test_detect_platform_lazada_products_url():
    assert (
        detect_platform(
            "https://www.lazada.sg/products/sample-product-i1234567890.html"
        )
        == "lazada"
    )


def test_detect_platform_lazada_search_not_pdp():
    assert (
        detect_platform("https://www.lazada.sg/catalog/search?q=phone")
        == "unsupported"
    )


def test_detect_platform_unsupported_cases():
    assert detect_platform("https://www.example.com/product/1") == "unsupported"
    assert detect_platform("not-a-url") == "unsupported"
    assert detect_platform(None) == "unsupported"

