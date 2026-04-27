import os

# Keep imports lightweight and avoid external provider key dependency.
os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from app.short_drama.services.product_context_builder import _normalize_source_trace_value


def test_source_trace_normalize_user_input_and_image_understanding():
    assert _normalize_source_trace_value("user_input|image_understanding") == "merged_inference"


def test_source_trace_normalize_image_understanding_and_merged_inference():
    assert _normalize_source_trace_value("image_understanding|merged_inference") == "merged_inference"


def test_source_trace_normalize_list_values():
    assert _normalize_source_trace_value(["user_input", "image_understanding"]) == "merged_inference"


def test_source_trace_normalize_user_input_only():
    assert _normalize_source_trace_value("user_input") == "user_input"


def test_source_trace_normalize_image_understanding_only():
    assert _normalize_source_trace_value("image_understanding") == "image_understanding"


def test_source_trace_normalize_unknown_source():
    assert _normalize_source_trace_value("unknown_source") == "merged_inference"


def test_source_trace_normalize_empty_and_none():
    assert _normalize_source_trace_value("") == "merged_inference"
    assert _normalize_source_trace_value(None) == "merged_inference"
