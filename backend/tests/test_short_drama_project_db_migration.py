import os

os.environ.setdefault("EXA_API_KEY", "dummy")
os.environ.setdefault("TAVILY_API_KEY", "dummy")
os.environ.setdefault("X_BEARER_TOKEN", "dummy")

from sqlalchemy import create_engine, inspect, text

from app.database import ensure_short_drama_project_columns


def test_ensure_short_drama_project_columns_sqlite_idempotent(tmp_path):
    db_path = tmp_path / "sd_project_missing_cols.db"
    test_engine = create_engine(f"sqlite:///{db_path}")
    with test_engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE short_drama_projects (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    project_name VARCHAR
                )
                """
            )
        )

    ensure_short_drama_project_columns(test_engine)
    ensure_short_drama_project_columns(test_engine)

    cols = {c["name"] for c in inspect(test_engine).get_columns("short_drama_projects")}
    assert "target_market" in cols
    assert "marketing_goal" in cols
    assert "target_audience" in cols
    assert "brand_tone" in cols
    assert "creative_intent" in cols
    assert "creative_brief" in cols
    assert "workflow_language" in cols
    assert "video_language" in cols
