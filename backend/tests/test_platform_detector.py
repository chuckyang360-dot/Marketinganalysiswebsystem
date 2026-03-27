from app.classifiers.platform_detector import detect_platform


def test_detect_platform_amazon_url():
    assert detect_platform("https://www.amazon.com/dp/B0ABCDEF12") == "amazon"


def test_detect_platform_unsupported_cases():
    assert detect_platform("https://www.example.com/product/1") == "unsupported"
    assert detect_platform("not-a-url") == "unsupported"
    assert detect_platform(None) == "unsupported"

