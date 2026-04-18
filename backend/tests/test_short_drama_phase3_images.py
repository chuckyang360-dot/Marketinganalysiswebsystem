"""Short Drama Phase 3: Gemini image provider, local storage, asset_image_service."""

import os

os.environ["SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER"] = "true"
# 避免本机/CI 将 mock 关掉后，无 GEMINI_API_KEY 导致整批出图失败、用例不稳定
os.environ["SHORT_DRAMA_USE_MOCK_IMAGE_PROVIDER"] = "true"

import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy.orm import Session


class TestEffectiveGeminiImageModel(unittest.TestCase):
    def test_default_when_unset(self):
        from unittest.mock import patch as p

        from app.config import settings
        from app.short_drama.providers.gemini_image_client import effective_gemini_image_model

        with p.object(settings, "GEMINI_IMAGE_MODEL", None):
            m = effective_gemini_image_model()
            self.assertEqual(m, "gemini-2.5-flash-image")

    def test_env_overrides_default(self):
        from unittest.mock import patch as p

        from app.config import settings
        from app.short_drama.providers.gemini_image_client import effective_gemini_image_model

        with p.object(settings, "GEMINI_IMAGE_MODEL", "gemini-3-pro-image-preview"):
            self.assertEqual(effective_gemini_image_model(), "gemini-3-pro-image-preview")


class TestMockImageSave(unittest.TestCase):
    def test_mock_saves_and_url(self):
        from app.short_drama.providers.gemini_image_provider import MockGeminiImageProvider
        from app.short_drama.utils import image_storage

        with patch.object(image_storage, "short_drama_generated_root", return_value=Path("/tmp/sd-test-assets")):
            p = Path("/tmp/sd-test-assets")
            p.mkdir(parents=True, exist_ok=True)
            (p / "9").mkdir(exist_ok=True)
            prov = MockGeminiImageProvider()
            gen = prov.generate_image_from_prompt(
                prompt="a" * 20 + " woman in office walking cinematic wide shot",
                asset_type="character",
                project_id=9,
                asset_id=1,
                metadata={},
            )
            self.assertTrue(len(gen.data) > 0)
            url = image_storage.save_image_bytes(
                project_id=9,
                asset_type="character",
                asset_id=1,
                data=gen.data,
                ext="png",
            )
            self.assertTrue(url.startswith("/static/short-drama-assets/9/"))


class TestAssetImageServiceDB(unittest.TestCase):
    def test_character_image_updates_row(self):
        from app.database import SessionLocal, engine
        from app.models import User
        from app.short_drama.models import CharacterAsset, ShortDramaProject
        from app.short_drama.providers.gemini_image_provider import MockGeminiImageProvider
        from app.short_drama.services.asset_image_service import AssetImageService
        from app.short_drama.services.workflow_orchestrator import orchestrator
        from app.short_drama.utils import image_storage

        db: Session = SessionLocal()
        try:
            with patch.object(image_storage, "short_drama_generated_root") as mock_root:
                tmp = Path(__file__).resolve().parent / "_sd_img_test_out"
                tmp.mkdir(parents=True, exist_ok=True)
                mock_root.return_value = tmp

                u = db.query(User).first()
                if not u:
                    u = User(
                        username="sd_p3",
                        name="SD P3",
                        email="sd_p3@test.local",
                        password_hash="x" * 64,
                        is_active=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)
                proj = ShortDramaProject(user_id=u.id, project_name="p3img", status="segments_generated")
                db.add(proj)
                db.commit()
                db.refresh(proj)
                pid = proj.id
                c = CharacterAsset(
                    project_id=pid,
                    name="C1",
                    role_type="protagonist",
                    visual_prompt="young woman in bright office, walking, cinematic lighting, commercial ad",
                    image_url=None,
                    meta_json={},
                )
                db.add(c)
                db.commit()
                db.refresh(c)

                svc = AssetImageService(provider=MockGeminiImageProvider())
                r = svc.generate_character_images(db, pid)
                self.assertEqual(r.characters_succeeded, 1)
                db.refresh(c)
                self.assertIsNotNone(c.image_url)
                self.assertIn("/static/short-drama-assets/", c.image_url or "")
                p = orchestrator.get_project(db, pid)
                self.assertEqual(p.status, "assets_ready")
        finally:
            db.close()


