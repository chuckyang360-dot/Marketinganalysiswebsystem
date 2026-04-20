from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from ...config import settings
from ..models import CharacterAsset, ProductAsset, SceneAsset, ShortDramaProject
from ..providers.generated_image import GeneratedImage
from ..providers.image_provider_factory import build_short_drama_image_provider
from ..utils.image_prompts import prepare_image_prompt
from ..utils.image_storage import mime_to_ext, save_image_bytes
from .workflow_orchestrator import orchestrator

logger = logging.getLogger(__name__)


@dataclass
class AssetImageBatchResult:
    project_id: int
    characters_attempted: int = 0
    characters_succeeded: int = 0
    scenes_attempted: int = 0
    scenes_succeeded: int = 0
    products_attempted: int = 0
    products_succeeded: int = 0
    errors: list[dict[str, Any]] = field(default_factory=list)

    @property
    def had_attempts(self) -> bool:
        return (
            self.characters_attempted + self.scenes_attempted + self.products_attempted
        ) > 0

    @property
    def any_success(self) -> bool:
        return (
            self.characters_succeeded + self.scenes_succeeded + self.products_succeeded
        ) > 0


class AssetImageService:
    def __init__(self, provider: Any | None = None):
        self._provider = provider if provider is not None else build_short_drama_image_provider()

    def _max_workers(self) -> int:
        return max(1, int(settings.SHORT_DRAMA_IMAGE_MAX_CONCURRENT))

    def _total_asset_row_count(self, db: Session, project_id: int) -> int:
        nc = db.query(CharacterAsset).filter(CharacterAsset.project_id == project_id).count()
        ns = db.query(SceneAsset).filter(SceneAsset.project_id == project_id).count()
        np = db.query(ProductAsset).filter(ProductAsset.project_id == project_id).count()
        return int(nc + ns + np)

    def _prepare_project_for_asset_image_batch(self, db: Session, project: ShortDramaProject) -> None:
        """Unblock failed projects that still have asset rows; must run before begin_asset_image_render."""
        n = self._total_asset_row_count(db, project.id)
        orchestrator.normalize_failed_for_asset_image_retry(db, project, asset_row_count=n)

    def _run_parallel_character(
        self,
        project_id: int,
        rows: list[CharacterAsset],
    ) -> tuple[int, int, list[dict[str, Any]]]:
        if not rows:
            return 0, 0, []
        by_id = {r.id: r for r in rows}
        errors: list[dict[str, Any]] = []
        ok = 0

        def job(row: CharacterAsset) -> tuple[int, str | None, GeneratedImage | None, Exception | None]:
            try:
                prompt = prepare_image_prompt(row.visual_prompt)
                meta = dict(row.meta_json or {})
                seed = meta.get("generation_seed")
                gen = self._provider.generate_from_text(
                    prompt=prompt,
                    asset_type="character",
                    project_id=project_id,
                    asset_id=row.id,
                    metadata={
                        "generation_seed": seed,
                        "style_tags": meta.get("style_tags"),
                    },
                )
                ext = mime_to_ext(gen.mime_type)
                url = save_image_bytes(
                    project_id=project_id,
                    asset_type="character",
                    asset_id=row.id,
                    data=gen.data,
                    ext=ext,
                )
                return row.id, url, gen, None
            except Exception as e:
                return row.id, None, None, e

        with ThreadPoolExecutor(max_workers=min(self._max_workers(), len(rows))) as pool:
            futures = [pool.submit(job, r) for r in rows]
            for fut in as_completed(futures):
                rid, url, gen, err = fut.result()
                if err is not None:
                    logger.warning(
                        "ASSET_IMAGE_CHAR_FAIL project_id=%s asset_id=%s err=%s",
                        project_id,
                        rid,
                        err,
                    )
                    errors.append(
                        {
                            "asset_type": "character",
                            "asset_id": rid,
                            "error": str(err),
                            "error_type": type(err).__name__,
                        }
                    )
                    continue
                ok += 1
                row = by_id[rid]
                merged = dict(row.meta_json or {})
                if gen:
                    merged.update(gen.meta)
                row.image_url = url
                row.meta_json = merged
        return len(rows), ok, errors

    def _apply_scene_results(
        self,
        db: Session,
        project_id: int,
        rows: list[SceneAsset],
    ) -> tuple[int, int, list[dict[str, Any]]]:
        if not rows:
            return 0, 0, []

        def job(row: SceneAsset) -> tuple[int, str | None, GeneratedImage | None, Exception | None]:
            try:
                prompt = prepare_image_prompt(row.visual_prompt)
                meta = dict(row.meta_json or {})
                seed = meta.get("generation_seed")
                gen = self._provider.generate_from_text(
                    prompt=prompt,
                    asset_type="scene",
                    project_id=project_id,
                    asset_id=row.id,
                    metadata={
                        "generation_seed": seed,
                        "style_tags": meta.get("style_tags"),
                    },
                )
                ext = mime_to_ext(gen.mime_type)
                url = save_image_bytes(
                    project_id=project_id,
                    asset_type="scene",
                    asset_id=row.id,
                    data=gen.data,
                    ext=ext,
                )
                return row.id, url, gen, None
            except Exception as e:
                return row.id, None, None, e

        errors: list[dict[str, Any]] = []
        ok = 0
        with ThreadPoolExecutor(max_workers=min(self._max_workers(), len(rows))) as pool:
            futures = [pool.submit(job, r) for r in rows]
            for fut in as_completed(futures):
                rid, url, gen, err = fut.result()
                row = db.query(SceneAsset).filter(SceneAsset.id == rid).first()
                if not row:
                    continue
                if err is not None:
                    logger.warning(
                        "ASSET_IMAGE_SCENE_FAIL project_id=%s asset_id=%s err=%s",
                        project_id,
                        rid,
                        err,
                    )
                    errors.append(
                        {
                            "asset_type": "scene",
                            "asset_id": rid,
                            "error": str(err),
                            "error_type": type(err).__name__,
                        }
                    )
                    continue
                ok += 1
                merged = dict(row.meta_json or {})
                if gen:
                    merged.update(gen.meta)
                row.image_url = url
                row.meta_json = merged
        return len(rows), ok, errors

    def _apply_product_results(
        self,
        db: Session,
        project_id: int,
        rows: list[ProductAsset],
    ) -> tuple[int, int, list[dict[str, Any]]]:
        if not rows:
            return 0, 0, []

        def job(row: ProductAsset) -> tuple[int, str | None, GeneratedImage | None, Exception | None]:
            try:
                prompt = prepare_image_prompt(row.visual_prompt)
                meta = dict(row.meta_json or {})
                seed = meta.get("generation_seed")
                gen = self._provider.generate_from_text(
                    prompt=prompt,
                    asset_type="product",
                    project_id=project_id,
                    asset_id=row.id,
                    metadata={
                        "generation_seed": seed,
                        "style_tags": meta.get("style_tags"),
                    },
                )
                ext = mime_to_ext(gen.mime_type)
                url = save_image_bytes(
                    project_id=project_id,
                    asset_type="product",
                    asset_id=row.id,
                    data=gen.data,
                    ext=ext,
                )
                return row.id, url, gen, None
            except Exception as e:
                return row.id, None, None, e

        errors: list[dict[str, Any]] = []
        ok = 0
        with ThreadPoolExecutor(max_workers=min(self._max_workers(), len(rows))) as pool:
            futures = [pool.submit(job, r) for r in rows]
            for fut in as_completed(futures):
                rid, url, gen, err = fut.result()
                row = db.query(ProductAsset).filter(ProductAsset.id == rid).first()
                if not row:
                    continue
                if err is not None:
                    logger.warning(
                        "ASSET_IMAGE_PRODUCT_FAIL project_id=%s asset_id=%s err=%s",
                        project_id,
                        rid,
                        err,
                    )
                    errors.append(
                        {
                            "asset_type": "product",
                            "asset_id": rid,
                            "error": str(err),
                            "error_type": type(err).__name__,
                        }
                    )
                    continue
                ok += 1
                merged = dict(row.meta_json or {})
                if gen:
                    merged.update(gen.meta)
                row.image_url = url
                row.meta_json = merged
        return len(rows), ok, errors

    def _recover_after_image_batch_crash(self, db: Session, project_id: int) -> None:
        """Rollback uncommitted work and leave project retryable (not terminal failed)."""
        db.rollback()
        p = orchestrator.get_project(db, project_id)
        orchestrator.revert_to_asset_specs_after_image_batch_failure(
            db,
            p,
            reason="asset_image_batch_uncaught_exception",
        )
        db.commit()

    def regenerate_one_asset_image(
        self,
        db: Session,
        *,
        project_id: int,
        asset_type: str,
        asset_id: int,
    ) -> str:
        project = orchestrator.get_project(db, project_id)
        self._prepare_project_for_asset_image_batch(db, project)
        orchestrator.begin_asset_image_render(db, project)
        db.commit()
        t = (asset_type or "").strip().lower()
        if t == "character":
            row = db.query(CharacterAsset).filter(CharacterAsset.project_id == project_id, CharacterAsset.id == asset_id).first()
            if row is None:
                raise ValueError("character asset not found")
            n, ok, errs = self._run_parallel_character(project_id, [row])
            if errs or ok <= 0:
                raise RuntimeError(errs[0].get("error") if errs else "character regenerate failed")
            db.add(row)
            orchestrator.complete_asset_image_render(db, project, had_attempts=n > 0, any_success=ok > 0)
            db.commit()
            return str(row.image_url or "")
        if t == "scene":
            row = db.query(SceneAsset).filter(SceneAsset.project_id == project_id, SceneAsset.id == asset_id).first()
            if row is None:
                raise ValueError("scene asset not found")
            n, ok, errs = self._apply_scene_results(db, project_id, [row])
            if errs or ok <= 0:
                raise RuntimeError(errs[0].get("error") if errs else "scene regenerate failed")
            orchestrator.complete_asset_image_render(db, project, had_attempts=n > 0, any_success=ok > 0)
            db.commit()
            return str(row.image_url or "")
        if t == "product":
            row = db.query(ProductAsset).filter(ProductAsset.project_id == project_id, ProductAsset.id == asset_id).first()
            if row is None:
                raise ValueError("product asset not found")
            n, ok, errs = self._apply_product_results(db, project_id, [row])
            if errs or ok <= 0:
                raise RuntimeError(errs[0].get("error") if errs else "product regenerate failed")
            orchestrator.complete_asset_image_render(db, project, had_attempts=n > 0, any_success=ok > 0)
            db.commit()
            return str(row.image_url or "")
        raise ValueError("invalid asset_type")

    def generate_character_images(self, db: Session, project_id: int) -> AssetImageBatchResult:
        project = orchestrator.get_project(db, project_id)
        self._prepare_project_for_asset_image_batch(db, project)
        orchestrator.begin_asset_image_render(db, project)
        db.commit()
        result = AssetImageBatchResult(project_id=project_id)
        try:
            rows = (
                db.query(CharacterAsset)
                .filter(CharacterAsset.project_id == project_id)
                .order_by(CharacterAsset.id)
                .all()
            )
            if not rows:
                orchestrator.complete_asset_image_render(
                    db, project, had_attempts=False, any_success=False
                )
                db.commit()
                return result
            n, ok, errs = self._run_parallel_character(project_id, rows)
            result.errors.extend(errs)
            result.characters_attempted = n
            result.characters_succeeded = ok
            for row in rows:
                db.add(row)
            orchestrator.complete_asset_image_render(
                db, project, had_attempts=result.had_attempts, any_success=result.any_success
            )
            db.commit()
            return result
        except Exception:
            self._recover_after_image_batch_crash(db, project_id)
            raise

    def generate_scene_images(self, db: Session, project_id: int) -> AssetImageBatchResult:
        project = orchestrator.get_project(db, project_id)
        self._prepare_project_for_asset_image_batch(db, project)
        orchestrator.begin_asset_image_render(db, project)
        db.commit()
        result = AssetImageBatchResult(project_id=project_id)
        try:
            rows = (
                db.query(SceneAsset)
                .filter(SceneAsset.project_id == project_id)
                .order_by(SceneAsset.id)
                .all()
            )
            if not rows:
                orchestrator.complete_asset_image_render(
                    db, project, had_attempts=False, any_success=False
                )
                db.commit()
                return result
            n, ok, errs = self._apply_scene_results(db, project_id, rows)
            result.errors.extend(errs)
            result.scenes_attempted = n
            result.scenes_succeeded = ok
            orchestrator.complete_asset_image_render(
                db, project, had_attempts=result.had_attempts, any_success=result.any_success
            )
            db.commit()
            return result
        except Exception:
            self._recover_after_image_batch_crash(db, project_id)
            raise

    def generate_product_images(self, db: Session, project_id: int) -> AssetImageBatchResult:
        project = orchestrator.get_project(db, project_id)
        self._prepare_project_for_asset_image_batch(db, project)
        orchestrator.begin_asset_image_render(db, project)
        db.commit()
        result = AssetImageBatchResult(project_id=project_id)
        try:
            rows = (
                db.query(ProductAsset)
                .filter(ProductAsset.project_id == project_id)
                .order_by(ProductAsset.id)
                .all()
            )
            if not rows:
                orchestrator.complete_asset_image_render(
                    db, project, had_attempts=False, any_success=False
                )
                db.commit()
                return result
            n, ok, errs = self._apply_product_results(db, project_id, rows)
            result.errors.extend(errs)
            result.products_attempted = n
            result.products_succeeded = ok
            orchestrator.complete_asset_image_render(
                db, project, had_attempts=result.had_attempts, any_success=result.any_success
            )
            db.commit()
            return result
        except Exception:
            self._recover_after_image_batch_crash(db, project_id)
            raise

    def generate_all_asset_images(self, db: Session, project_id: int) -> AssetImageBatchResult:
        project = orchestrator.get_project(db, project_id)
        self._prepare_project_for_asset_image_batch(db, project)
        orchestrator.begin_asset_image_render(db, project)
        db.commit()
        result = AssetImageBatchResult(project_id=project_id)
        try:
            chars = (
                db.query(CharacterAsset)
                .filter(CharacterAsset.project_id == project_id)
                .order_by(CharacterAsset.id)
                .all()
            )
            scenes = (
                db.query(SceneAsset)
                .filter(SceneAsset.project_id == project_id)
                .order_by(SceneAsset.id)
                .all()
            )
            products = (
                db.query(ProductAsset)
                .filter(ProductAsset.project_id == project_id)
                .order_by(ProductAsset.id)
                .all()
            )

            try:
                prov_id = self._provider.capabilities().get("provider_id", "unknown")
            except Exception:
                prov_id = "unknown"
            logger.info(
                "[ASSET_IMAGE_BATCH] project_id=%s provider=%s image_provider_key=%s use_mock_legacy=%s characters=%s scenes=%s products=%s",
                project_id,
                prov_id,
                (settings.SHORT_DRAMA_IMAGE_PROVIDER or "xai"),
                bool(settings.SHORT_DRAMA_USE_MOCK_IMAGE_PROVIDER),
                len(chars),
                len(scenes),
                len(products),
            )

            if chars:
                n, ok, errs = self._run_parallel_character(project_id, chars)
                result.characters_attempted = n
                result.characters_succeeded = ok
                result.errors.extend(errs)
                for row in chars:
                    db.add(row)

            if scenes:
                n, ok, errs = self._apply_scene_results(db, project_id, scenes)
                result.scenes_attempted = n
                result.scenes_succeeded = ok
                result.errors.extend(errs)

            if products:
                n, ok, errs = self._apply_product_results(db, project_id, products)
                result.products_attempted = n
                result.products_succeeded = ok
                result.errors.extend(errs)

            orchestrator.complete_asset_image_render(
                db,
                project,
                had_attempts=result.had_attempts,
                any_success=result.any_success,
            )
            db.commit()
            return result
        except Exception:
            self._recover_after_image_batch_crash(db, project_id)
            raise


asset_image_service = AssetImageService()
