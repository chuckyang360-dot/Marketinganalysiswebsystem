import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..exceptions import ShortDramaInvalidModelOutputError, ShortDramaProviderError
from ..http_errors import raise_short_drama_http
from ..models import SegmentScriptRecord
from ..schemas.asset import AssetSpecsBundleSchema, CharacterAssetSchema, ProductAssetSchema, SceneAssetSchema
from ..schemas.product import ProductContextSchema
from ..schemas.segment import (
    GenerateSegmentsRequest,
    GenerateSegmentsResponse,
    SegmentScriptSchema,
    UpdateSegmentShotRequest,
    UpdateSegmentShotResponse,
)
from ..schemas.story import StoryBlueprintSchema
from ..services.read_models import (
    latest_product_context,
    latest_story_blueprint,
    list_pipeline_asset_rows,
    next_segment_batch_version,
)
from ..services.segment_director_service import segment_director_service, segments_from_story_shot_plan
from ..services.project_state_service import STEP_4, mark_step_completed, update_last_active_step
from ..services.workflow_orchestrator import orchestrator
from ..utils.enums import WorkflowStep
from ..utils.flow_logging import log_api_error, log_api_request, log_api_success
from ..utils.language import build_language_policy, language_prompt_rules

logger = logging.getLogger(__name__)

router = APIRouter()
_SECONDARY_MUST_SHOW_LIMIT = 3


def _clean_string_list(values: list[str] | None) -> list[str]:
    if values is None:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for raw in values:
        item = str(raw or "").strip()
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def _purpose_rank(v: str | None) -> int:
    x = (v or "").strip().lower()
    order = {
        "hero": 0,
        "core": 1,
        "sell": 2,
        "narrative": 3,
        "support": 4,
        "atmosphere": 5,
    }
    return order.get(x, 99)


def _narrative_rank(v: str | None) -> int:
    x = (v or "").strip().lower()
    order = {
        "hook": 0,
        "conflict": 1,
        "twist": 2,
        "resolution": 3,
    }
    return order.get(x, 99)


def _build_must_show_asset_ids(assets: AssetSpecsBundleSchema) -> list[int]:
    pool = [*assets.characters, *assets.scenes, *assets.products]
    primary = [a for a in pool if a.id is not None and (a.exposure_priority or "").lower() == "primary"]
    secondary = [a for a in pool if a.id is not None and (a.exposure_priority or "").lower() == "secondary"]
    # Hard constraint: background assets never enter must_show_asset_ids.
    secondary = sorted(
        secondary,
        key=lambda a: (
            _purpose_rank(a.purpose),
            _narrative_rank(a.narrative_function),
            int(a.id or 0),
        ),
    )[:_SECONDARY_MUST_SHOW_LIMIT]
    return [int(a.id) for a in [*primary, *secondary] if a.id is not None]


def _meta(row: Any) -> dict[str, Any]:
    m = getattr(row, "meta_json", None)
    return m if isinstance(m, dict) else {}


def _validate_step4_visual_anchor(assets: AssetSpecsBundleSchema) -> None:
    missing: list[str] = []

    def _check(kind: str, rows: list[Any]) -> None:
        for row in rows:
            if row.visual_anchor_image_id is None:
                missing.append(f"{kind}:{row.id or row.name}")

    _check("character", assets.characters)
    _check("scene", assets.scenes)
    _check("product", assets.products)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Step4 generation blocked: visual_anchor_image_id is required for all "
                "CharacterSpec/SceneSpec/ProductSpec. Missing: " + ", ".join(missing)
            ),
        )