class TestPipelineWithImages(unittest.TestCase):
    def test_pipeline_has_image_urls_after_generate(self):
        from fastapi.testclient import TestClient

        from app.database import SessionLocal
        from app.main import app
        from app.models import User
        from app.short_drama.utils import image_storage

        with patch.object(image_storage, "short_drama_generated_root") as mock_root:
            tmp = Path(__file__).resolve().parent / "_sd_pipeline_img_out"
            tmp.mkdir(parents=True, exist_ok=True)
            mock_root.return_value = tmp

            db = SessionLocal()
            try:
                u = db.query(User).first()
                if not u:
                    u = User(
                        username="sd_p3b",
                        name="SD P3B",
                        email="sd_p3b@test.local",
                        password_hash="x" * 64,
                        is_active=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)
                uid = u.id
            finally:
                db.close()

            c = TestClient(app)
            r = c.post("/api/short-drama/project", json={"user_id": uid, "project_name": "imgpipe"})
            self.assertEqual(r.status_code, 200, r.text)
            pid = r.json()["project"]["id"]
            self.assertEqual(
                200,
                c.post(
                    "/api/short-drama/product/parse",
                    json={"project_id": pid, "input": {"title": "测试品", "image_urls": []}},
                ).status_code,
            )
            self.assertEqual(200, c.post("/api/short-drama/story/generate", json={"project_id": pid}).status_code)
            self.assertEqual(
                200, c.post("/api/short-drama/assets/specs/generate", json={"project_id": pid}).status_code
            )
            self.assertEqual(200, c.post("/api/short-drama/segment/generate", json={"project_id": pid}).status_code)
            ig = c.post("/api/short-drama/assets/images/generate", json={"project_id": pid})
            self.assertEqual(ig.status_code, 200, ig.text)
            pipe = c.get(f"/api/short-drama/project/{pid}/pipeline")
            self.assertEqual(pipe.status_code, 200)
            assets = pipe.json()["assets"]
            urls = [x.get("image_url") for x in assets["characters"] if x.get("image_url")]
            self.assertTrue(any(urls), "expected at least one character image_url in pipeline")

    def test_images_generate_from_specs_without_segments_first(self):
        """asset_specs_generated 可直接生成资产图并到达 assets_ready（主链：图在分段脚本之前）。"""
        from fastapi.testclient import TestClient

        from app.database import SessionLocal
        from app.main import app
        from app.models import User
        from app.short_drama.utils import image_storage

        with patch.object(image_storage, "short_drama_generated_root") as mock_root:
            tmp = Path(__file__).resolve().parent / "_sd_specs_first_img_out"
            tmp.mkdir(parents=True, exist_ok=True)
            mock_root.return_value = tmp

            db = SessionLocal()
            try:
                u = db.query(User).first()
                if not u:
                    u = User(
                        username="sd_p3c",
                        name="SD P3C",
                        email="sd_p3c@test.local",
                        password_hash="x" * 64,
                        is_active=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)
                uid = u.id
            finally:
                db.close()

            c = TestClient(app)
            r = c.post("/api/short-drama/project", json={"user_id": uid, "project_name": "specsfirst"})
            self.assertEqual(r.status_code, 200, r.text)
            pid = r.json()["project"]["id"]
            self.assertEqual(
                200,
                c.post(
                    "/api/short-drama/product/parse",
                    json={"project_id": pid, "input": {"title": "测试品", "image_urls": []}},
                ).status_code,
            )
            self.assertEqual(200, c.post("/api/short-drama/story/generate", json={"project_id": pid}).status_code)
            self.assertEqual(
                200, c.post("/api/short-drama/assets/specs/generate", json={"project_id": pid}).status_code
            )
            pipe0 = c.get(f"/api/short-drama/project/{pid}/pipeline")
            self.assertEqual(pipe0.status_code, 200)
            self.assertEqual(pipe0.json()["project"]["status"], "asset_specs_generated")
            ig = c.post("/api/short-drama/assets/images/generate", json={"project_id": pid})
            self.assertEqual(ig.status_code, 200, ig.text)
            pipe = c.get(f"/api/short-drama/project/{pid}/pipeline")
            self.assertEqual(pipe.status_code, 200)
            self.assertEqual(pipe.json()["project"]["status"], "assets_ready")


if __name__ == "__main__":
    unittest.main()
