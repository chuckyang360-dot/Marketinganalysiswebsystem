import logging

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import settings

logger = logging.getLogger(__name__)

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _sqlite_ensure_render_job_columns() -> None:
    """SQLite: add Phase 4 columns if DB was created before they existed."""
    if "sqlite" not in settings.DATABASE_URL:
        return
    try:
        insp = inspect(engine)
        if not insp.has_table("short_drama_render_jobs"):
            return
        cols = {c["name"] for c in insp.get_columns("short_drama_render_jobs")}
        alters: list[str] = []
        if "provider_request_id" not in cols:
            alters.append("ALTER TABLE short_drama_render_jobs ADD COLUMN provider_request_id VARCHAR")
        if "model" not in cols:
            alters.append("ALTER TABLE short_drama_render_jobs ADD COLUMN model VARCHAR")
        if "meta_json" not in cols:
            alters.append("ALTER TABLE short_drama_render_jobs ADD COLUMN meta_json TEXT")
        if not alters:
            return
        with engine.begin() as conn:
            for stmt in alters:
                conn.execute(text(stmt))
        logger.info("SQLite migration: short_drama_render_jobs columns added: %s", alters)
    except Exception:
        logger.exception("SQLite migration for short_drama_render_jobs failed")


def _ensure_short_drama_project_step_columns() -> None:
    """Add last_active_step / step_status when table predates those fields (SQLite, PostgreSQL, etc.)."""
    try:
        insp = inspect(engine)
        if not insp.has_table("short_drama_projects"):
            return
        cols = {c["name"] for c in insp.get_columns("short_drama_projects")}
        dialect = engine.dialect.name
        alters: list[str] = []
        if "last_active_step" not in cols:
            if dialect == "postgresql":
                alters.append(
                    "ALTER TABLE short_drama_projects ADD COLUMN IF NOT EXISTS last_active_step VARCHAR"
                )
            else:
                alters.append("ALTER TABLE short_drama_projects ADD COLUMN last_active_step VARCHAR")
        if "step_status" not in cols:
            if dialect == "postgresql":
                alters.append(
                    "ALTER TABLE short_drama_projects ADD COLUMN IF NOT EXISTS step_status JSON"
                )
            else:
                alters.append("ALTER TABLE short_drama_projects ADD COLUMN step_status TEXT")
        if not alters:
            return
        with engine.begin() as conn:
            for stmt in alters:
                conn.execute(text(stmt))
        logger.info("Migration: short_drama_projects columns added (%s): %s", dialect, alters)
    except Exception:
        logger.exception("Migration for short_drama_projects step columns failed")


def init_db():
    """Initialize database tables - models must be imported before calling this"""
    Base.metadata.create_all(bind=engine)
    _sqlite_ensure_render_job_columns()
    _ensure_short_drama_project_step_columns()