@router.post("/generate", response_model=GenerateSegmentsResponse)
async def generate_segments(body: GenerateSegmentsRequest, db: Session = Depends(get_db)):
    log_api_request(logger, "POST /segment/generate", project_id=body.project_id)
    try:
        project = orchestrator.get_project(db, body.project_id)
        orchestrator.assert_step_allowed(db, project, WorkflowStep.GENERATE_SEGMENTS)

        sb_row = latest_story_blueprint(db, body.project_id)
        pc_row = latest_product_context(db, body.project_id)
        if not sb_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story blueprint missing; run /story/generate first",
            )

        chars, scenes, products = list_pipeline_asset_rows(db, body.project_id)
        if not chars and not scenes and not products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset specs missing; run /assets/specs/generate first",
            )

        blueprint = StoryBlueprintSchema.model_validate(sb_row.blueprint_json)
        product_ctx = ProductContextSchema.model_validate(pc_row.normalized_context_json) if pc_row else ProductContextSchema()
        assets = AssetSpecsBundleSchema(
            characters=[
                CharacterAssetSchema(
                    id=c.id,
                    name=c.name,
                    role_type=c.role_type,
                    description=c.description,
                    visual_prompt=c.visual_prompt,
                    image_url=c.image_url,
                    visual_anchor_image_id=_meta(c).get("visual_anchor_image_id"),
                    source_asset_version=str(_meta(c).get("source_asset_version") or "legacy-1"),
                    exposure_priority=str(_meta(c).get("exposure_priority") or "secondary"),
                    narrative_function=_meta(c).get("narrative_function"),
                    purpose=_meta(c).get("purpose"),
                    meta=_meta(c),
                )
                for c in chars
            ],
            scenes=[
                SceneAssetSchema(
                    id=s.id,
                    name=s.name,
                    scene_type=s.scene_type,
                    scene_form=_meta(s).get("scene_form"),
                    description=s.description,
                    visual_prompt=s.visual_prompt,
                    image_url=s.image_url,
                    visual_anchor_image_id=_meta(s).get("visual_anchor_image_id"),
                    source_asset_version=str(_meta(s).get("source_asset_version") or "legacy-1"),
                    exposure_priority=str(_meta(s).get("exposure_priority") or "secondary"),
                    narrative_function=_meta(s).get("narrative_function"),
                    purpose=_meta(s).get("purpose"),
                    meta=_meta(s),
                )
                for s in scenes
            ],
            products=[
                ProductAssetSchema(
                    id=p.id,
                    name=p.name,
                    product_role=_meta(p).get("product_role"),
                    description=p.description,
                    visual_prompt=p.visual_prompt,
                    image_url=p.image_url,
                    visual_anchor_image_id=_meta(p).get("visual_anchor_image_id"),
                    source_asset_version=str(_meta(p).get("source_asset_version") or "legacy-1"),
                    exposure_priority=str(_meta(p).get("exposure_priority") or "secondary"),
                    narrative_function=_meta(p).get("narrative_function"),
                    purpose=_meta(p).get("purpose"),
                    meta=_meta(p),
                )
                for p in products
            ],
        )
        must_show_asset_ids = _build_must_show_asset_ids(assets)
        assets = assets.model_copy(
            update={
                "characters": [
                    c.model_copy(update={"meta": {**(c.meta or {}), "must_show": (c.id in must_show_asset_ids)}})
                    for c in assets.characters
                ],
                "scenes": [
                    s.model_copy(update={"meta": {**(s.meta or {}), "must_show": (s.id in must_show_asset_ids)}})
                    for s in assets.scenes
                ],
                "products": [
                    p.model_copy(update={"meta": {**(p.meta or {}), "must_show": (p.id in must_show_asset_ids)}})
                    for p in assets.products
                ],
            }
        )

        raw_inputs = pc_row.raw_inputs_json if pc_row else {}
        language_policy = build_language_policy(
            workflow_source={"product": product_ctx.model_dump(), "raw_inputs": raw_inputs, "blueprint": blueprint.model_dump()},
            market_source={
                "raw_inputs": raw_inputs,
                "target_users": product_ctx.target_users,
                "usage_scenarios": product_ctx.usage_scenarios,
            },
            explicit_target_market=(project.target_market or "North America"),
        )

        project_config = {
            "duration": project.duration,
            "format": project.format,
            "style": project.style,
            "visual_style": project.visual_style,
            "aspect_ratio": project.aspect_ratio,
            "target_market": language_policy["target_market"],
            "marketing_goal": project.marketing_goal or "brand_seeding",
            "target_audience": project.target_audience or "",
            "brand_tone": project.brand_tone or "natural",
            "creative_intent": project.creative_intent or "",
            "creative_brief": project.creative_brief or "",
            "workflow_language": language_policy["workflow_language"],
            "video_language": language_policy["video_language"],
            "language_policy": language_policy,
            "language_prompt_rules": language_prompt_rules(language_policy),
            "must_show_asset_ids": must_show_asset_ids,
            "s1_visual_constraints": {
                "visual_features": product_ctx.visual_features,
                "consistency_notes": product_ctx.consistency_notes,
                "visual_risk_notes": product_ctx.visual_risk_notes,
                "product_form": product_ctx.product_form,
                "usage_scenarios": product_ctx.usage_scenarios,
            },
        }
        project_config["legacy_creative_intent_summary"] = "；".join(
            [
                x
                for x in [
                    f"营销目标：{project_config['marketing_goal']}" if project_config["marketing_goal"] else "",
                    f"目标受众：{project_config['target_audience']}" if project_config["target_audience"] else "",
                    f"品牌调性：{project_config['brand_tone']}" if project_config["brand_tone"] else "",
                    f"补充说明：{project_config['creative_brief']}" if project_config["creative_brief"] else "",
                ]
                if x
            ]
        )
        project_config["effective_creative_intent"] = (
            project_config["creative_intent"] or project_config["legacy_creative_intent_summary"]
        )

        try:
            segments = None if blueprint.creative_brief else segments_from_story_shot_plan(blueprint, assets=assets, project_config=project_config)
            source = "story_blueprint.shot_plan" if segments is not None else "segment_director_provider"
            if segments is None:
                segments = segment_director_service.generate(body.project_id, blueprint, assets, project_config)
            shot_count = sum(len(s.shots) for s in segments)
            story_framework = blueprint.story_framework if isinstance(blueprint.story_framework, dict) else {}
            original_structure = story_framework.get("structure") if isinstance(story_framework.get("structure"), list) else []
            segment_functions = [
                str((s.meta or {}).get("function_label") or s.goal or s.title or "").strip() for s in segments
            ]
            logger.info(
                "[S4_SHOT_PLAN_SOURCE] project_id=%s source=%s segment_count=%s shot_count=%s",
                body.project_id,
                source,
                len(segments),
                shot_count,
            )
            logger.info(
                "[S4_FRAMEWORK_SEGMENT_PLAN] %s",
                {
                    "project_id": body.project_id,
                    "duration": project_config.get("duration"),
                    "format": project_config.get("format"),
                    "story_framework_type": story_framework.get("type"),
                    "original_structure": original_structure,
                    "segment_count": len(segments),
                    "segment_functions": segment_functions,
                    "merged_from_structure": len(segments) <= len(original_structure),
                },
            )
            for seg in segments:
                first = seg.shots[0] if seg.shots else None
                char_refs = list((first.character_refs if first else []) or [])
                scene_ref = str((first.scene_ref if first else "") or "")
                prod_refs = list((first.product_refs if first else []) or [])
                missing_fields: list[str] = []
                if not first:
                    missing_fields.append("shots")
                else:
                    if not str(first.action_description or "").strip():
                        missing_fields.append("action_description")
                    if float(first.duration_seconds or 0) <= 0:
                        missing_fields.append("duration_seconds")
                    if not char_refs:
                        missing_fields.append("character_refs")
                    if not scene_ref:
                        missing_fields.append("scene_ref")
                    if not prod_refs:
                        missing_fields.append("product_refs")
                used_fallback_assets = bool(char_refs or scene_ref or prod_refs)
                asset_refs_complete = bool(char_refs and scene_ref and prod_refs)
                logger.info(
                    "[S4_SEGMENT_SHOT_FIELDS_BUILT] %s",
                    {
                        "project_id": body.project_id,
                        "segment_id": seg.segment_id,
                        "segment_name": seg.title,
                        "shot_count": len(seg.shots),
                        "first_shot_action_preview": str((first.action_description if first else "") or "")[:180],
                        "first_shot_duration": float((first.duration_seconds if first else 0) or 0),
                        "character_refs": char_refs,
                        "scene_ref": scene_ref,
                        "product_refs": prod_refs,
                        "used_fallback_assets": used_fallback_assets,
                        "missing_fields": missing_fields,
                    },
                )
                logger.info(
                    "[S4_SHOTS_BY_FRAMEWORK_BUILT] %s",
                    {
                        "project_id": body.project_id,
                        "segment_id": seg.segment_id,
                        "segment_function": str((seg.meta or {}).get("function_label") or seg.goal or seg.title or ""),
                        "shot_count": len(seg.shots),
                        "shot_actions_preview": [str(sh.action_description or "")[:120] for sh in seg.shots[:2]],
                        "asset_refs_complete": asset_refs_complete,
                    },
                )
        except (ShortDramaProviderError, ShortDramaInvalidModelOutputError) as e:
            # Recoverable model/validator issues: keep project out of terminal failed so user can retry.
            db.rollback()
            raise_short_drama_http(e)
        except Exception:
            logger.exception("Segment generation unexpected error project_id=%s", body.project_id)
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Segment generation failed",
            )

        batch_ver = next_segment_batch_version(db, body.project_id)
        db.query(SegmentScriptRecord).filter(SegmentScriptRecord.project_id == body.project_id).delete(
            synchronize_session=False
        )
        record_ids: list[int] = []
        for seg in segments:
            asset_versions = {
                "characters": {str(c.id): c.source_asset_version for c in assets.characters if c.id is not None},
                "scenes": {str(s.id): s.source_asset_version for s in assets.scenes if s.id is not None},
                "products": {str(p.id): p.source_asset_version for p in assets.products if p.id is not None},
            }
            meta = dict(seg.meta or {})
            meta["must_show_asset_ids"] = must_show_asset_ids
            meta["asset_spec_versions"] = asset_versions
            meta["language_policy"] = language_policy
            row = SegmentScriptRecord(
                project_id=body.project_id,
                segment_id=seg.segment_id,
                script_json=seg.model_copy(update={"meta": meta}).model_dump(),
                version=batch_ver,
            )
            db.add(row)
            db.flush()
            record_ids.append(row.id)

        mark_step_completed(project, STEP_4)
        update_last_active_step(project, STEP_4)
        orchestrator.advance_on_success(db, project, WorkflowStep.GENERATE_SEGMENTS)
        db.commit()

        log_api_success(
            logger,
            "POST /segment/generate",
            project_id=body.project_id,
            segments_count=len(segments),
            record_ids_count=len(record_ids),
        )
        return GenerateSegmentsResponse(
            project_id=body.project_id,
            segments=segments,
            record_ids=record_ids,
        )
    except HTTPException as e:
        log_api_error(
            logger,
            "POST /segment/generate",
            str(e.detail),
            project_id=body.project_id,
            status_code=e.status_code,
        )
        raise


