"""Short Drama Phase 4: xAI video config, mock provider, render executor, merge, pipeline fields."""

import os

os.environ["SHORT_DRAMA_USE_MOCK_TEXT_PROVIDER"] = "true"

import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy.orm import Session


def _write_minimal_short_drama_asset_image(project_id: int, filename: str = "ch_1.png") -> None:
    """Tiny PNG on disk for xAI reference-prep tests (generated/short_drama_assets)."""
    from PIL import Image

    from app.short_drama.utils.image_storage import short_drama_generated_root

    d = short_drama_generated_root() / str(project_id)
    d.mkdir(parents=True, exist_ok=True)
    p = d / filename
    Image.new("RGB", (128, 128), color=(90, 120, 200)).save(p, format="PNG")


class TestEffectiveXaiVideoModel(unittest.TestCase):
    def test_default_when_unset(self):
        from unittest.mock import patch as p

        from app.config import settings
        from app.short_drama.providers.xai_video_client import effective_xai_video_model

        with p.object(settings, "XAI_VIDEO_MODEL", None):
            self.assertEqual(effective_xai_video_model(), "grok-imagine-video")

    def test_env_overrides_default(self):
        from unittest.mock import patch as p

        from app.config import settings
        from app.short_drama.providers.xai_video_client import effective_xai_video_model

        with p.object(settings, "XAI_VIDEO_MODEL", "custom-video-model"):
            self.assertEqual(effective_xai_video_model(), "custom-video-model")


class TestMockVideoProvider(unittest.TestCase):
    def test_writes_mp4_when_ffmpeg_available(self):
        from app.short_drama.providers.xai_video_provider import MockXAIVideoProvider
        from app.short_drama.utils import video_storage

        prov = MockXAIVideoProvider()
        try:
            subprocess.run(["/opt/homebrew/bin/ffmpeg", "-version"], capture_output=True, timeout=5, check=True)
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            self.skipTest("ffmpeg not available")
        with patch.object(video_storage, "short_drama_videos_root", return_value=Path("/tmp/sd-test-vid")):
            p = Path("/tmp/sd-test-vid")
            p.mkdir(parents=True, exist_ok=True)
            (p / "1").mkdir(exist_ok=True)
            prov.submit_reference_segment_video(
                prompt="test prompt " * 5,
                reference_image_urls=["https://example.com/a.jpg"],
                duration_seconds=2,
                aspect_ratio="9:16",
                resolution="720p",
                project_id=1,
                segment_id="seg_1",
            )
            res = prov.complete_segment_video(
                request_id="mock", project_id=1, segment_id="seg_1", duration_seconds=2
            )
            self.assertGreater(len(res.video_bytes), 100)
            url = video_storage.save_segment_video_bytes(
                project_id=1, segment_id="seg_1", data=res.video_bytes
            )
            self.assertTrue(url.startswith("/static/short-drama-videos/1/"))


