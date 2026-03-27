from app.parsers.amazon.image_cleaner import AmazonImageCleaner


def test_image_cleaner_dedup_filter_and_main_image():
    cleaner = AmazonImageCleaner()
    raw_images = [
        "https://cdn.example.com/logo.png",
        "https://cdn.example.com/product._SL150_.jpg",
        "https://cdn.example.com/product_main.jpg",
        "https://cdn.example.com/product_main.jpg",
        "https://cdn.example.com/product_thumb.jpg",
    ]

    clean_images, main_image, reason = cleaner.clean(raw_images)

    assert clean_images == [
        "https://cdn.example.com/product_main.jpg",
        "https://cdn.example.com/product_thumb.jpg",
    ]
    assert main_image == "https://cdn.example.com/product_main.jpg"
    assert reason == "selected_first_high_confidence_clean_image"


def test_image_cleaner_fallback_to_first_raw_when_all_filtered():
    cleaner = AmazonImageCleaner()
    raw_images = [
        "https://cdn.example.com/logo-icon.png",
        "https://cdn.example.com/swatch-dot.png",
    ]

    clean_images, main_image, reason = cleaner.clean(raw_images)

    assert clean_images == []
    assert main_image == "https://cdn.example.com/logo-icon.png"
    assert reason == "fallback_first_raw_image_no_clean_match"

