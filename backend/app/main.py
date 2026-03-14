from fastapi import FastAPI, Request

print("=== MAIN.PY VERSION MARKER: CORS_DEBUG_V5 ===")

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging
import os

from .config import settings
from .database import init_db
from .auth.routes import router as auth_router
from .api.x_analysis.routes import router as x_analysis_router
from .api.gap_analysis import router as gap_analysis_router
from .api.content_ideas import router as content_ideas_router
from .api.ceo_agent import router as ceo_agent_router

# Import all models to ensure they're registered with Base.metadata
# This must be done before calling init_db()
from .models import user, x_analysis

# Import analyze router
from .api.analyze.routes import router as analyze_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Create FastAPI app
app = FastAPI(
    title="Vibe Marketing API",
    description="Backend API for Vibe Marketing platform",
    version="1.0.0",
    debug=settings.DEBUG,
)

# OPTIONS handler middleware - must be before CORSMiddleware
@app.middleware("http")
async def allow_options(request: Request, call_next):
    """Allow all OPTIONS preflight requests"""
    if request.method == "OPTIONS":
        print(
            f"[OPTIONS HANDLER] method={request.method} "
            f"path={request.url.path} "
            f"origin={request.headers.get('origin')} "
            f"acr-method={request.headers.get('access-control-request-method')} "
            f"acr-headers={request.headers.get('access-control-request-headers')}"
        )
        return Response(status_code=200)
    return await call_next(request)

# Configure CORS - must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Static files (for frontend integration) - only mount if directory exists
# This allows backend to work independently of frontend (deployed on Vercel)
frontend_build_path = Path("frontend/build")
if frontend_build_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_build_path)), name="static")

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
        "version_marker": "CORS_DEBUG_V5"
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
