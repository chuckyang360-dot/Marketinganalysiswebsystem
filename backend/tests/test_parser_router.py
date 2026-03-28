import pytest

from app.parsers.parser_router import ParserRouter, UnsupportedPlatformError


@pytest.mark.asyncio
async def test_parser_router_routes_amazon(monkeypatch):
    router = ParserRouter()

    async def fake_parse(url: str):
        return {"platform": "amazon", "url": url, "title": "mock"}

    monkeypatch.setattr(router.amazon_parser, "parse", fake_parse)

    result = await router.parse("amazon", "https://www.amazon.com/dp/B0ABCDEF12")
    assert result["platform"] == "amazon"
    assert result["title"] == "mock"


@pytest.mark.asyncio
async def test_parser_router_raises_for_unsupported():
    router = ParserRouter()
    with pytest.raises(UnsupportedPlatformError):
        await router.parse("unsupported", "https://www.example.com/p/1")


@pytest.mark.asyncio
async def test_parser_router_routes_tiktok(monkeypatch):
    router = ParserRouter()

    async def fake_parse(url: str):
        return {"platform": "tiktok", "url": url, "title": "mock"}

    monkeypatch.setattr(router.tiktok_parser, "parse", fake_parse)

    result = await router.parse(
        "tiktok",
        "https://www.tiktok.com/shop/x/pdp/y",
    )
    assert result["platform"] == "tiktok"
    assert result["title"] == "mock"


@pytest.mark.asyncio
async def test_parser_router_routes_lazada(monkeypatch):
    router = ParserRouter()

    async def fake_parse(url: str):
        return {"platform": "lazada", "url": url, "title": "mock"}

    monkeypatch.setattr(router.lazada_parser, "parse", fake_parse)

    result = await router.parse(
        "lazada",
        "https://www.lazada.sg/products/x-i1.html",
    )
    assert result["platform"] == "lazada"
    assert result["title"] == "mock"

