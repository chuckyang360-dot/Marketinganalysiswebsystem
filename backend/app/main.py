from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .auth.routes import router as auth_router
from .api.x_analysis.routes import router as x_analysis_router

# Import all models to ensure they're registered with Base.metadata
# This must be done before calling init_db()
from .models import user, x_analysis

# Create FastAPI app
app = FastAPI(
    title="Vibe Marketing API",
    description="Backend API for Vibe Marketing platform",
    version="1.0.0",
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication middleware
# Note: For development, you might want to disable this
# For production, you'd uncomment this line:
# from .middleware.auth import AuthMiddleware
# app.add_middleware(AuthMiddleware)

# Initialize database (after models are imported)
init_db()

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(x_analysis_router, prefix="/x-analysis", tags=["X Analysis"])

# Static files (for frontend integration)
app.mount("/static", StaticFiles(directory="frontend/build"), name="static")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Vibe Marketing API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
