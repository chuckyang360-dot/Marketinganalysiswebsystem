import os
from typing import Any

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")
os.environ["SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER"] = "true"

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import User


BANNED_GLOBAL = [
    "待完善",
    "暂无",
    "Product-only reference asset",
    "产品资产",
    "符合目标市场与受众的角色设定",
    "单一地点场景：",
    "Main Character",
    "character_1",
    "image_prompt",
    "visual_prompt",
    "prompt",
    "technical",
    "技术细节",
]

BAD_CHARACTER_NAMES = {"Main Character", "character_1", "主角", "都市年轻人"}


def _contains_zh(text: str) -> bool:
    return any("\u4e00" <= ch <= "\u9fff" for ch in str(text or ""))


def _ensure_user() -> int:
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            user = User(
                username="sd_s3_quality",
                name="SD S3 Quality",
                email="sd_s3_quality@test.local",
                password_hash="x" * 64,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return int(user.id)
    finally:
        db.close()


def _project_and_assets() -> dict[str, Any]:
    client = TestClient(app)
    uid = _ensure_user()
    create_resp = client.post(
        "/api/short-drama/project",
        json={
            "user_id": uid,
            "project_name": "S3字段质量验收",
            "duration": "30s",
            "format": "single_ad",
            "style": "light_conflict",
            "target_market": "东南亚",
            "marketing_goal": "品牌种草",
            "target_audience": "都市年轻人",
            "creative_brief": "都市通勤、生活方式、自然种草",
        },
    )
    assert create_resp.status_code == 200, create_resp.text
    pid = create_resp.json()["project"]["id"]

    parse_resp = client.post(
        "/api/short-drama/product/parse",
        json={
            "project_id": pid,
            "input": {
                "product_name_raw": "通勤运动鞋",
                "product_category_raw": "运动鞋",
                "target_users_raw": "都市年轻人",
                "selling_points_raw": ["轻便透气", "日常通勤舒适", "生活方式穿搭"],
                "usage_scenarios_raw": ["通勤", "日常出行", "都市街头"],
                "extra_notes_raw": "商品品牌种草短剧，不要硬广。",
                "product_images": [],
            },
        },
    )
    assert parse_resp.status_code == 200, parse_resp.text

    story_resp = client.post("/api/short-drama/story/generate", json={"project_id": pid})
    assert story_resp.status_code == 200, story_resp.text

    s3_resp = client.post("/api/short-drama/assets/specs/generate", json={"project_id": pid})
    assert s3_resp.status_code == 200, s3_resp.text

    pipeline_resp = client.get(f"/api/short-drama/project/{pid}/pipeline")
    assert pipeline_resp.status_code == 200, pipeline_resp.text
    return pipeline_resp.json()["assets"]


def _visible_texts(asset: dict[str, Any]) -> list[str]:
    meta = asset.get("meta") if isinstance(asset.get("meta"), dict) else {}
    tf_raw = meta.get("type_fields") if isinstance(meta.get("type_fields"), dict) else {}
    tf = tf_raw if tf_raw else meta
    return [
        str(asset.get("name") or ""),
        str(asset.get("description") or ""),
        str(asset.get("structure_summary") or ""),
        str(tf.get("display_name") or ""),
        str(tf.get("display_description") or ""),
        str(tf.get("structure_summary") or ""),
        str(tf.get("plot_stage") or ""),
        str(tf.get("scene_form") or ""),
    ]


def _type_fields(asset: dict[str, Any]) -> dict[str, Any]:
    meta = asset.get("meta") if isinstance(asset.get("meta"), dict) else {}
    tf = meta.get("type_fields") if isinstance(meta.get("type_fields"), dict) else {}
    # Some legacy rows flatten fields in meta root; allow read fallback while still validating field quality.
    return tf if tf else meta


def _assert_no_banned_visible_text(asset: dict[str, Any]) -> None:
    joined = " | ".join(_visible_texts(asset))
    for bad in BANNED_GLOBAL:
        assert bad not in joined, f"发现禁用词 `{bad}` 出现在用户可见字段: {joined}"


def _assert_description_not_prompt_fallback(asset: dict[str, Any]) -> None:
    desc = str(asset.get("description") or "")
    assert desc.strip(), "description 不能为空"
    low = desc.lower()
    assert "image_prompt" not in low
    assert "visual_prompt" not in low
    assert "prompt" not in low
    assert "technical" not in low
    assert "技术细节" not in desc


def test_s3_asset_field_quality_e2e():
    assets = _project_and_assets()
    characters = assets.get("characters") or []
    scenes = assets.get("scenes") or []
    products = assets.get("products") or []

    assert characters, "S3 character 资产为空"
    assert scenes, "S3 scene 资产为空"
    assert products, "S3 product 资产为空"

    # 角色验收
    for c in characters:
        _assert_no_banned_visible_text(c)
        _assert_description_not_prompt_fallback(c)
        name = str(c.get("name") or "")
        assert name not in BAD_CHARACTER_NAMES, f"角色名仍是泛化名: {name}"
        assert name != "都市年轻人", f"角色名不能直接等于受众: {name}"
        assert _contains_zh(name), f"角色名应为中文语义名: {name}"
        desc = str(c.get("description") or "")
        assert _contains_zh(desc) and len(desc) >= 12, f"角色描述不够自然: {desc}"
        tf = _type_fields(c)
        for f in [
            "appearance",
            "costume",
            "base_expression",
            "story_usage",
            "structure_summary",
            "display_name",
            "display_description",
        ]:
            assert str(tf.get(f) or "").strip(), f"角色缺少 type_fields.{f}"

    # 场景验收
    time_tokens = ["清晨", "早高峰", "日间", "傍晚", "晨"]
    location_tokens = ["地铁", "站台", "街头", "公寓", "路口", "走廊", "城市"]
    usage_or_mood_tokens = ["通勤", "生活", "氛围", "日常", "都市"]
    too_plain_scene_names = {"地铁站", "街头", "公寓", "场景"}
    for s in scenes:
        _assert_no_banned_visible_text(s)
        _assert_description_not_prompt_fallback(s)
        name = str(s.get("name") or "")
        assert name not in too_plain_scene_names, f"场景名过于生硬: {name}"
        dimensions = 0
        if any(t in name for t in time_tokens):
            dimensions += 1
        if any(t in name for t in location_tokens):
            dimensions += 1
        if any(t in name for t in usage_or_mood_tokens):
            dimensions += 1
        assert dimensions >= 2, f"场景名维度不足（需>=2）: {name}"
        desc = str(s.get("description") or "")
        assert _contains_zh(desc) and len(desc) >= 16, f"场景描述不够自然: {desc}"
        scene_desc_signals = ["光", "氛围", "通勤", "日常", "空间", "场景"]
        assert any(x in desc for x in scene_desc_signals), f"场景描述缺少场景信息: {desc}"
        tf = _type_fields(s)
        for f in [
            "location",
            "lighting",
            "atmosphere",
            "props",
            "story_usage",
            "scene_form",
            "structure_summary",
            "display_name",
            "display_description",
        ]:
            value = tf.get(f)
            if isinstance(value, list):
                assert len(value) > 0, f"场景缺少 type_fields.{f}"
            else:
                assert str(value or "").strip(), f"场景缺少 type_fields.{f}"

    # 产品验收
    for p in products:
        _assert_no_banned_visible_text(p)
        _assert_description_not_prompt_fallback(p)
        name = str(p.get("name") or "")
        assert name not in {"产品资产", "Product-only reference asset"}, f"产品名仍是占位: {name}"
        desc = str(p.get("description") or "")
        assert _contains_zh(desc) and len(desc) >= 12, f"产品描述不够自然: {desc}"
        assert any(k in desc for k in ["材质", "颜色", "外观", "通勤", "质感", "细节"]), f"产品描述信息不足: {desc}"
        tf = _type_fields(p)
        for f in [
            "form",
            "material",
            "color",
            "visual_features",
            "story_usage",
            "structure_summary",
            "display_name",
            "display_description",
        ]:
            value = tf.get(f)
            if isinstance(value, list):
                assert len(value) > 0, f"产品缺少 type_fields.{f}"
            else:
                assert str(value or "").strip(), f"产品缺少 type_fields.{f}"
