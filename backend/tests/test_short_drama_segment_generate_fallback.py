import os
from unittest.mock import patch

os.environ["SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER"] = "true"
os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import User
from app.short_drama.exceptions import ShortDramaInvalidModelOutputError
from app.short_drama.models import SegmentScriptRecord, StoryBlueprintRecord


def _ensure_user_id() -> int:
    db = SessionLocal()
    try:
        u = db.query(User).first()
        if not u:
            u = User(
                username="sd_s4_fallback",
                name="SD S4 Fallback",
                email="sd_s4_fallback@test.local",
                password_hash="x" * 64,
                is_active=True,
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        return int(u.id)
    finally:
        db.close()


def _bootstrap_project_with_specs(client: TestClient) -> int:
    uid = _ensure_user_id()
    project = client.post("/api/short-drama/project", json={"user_id": uid, "project_name": "s4-fallback-test"})
    assert project.status_code == 200, project.text
    pid = project.json()["project"]["id"]
    assert client.post(
        "/api/short-drama/product/parse",
        json={"project_id": pid, "input": {"title": "测试品", "image_urls": []}},
    ).status_code == 200
    assert client.post("/api/short-drama/story/generate", json={"project_id": pid}).status_code == 200
    assert client.post("/api/short-drama/assets/specs/generate", json={"project_id": pid}).status_code == 200
    return int(pid)


def _inject_fallback_shot_plan(project_id: int) -> None:
    db = SessionLocal()
    try:
        row = (
            db.query(StoryBlueprintRecord)
            .filter(StoryBlueprintRecord.project_id == project_id)
            .order_by(StoryBlueprintRecord.id.desc())
            .first()
        )
        assert row is not None
        blueprint = dict(row.blueprint_json or {})
        blueprint["shot_plan"] = {
            "segments": [
                {
                    "name": "Hook",
                    "duration": 8,
                    "goal": "抓注意力",
                    "shots": [
                        {
                            "id": "seg_1_shot_1",
                            "duration": 4,
                            "action": "主角在通勤路上快速翻找口袋",
                            "character_refs": ["主角"],
                            "scene_ref": "街道",
                            "product_refs": ["产品X"],
                            "dialogue": "糟了，找不到了。",
                        },
                        {
                            "id": "seg_1_shot_2",
                            "duration": 4,
                            "action": "主角掏出产品并稳定放入口袋",
                            "character_refs": ["主角"],
                            "scene_ref": "街道",
                            "product_refs": ["产品X"],
                            "dialogue": "这样就顺手多了。",
                        },
                    ],
                }
            ]
        }
        row.blueprint_json = blueprint
        db.add(row)
        db.commit()
    finally:
        db.close()


def test_segment_generate_fallback_on_invalid_structured_output():
    client = TestClient(app)
    pid = _bootstrap_project_with_specs(client)
    _inject_fallback_shot_plan(pid)

    with patch(
        "app.short_drama.routes.segment.segment_director_service.generate",
        side_effect=ShortDramaInvalidModelOutputError("structured output empty or too short"),
    ):
        resp = client.post("/api/short-drama/segment/generate", json={"project_id": pid})
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload.get("segments")
    first_meta = payload["segments"][0].get("meta") or {}
    assert first_meta.get("source") == "fallback_story_blueprint_shot_plan"
    assert first_meta.get("generation_warning") == "structured_generation_failed_fallback_used"
    assert first_meta.get("original_error_type") == "ShortDramaInvalidModelOutputError"

    db = SessionLocal()
    try:
        saved = db.query(SegmentScriptRecord).filter(SegmentScriptRecord.project_id == pid).all()
        assert saved
        saved_meta = (saved[0].script_json or {}).get("meta") or {}
        assert saved_meta.get("generation_warning") == "structured_generation_failed_fallback_used"
    finally:
        db.close()


def test_segment_generate_returns_422_only_when_ai_and_fallback_both_fail():
    client = TestClient(app)
    pid = _bootstrap_project_with_specs(client)
    with patch(
        "app.short_drama.routes.segment.segment_director_service.generate",
        side_effect=ShortDramaInvalidModelOutputError("structured output empty or too short"),
    ):
        resp = client.post("/api/short-drama/segment/generate", json={"project_id": pid})
    assert resp.status_code == 422
