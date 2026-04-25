import os

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from app.short_drama.utils.xai_reference_image import classify_reference_source


def test_classify_reference_source_accepts_r2_url():
    os.environ["R2_PUBLIC_BASE_URL"] = "https://pub-example.r2.dev"
    kind, action = classify_reference_source(
        "https://pub-example.r2.dev/short-drama-assets/29/character_43_1777121250434.jpg"
    )
    assert kind == "r2_url"
    assert action == "download_bytes"


def test_classify_reference_source_accepts_static_path():
    kind, action = classify_reference_source("/static/short-drama-assets/29/character_43.jpg")
    assert kind == "static_path"
    assert action == "local_file"


def test_classify_reference_source_rejects_empty_url():
    kind, action = classify_reference_source("")
    assert kind == "empty"
    assert action == "invalid"
