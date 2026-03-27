from app.parsers.amazon.review_cleaner import AmazonReviewCleaner


def test_review_cleaner_filters_and_deduplicates():
    cleaner = AmazonReviewCleaner()
    raw_reviews = [
        {"content": "   "},  # empty
        {"content": "short"},  # too short
        {"content": "Great quality and very useful!", "author": "A"},
        {"content": "Great   quality   and very useful!", "author": "B"},  # duplicate by normalized text
        {"content": "Works perfectly for daily use.", "author": "C"},
    ]

    clean_reviews = cleaner.clean(raw_reviews)

    assert len(clean_reviews) == 2
    assert clean_reviews[0]["content"] == "Great quality and very useful!"
    assert clean_reviews[1]["content"] == "Works perfectly for daily use."


def test_review_cleaner_limits_to_ten():
    cleaner = AmazonReviewCleaner()
    raw_reviews = [{"content": f"Review content number {i} is valid"} for i in range(20)]

    clean_reviews = cleaner.clean(raw_reviews)

    assert len(clean_reviews) == 10