@router.patch("/{segment_id}/shots/{shot_id}", response_model=UpdateSegmentShotResponse)
async def update_segment_shot(
    segment_id: str,
    shot_id: str,
    body: UpdateSegmentShotRequest,
    db: Session = Depends(get_db),
):
    log_api_request(
        logger,
        "PATCH /segment/{segment_id}/shots/{shot_id}",
        project_id=body.project_id,
        segment_id=segment_id,
        shot_id=shot_id,
    )
    rec = (
        db.query(SegmentScriptRecord)
        .filter(
            SegmentScriptRecord.project_id == body.project_id,
            SegmentScriptRecord.segment_id == segment_id,
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Segment {segment_id!r} not found")

    script = dict(rec.script_json) if isinstance(rec.script_json, dict) else {}
    shots = script.get("shots")
    if not isinstance(shots, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Segment has no editable shots")

    target_index = -1
    for idx, raw in enumerate(shots):
        shot = raw if isinstance(raw, dict) else {}
        sid = str(shot.get("shot_id") or f"shot_{idx + 1}")
        if sid == shot_id or str(idx + 1) == shot_id:
            target_index = idx
            break
    if target_index < 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shot {shot_id!r} not found")

    if body.segment_title is not None:
        script["title"] = body.segment_title.strip()
    if body.segment_goal is not None:
        script["goal"] = body.segment_goal.strip()
    if body.duration_limit is not None:
        script["duration_limit"] = float(body.duration_limit or 0)

    shot = dict(shots[target_index]) if isinstance(shots[target_index], dict) else {}
    text_updates = {
        "action_description": body.action_description,
        "dialogue": body.spoken_text if body.spoken_text is not None else body.dialogue,
        "spoken_text": body.spoken_text if body.spoken_text is not None else body.dialogue,
        "voiceover": body.voiceover_text if body.voiceover_text is not None else body.voiceover,
        "voiceover_text": body.voiceover_text if body.voiceover_text is not None else body.voiceover,
        "subtitle_text": body.subtitle_text,
        "subtitle": body.subtitle_text,
        "emotion": body.emotion,
        "video_prompt": body.generation_prompt if body.generation_prompt is not None else body.video_prompt,
        "generation_prompt": body.generation_prompt if body.generation_prompt is not None else body.video_prompt,
        "manual_video_prompt": body.manual_video_prompt,
        "manual_scene_ref": body.manual_scene_ref,
    }
    for key, value in text_updates.items():
        if value is not None:
            shot[key] = str(value).strip()
    if body.duration_seconds is not None:
        shot["duration_seconds"] = float(body.duration_seconds or 0)
    if body.must_show is not None:
        shot["must_show"] = _clean_string_list(body.must_show)
    if body.must_avoid is not None:
        shot["must_avoid"] = _clean_string_list(body.must_avoid)
    if body.manual_character_refs is not None:
        shot["manual_character_refs"] = _clean_string_list(body.manual_character_refs)
    if body.manual_product_refs is not None:
        shot["manual_product_refs"] = _clean_string_list(body.manual_product_refs)
    shot.setdefault("shot_id", shot_id)
    shot["manual_updated_at"] = datetime.now(timezone.utc).isoformat()

    shots[target_index] = shot
    script["shots"] = shots
    meta = dict(script.get("meta") or {})
    meta["needs_regeneration"] = True
    meta["dirty_segment_id"] = segment_id
    meta["dirty_shot_id"] = shot_id
    meta["manual_updated_at"] = shot["manual_updated_at"]
    script["meta"] = meta

    rec.script_json = script
    db.add(rec)
    db.commit()
    db.refresh(rec)

    log_api_success(
        logger,
        "PATCH /segment/{segment_id}/shots/{shot_id}",
        project_id=body.project_id,
        segment_id=segment_id,
        shot_id=shot_id,
        needs_regeneration=True,
    )
    return UpdateSegmentShotResponse(
        project_id=body.project_id,
        segment_id=segment_id,
        shot_id=shot_id,
        segment=script,
        shot=shot,
        needs_regeneration=True,
    )
