from fastapi import FastAPI, Query

print("=== MAIN.PY VERSION MARKER: CORS_DEBUG_V6 ===")

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging
import os
import shutil

from .config import settings
from .database import init_db
from .auth.routes import router as auth_router
from .api.x_analysis.routes import router as x_analysis_router
from .api.gap_analysis import router as gap_analysis_router
from .api.content_ideas import router as content_ideas_router
from .api.ceo_agent import router as ceo_agent_router
from .services.ceo_agent import ceo_agent

# Import all models to ensure they're registered with Base.metadata
# This must be done before calling init_db()
from .models import user, x_analysis
from .short_drama.models import (  # Short Drama Engine tables
    CharacterAsset,
    ProductAsset,
    ProductContextRecord,
    RenderJob,
    SceneAsset,
    SegmentScriptRecord,
    ShortDramaProject,
    StoryBlueprintRecord,
)

# Import analyze router
from .api.analyze.routes import router as analyze_router
from .short_drama.routes import router as short_drama_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

ffmpeg_path = shutil.which("ffmpeg")
if ffmpeg_path is not None:
    logging.info("[FFMPEG_RUNTIME_READY] project_id=%s segment_id=%s ffmpeg_cmd=%s", "", "", ffmpeg_path)
else:
    logging.error("[FFMPEG_NOT_FOUND_IN_ENV] project_id=%s segment_id=%s ffmpeg_cmd=%s exception_class=%s err=%s", "", "", "ffmpeg", "FileNotFoundError", "ffmpeg not found in PATH")

# Create FastAPI app
app = FastAPI(
    title="Vibe Marketing API",
    description="Backend API for Vibe Marketing platform",
    version="1.0.0",
    debug=settings.DEBUG,
)

# Explicit origins only (no wildcard). CORSMiddleware handles OPTIONS preflight with proper headers.
SHORT_DRAMA_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://aimarcket2026.vercel.app",
]

# Configure CORS - must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=SHORT_DRAMA_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Authorization"],
)

# Initialize database (after models are imported)
init_db()

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(x_analysis_router, prefix="/api/x-analysis", tags=["X Analysis"])
from .api.reddit_analysis import router as reddit_analysis_router
from .api.seo_analysis import router as seo_analysis_router
app.include_router(reddit_analysis_router, prefix="/api/reddit-analysis", tags=["Reddit Analysis"])
app.include_router(seo_analysis_router, prefix="/api/seo-analysis", tags=["SEO Analysis"])
app.include_router(gap_analysis_router, prefix="/api/gap-analysis", tags=["Gap Analysis"])
app.include_router(content_ideas_router, prefix="/api/content-ideas", tags=["Content Ideas"])
app.include_router(ceo_agent_router, prefix="/api/full-analysis", tags=["Full Analysis"])
app.include_router(analyze_router, prefix="/api/analyze", tags=["Evidence Analysis"])
app.include_router(short_drama_router, prefix="/api/short-drama", tags=["Short Drama"])

# CEO analyze routes (non-/api paths) to prevent 404
# /ceo/analyze?query=...
app.include_router(ceo_agent_router, prefix="/ceo", tags=["ceo"])

@app.get("/analyze")
@app.post("/analyze")
async def analyze(
    query: str = Query(..., description="关键词或电商商品URL"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results per agent"),
):
    """
    Convenience endpoint so /analyze doesn't 404.
    Internally proxies to CEO agent full analysis entry.
    """
    return await ceo_agent.run_full_analysis(query=query, limit=limit)

_backend_root = Path(__file__).resolve().parent.parent
_repo_root = _backend_root.parent

# Short Drama generated asset images (register before generic /static so paths are not shadowed)
_short_drama_gen = _backend_root / "generated" / "short_drama_assets"
_short_drama_gen.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/short-drama-assets",
    StaticFiles(directory=str(_short_drama_gen)),
    name="short_drama_asset_files",
)

_short_drama_vid = _backend_root / "generated" / "short_drama_videos"
_short_drama_vid.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/short-drama-videos",
    StaticFiles(directory=str(_short_drama_vid)),
    name="short_drama_video_files",
)

_short_drama_xai_ref = _backend_root / "generated" / "short_drama_xai_assets"
_short_drama_xai_ref.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/short-drama-xai-assets",
    StaticFiles(directory=str(_short_drama_xai_ref)),
    name="short_drama_xai_ref_files",
)

# Generic /static (SPA build when present, else empty backend/static) — always mounted so /static/... routing is stable
_static_fallback = _backend_root / "static"
_static_fallback.mkdir(parents=True, exist_ok=True)
_frontend_build = _repo_root / "frontend" / "build"
_static_mount_dir = _frontend_build if _frontend_build.is_dir() else _static_fallback
app.mount("/static", StaticFiles(directory=str(_static_mount_dir)), name="static")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Vibe Marketing API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "API is running",
        "version_marker": "CORS_DEBUG_V6"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )
