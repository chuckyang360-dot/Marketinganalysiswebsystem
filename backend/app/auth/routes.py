from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import urllib.parse

from ..database import get_db
from ..schemas import GoogleAuthRequest, Token, UserResponse, GoogleAuthUrlResponse
from ..config import settings
from .google_oauth import login_with_google
from .jwt_handler import create_access_token

router = APIRouter()


@router.post("/google/login", response_model=Token)
async def google_login(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Login with Google OAuth token"""
    try:
        result = await login_with_google(request.id_token, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/google/auth-url", response_model=GoogleAuthUrlResponse)
async def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    auth_url_params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
    }

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"&".join([f"{k}={urllib.parse.quote(str(v))}" for k, v in auth_url_params.items()])
    )

    return GoogleAuthUrlResponse(url=auth_url)