class TestRenderExecutorService(unittest.TestCase):
    def test_batch_updates_segment_and_render_job(self):
        from app.database import SessionLocal
        from app.models import User
        from app.short_drama.models import CharacterAsset, RenderJob, SegmentScriptRecord, ShortDramaProject
        from app.short_drama.providers.xai_video_provider import MockXAIVideoProvider
        from app.short_drama.services.render_executor_service import RenderExecutorService
        from app.short_drama.utils import video_storage

        try:
            subprocess.run(["/opt/homebrew/bin/ffmpeg", "-version"], capture_output=True, timeout=5, check=True)
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            self.skipTest("ffmpeg not available")

        db: Session = SessionLocal()
        try:
            with patch.object(video_storage, "short_drama_videos_root") as mock_root:
                tmp = Path(__file__).resolve().parent / "_sd_vid_test_out"
                tmp.mkdir(parents=True, exist_ok=True)
                mock_root.return_value = tmp

                u = db.query(User).first()
                if not u:
                    u = User(
                        username="sd_p4",
                        name="SD P4",
                        email="sd_p4@test.local",
                        password_hash="x" * 64,
                        is_active=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)
                proj = ShortDramaProject(
                    user_id=u.id,
                    project_name="p4vid",
                    status="assets_ready",
                    aspect_ratio="9:16",
                )
                db.add(proj)
                db.commit()
                db.refresh(proj)
                pid = proj.id

                c = CharacterAsset(
                    project_id=pid,
                    name="Hero",
                    role_type="protagonist",
                    visual_prompt="x",
                    image_url="/static/short-drama-assets/%s/ch_1.png" % pid,
                    meta_json={},
                )
                db.add(c)
                db.commit()
                _write_minimal_short_drama_asset_image(pid)

                script = {
                    "segment_id": "seg_1",
                    "title": "t",
                    "duration_limit": 4,
                    "goal": "g",
                    "shots": [
                        {
                            "shot_id": "s1",
                            "scene_ref": "",
                            "character_refs": ["Hero"],
                            "video_prompt": "slow dolly toward subject, soft key light, commercial ad pacing",
                        }
                    ],
                    "meta": {},
                }
                seg = SegmentScriptRecord(project_id=pid, segment_id="seg_1", script_json=script, version=1)
                db.add(seg)
                db.commit()

                svc = RenderExecutorService(provider=MockXAIVideoProvider())
                batch = svc.generate_segment_videos(db, pid)
                self.assertEqual(batch.segments_attempted, 1)
                self.assertEqual(batch.segments_succeeded, 1)
                db.refresh(proj)
                self.assertEqual(proj.status, "video_segments_ready")

                db.refresh(seg)
                vr = (seg.script_json or {}).get("video_render") or {}
                self.assertTrue(vr.get("video_url"))
                jobs = db.query(RenderJob).filter(RenderJob.project_id == pid).all()
                self.assertTrue(any(j.status == "completed" for j in jobs))
        finally:
            db.close()

    def test_one_segment_failure_does_not_abort_batch(self):
        from app.database import SessionLocal
        from app.models import User
        from app.short_drama.models import CharacterAsset, SegmentScriptRecord, ShortDramaProject
        from app.short_drama.providers.xai_video_provider import MockXAIVideoProvider
        from app.short_drama.services.render_executor_service import RenderExecutorService
        from app.short_drama.utils import video_storage

        db: Session = SessionLocal()
        try:
            with patch.object(video_storage, "short_drama_videos_root") as mock_root:
                tmp = Path(__file__).resolve().parent / "_sd_vid_test_out2"
                tmp.mkdir(parents=True, exist_ok=True)
                mock_root.return_value = tmp

                u = db.query(User).first()
                if not u:
                    u = User(
                        username="sd_p4b",
                        name="SD P4B",
                        email="sd_p4b@test.local",
                        password_hash="x" * 64,
                        is_active=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)
                proj = ShortDramaProject(
                    user_id=u.id,
                    project_name="p4vid2",
                    status="assets_ready",
                    aspect_ratio="9:16",
                )
                db.add(proj)
                db.commit()
                db.refresh(proj)
                pid = proj.id

                c = CharacterAsset(
                    project_id=pid,
                    name="Hero",
                    role_type="protagonist",
                    visual_prompt="x",
                    image_url=f"/static/short-drama-assets/{pid}/ch_1.png",
                    meta_json={},
                )
                db.add(c)
                good = SegmentScriptRecord(
                    project_id=pid,
                    segment_id="seg_1",
                    script_json={
                        "segment_id": "seg_1",
                        "duration_limit": 3,
                        "shots": [
                            {
                                "character_refs": ["Hero"],
                                "video_prompt": "product hero shot, slow push in, premium ad",
                            }
                        ],
                    },
                    version=1,
                )
                bad = SegmentScriptRecord(
                    project_id=pid,
                    segment_id="seg_2",
                    script_json={
                        "segment_id": "seg_2",
                        "duration_limit": 3,
                        "shots": [
                            {
                                "character_refs": ["Hero"],
                                "video_prompt": "b-roll cutaway, soft light, commercial pacing",
                            }
                        ],
                    },
                    version=1,
                )
                db.add_all([c, good, bad])
                db.commit()
                _write_minimal_short_drama_asset_image(pid)

                real = MockXAIVideoProvider()

                def flaky_submit(*args, **kwargs):
                    if kwargs.get("segment_id") == "seg_1":
                        return real.submit_reference_segment_video(*args, **kwargs)
                    raise RuntimeError("simulated provider failure")

                prov = MockXAIVideoProvider()
                prov.submit_reference_segment_video = flaky_submit  # type: ignore[method-assign]

                svc = RenderExecutorService(provider=prov)
                batch = svc.generate_segment_videos(db, pid)
                self.assertEqual(batch.segments_attempted, 2)
                self.assertEqual(batch.segments_succeeded, 1)
                self.assertEqual(len(batch.errors), 1)
        finally:
            db.close()

    def test_all_segments_fail_marks_project_failed(self):
        from app.database import SessionLocal
        from app.models import User
        from app.short_drama.models import CharacterAsset, SegmentScriptRecord, ShortDramaProject
        from app.short_drama.providers.xai_video_provider import MockXAIVideoProvider
        from app.short_drama.services.render_executor_service import RenderExecutorService
        from app.short_drama.utils import video_storage

        db: Session = SessionLocal()
        try:
            with patch.object(video_storage, "short_drama_videos_root") as mock_root:
                tmp = Path(__file__).resolve().parent / "_sd_vid_test_out3"
                tmp.mkdir(parents=True, exist_ok=True)
                mock_root.return_value = tmp

                u = db.query(User).first()
                if not u:
                    u = User(
                        username="sd_p4c",
                        name="SD P4C",
                        email="sd_p4c@test.local",
                        password_hash="x" * 64,
                        is_active=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)
                proj = ShortDramaProject(
                    user_id=u.id,
                    project_name="p4vid_allfail",
                    status="assets_ready",
                    aspect_ratio="9:16",
                )
                db.add(proj)
                db.commit()
                db.refresh(proj)
                pid = proj.id

                c = CharacterAsset(
                    project_id=pid,
                    name="Hero",
                    role_type="protagonist",
                    visual_prompt="x",
                    image_url="/static/x/h.png",
                    meta_json={},
                )
                only = SegmentScriptRecord(
                    project_id=pid,
                    segment_id="seg_1",
                    script_json={
                        "segment_id": "seg_1",
                        "duration_limit": 3,
                        "shots": [],
                    },
                    version=1,
                )
                db.add_all([c, only])
                db.commit()

                svc = RenderExecutorService(provider=MockXAIVideoProvider())
                batch = svc.generate_segment_videos(db, pid)
                self.assertEqual(batch.segments_succeeded, 0)
                db.refresh(proj)
                self.assertEqual(proj.status, "failed")
        finally:
            db.close()


class TestMergeService(unittest.TestCase):
    def _ffmpeg_mp4(self, path: Path, seconds: float = 1.0) -> None:
        subprocess.run(
            [
                "/opt/homebrew/bin/ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"color=c=red:s=160x120:r=24:d={seconds}",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(path),
            ],
            capture_output=True,
            timeout=60,
            check=True,
        )

    def test_merge_requires_all_segments(self):
        from app.database import SessionLocal
        from app.short_drama.models import SegmentScriptRecord, ShortDramaProject
        from app.short_drama.services.merge_service import MergeService
        from app.models import User

        db: Session = SessionLocal()
        try:
            u = db.query(User).first()
            if not u:
                self.skipTest("needs user")
            proj = ShortDramaProject(
                user_id=u.id, project_name="merge_fail", status="video_rendering", aspect_ratio="9:16"
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)
            pid = proj.id
            db.add(
                SegmentScriptRecord(
                    project_id=pid,
                    segment_id="seg_1",
                    script_json={"segment_id": "seg_1", "video_render": {}},
                    version=1,
                )
            )
            db.commit()
            with self.assertRaises(Exception):
                MergeService().merge_project_video(db, pid)
        finally:
            db.close()

    def test_merge_concat(self):
        from app.database import SessionLocal
        from app.short_drama.models import SegmentScriptRecord, ShortDramaProject
        from app.short_drama.services.merge_service import MergeService
        from app.short_drama.services.workflow_orchestrator import orchestrator
        from app.models import User
        from app.short_drama.utils import video_storage

        try:
            subprocess.run(["/opt/homebrew/bin/ffmpeg", "-version"], capture_output=True, timeout=5, check=True)
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            self.skipTest("ffmpeg not available")

        db: Session = SessionLocal()
        try:
            with patch.object(video_storage, "short_drama_videos_root") as mock_root:
                tmp = Path(__file__).resolve().parent / "_sd_merge_out"
                tmp.mkdir(parents=True, exist_ok=True)
                mock_root.return_value = tmp

                u = db.query(User).first()
                if not u:
                    self.skipTest("needs user")
                proj = ShortDramaProject(
                    user_id=u.id, project_name="merge_ok", status="video_segments_ready", aspect_ratio="9:16"
                )
                db.add(proj)
                db.commit()
                db.refresh(proj)
                pid = proj.id
                d = tmp / str(pid)
                d.mkdir(parents=True, exist_ok=True)
                p1 = d / "a.mp4"
                p2 = d / "b.mp4"
                self._ffmpeg_mp4(p1, 0.5)
                self._ffmpeg_mp4(p2, 0.5)
                url1 = f"/static/short-drama-videos/{pid}/a.mp4"
                url2 = f"/static/short-drama-videos/{pid}/b.mp4"
                db.add_all(
                    [
                        SegmentScriptRecord(
                            project_id=pid,
                            segment_id="seg_2",
                            script_json={"segment_id": "seg_2", "video_render": {"video_url": url2}},
                            version=1,
                        ),
                        SegmentScriptRecord(
                            project_id=pid,
                            segment_id="seg_1",
                            script_json={"segment_id": "seg_1", "video_render": {"video_url": url1}},
                            version=1,
                        ),
                    ]
                )
                db.commit()

                final = MergeService().merge_project_video(db, pid)
                self.assertTrue(final.startswith(f"/static/short-drama-videos/{pid}/final_"))
                p = orchestrator.get_project(db, pid)
                self.assertEqual(p.status, "completed")
        finally:
            db.close()

    def test_merge_ffmpeg_failure_records_failed_final_job(self):
        from app.short_drama.exceptions import ShortDramaFFmpegError, ShortDramaMergeError
        from app.short_drama.models import RenderJob
        from app.short_drama.services.merge_service import MergeService
        from app.short_drama.utils import video_storage
        from app.short_drama.utils.enums import RenderJobStatus, RenderTargetType
        from app.models import User

        try:
            subprocess.run(["/opt/homebrew/bin/ffmpeg", "-version"], capture_output=True, timeout=5, check=True)
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            self.skipTest("ffmpeg not available")

        db: Session = SessionLocal()
        try:
            with patch.object(video_storage, "short_drama_videos_root") as mock_root:
                tmp = Path(__file__).resolve().parent / "_sd_merge_ff"
                tmp.mkdir(parents=True, exist_ok=True)
                mock_root.return_value = tmp

                u = db.query(User).first()
                if not u:
                    self.skipTest("needs user")
                proj = ShortDramaProject(
                    user_id=u.id,
                    project_name="merge_ffmpeg_fail",
                    status="video_segments_ready",
                    aspect_ratio="9:16",
                )
                db.add(proj)
                db.commit()
                db.refresh(proj)
                pid = proj.id
                d = tmp / str(pid)
                d.mkdir(parents=True, exist_ok=True)
                p1 = d / "a.mp4"
                p2 = d / "b.mp4"
                self._ffmpeg_mp4(p1, 0.5)
                self._ffmpeg_mp4(p2, 0.5)
                url1 = f"/static/short-drama-videos/{pid}/a.mp4"
                url2 = f"/static/short-drama-videos/{pid}/b.mp4"
                db.add_all(
                    [
                        SegmentScriptRecord(
                            project_id=pid,
                            segment_id="seg_2",
                            script_json={"segment_id": "seg_2", "video_render": {"video_url": url2}},
                            version=1,
                        ),
                        SegmentScriptRecord(
                            project_id=pid,
                            segment_id="seg_1",
                            script_json={"segment_id": "seg_1", "video_render": {"video_url": url1}},
                            version=1,
                        ),
                    ]
                )
                db.commit()

                from app.short_drama.services import merge_service as ms_mod

                with patch.object(ms_mod, "merge_mp4_files", side_effect=ShortDramaFFmpegError("ffmpeg merge failed test")):
                    with self.assertRaises(ShortDramaMergeError):
                        MergeService().merge_project_video(db, pid)

                job = (
                    db.query(RenderJob)
                    .filter(
                        RenderJob.project_id == pid,
                        RenderJob.target_type == RenderTargetType.FINAL.value,
                    )
                    .order_by(RenderJob.id.desc())
                    .first()
                )
                self.assertIsNotNone(job)
                self.assertEqual(job.status, RenderJobStatus.FAILED.value)
                self.assertTrue(job.error_message)
                db.refresh(proj)
                self.assertEqual(proj.status, "video_segments_ready")
        finally:
            db.close()


class TestPipelineVideoFields(unittest.TestCase):
    def test_pipeline_exposes_video_url_and_final(self):
        from app.database import SessionLocal
        from app.models import User
        from app.short_drama.models import RenderJob, SegmentScriptRecord, ShortDramaProject
        from app.short_drama.routes.project import get_pipeline
        from app.short_drama.utils.enums import RenderJobStatus, RenderTargetType
        import asyncio

        db: Session = SessionLocal()
        try:
            u = db.query(User).first()
            if not u:
                self.skipTest("needs user")
            proj = ShortDramaProject(user_id=u.id, project_name="pipe_vid", status="completed")
            db.add(proj)
            db.commit()
            db.refresh(proj)
            pid = proj.id
            db.add(
                SegmentScriptRecord(
                    project_id=pid,
                    segment_id="seg_1",
                    script_json={
                        "segment_id": "seg_1",
                        "video_render": {"video_url": f"/static/short-drama-videos/{pid}/s.mp4"},
                    },
                    version=1,
                )
            )
            db.add(
                RenderJob(
                    project_id=pid,
                    target_type=RenderTargetType.FINAL.value,
                    target_id=str(pid),
                    provider="ffmpeg",
                    status=RenderJobStatus.COMPLETED.value,
                    output_url=f"/static/short-drama-videos/{pid}/final_1.mp4",
                )
            )
            db.commit()

            summary = asyncio.run(get_pipeline(pid, db))
            self.assertEqual(summary.final_video_url, f"/static/short-drama-videos/{pid}/final_1.mp4")
            self.assertEqual(summary.segment_scripts[0].get("video_url"), f"/static/short-drama-videos/{pid}/s.mp4")
            self.assertTrue(summary.has_final_video)
            self.assertEqual(summary.final_render_status, "completed")
        finally:
            db.close()

    def test_pipeline_segments_ready_without_final(self):
        from app.database import SessionLocal
        from app.models import User
        from app.short_drama.models import SegmentScriptRecord, ShortDramaProject
        from app.short_drama.routes.project import get_pipeline
        import asyncio

        db: Session = SessionLocal()
        try:
            u = db.query(User).first()
            if not u:
                self.skipTest("needs user")
            proj = ShortDramaProject(user_id=u.id, project_name="pipe_seg_only", status="video_segments_ready")
            db.add(proj)
            db.commit()
            db.refresh(proj)
            pid = proj.id
            for sid in ("seg_1", "seg_2", "seg_3"):
                db.add(
                    SegmentScriptRecord(
                        project_id=pid,
                        segment_id=sid,
                        script_json={
                            "segment_id": sid,
                            "video_render": {"video_url": f"/static/short-drama-videos/{pid}/{sid}.mp4"},
                        },
                        version=1,
                    )
                )
            db.commit()

            summary = asyncio.run(get_pipeline(pid, db))
            self.assertTrue(summary.has_all_segment_videos)
            self.assertFalse(summary.has_final_video)
            self.assertEqual(summary.final_render_status, "none")
            self.assertEqual(summary.current_video_stage, "segments_complete_pending_final")
        finally:
            db.close()
