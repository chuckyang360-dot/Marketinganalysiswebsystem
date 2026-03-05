#!/usr/bin/env python3
"""
Vibe Marketing Backend Server
"""

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    from app.main import app

    print(f"Starting Vibe Marketing Backend on port {settings.PORT}")
    print(f"Debug mode: {settings.DEBUG}")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )