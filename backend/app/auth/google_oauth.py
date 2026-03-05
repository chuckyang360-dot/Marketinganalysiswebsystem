from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.orm import Session

from ..models import User
from ..config import settings
from .jwt_handler import create_access_token


async def verify_google_token(id_token_str: str) -> dict:
    """Verify Google ID token and return user info"""
    try:
        # Verify the token against Google's public keys
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # Get user info from token
        user_info = {
            "google_id": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture")
        }

        return user_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )


async def authenticate_or_create_user(user_info: dict, db: Session) -> User:
    """Authenticate existing user or create new one"""
    # Check if user exists by Google ID
    user = db.query(User).filter(User.google_id == user_info["google_id"]).first()

    if not user:
        # Check if user exists by email (in case they changed Google account)
        user = db.query(User).filter(User.email == user_info["email"]).first()
        if user:
            # Update user's Google ID
            user.google_id = user_info["google_id"]
            user.name = user_info["name"]
            user.picture = user_info.get("picture")
        else:
            # Create new user
            user = User(
                google_id=user_info["google_id"],
                email=user_info["email"],
                name=user_info["name"],
                picture=user_info.get("picture")
            )
            db.add(user)

        db.commit()
        db.refresh(user)

    return user


async def login_with_google(id_token_str: str, db: Session) -> dict:
    """Login user with Google OAuth token"""
    # Verify Google token
    user_info = await verify_google_token(id_token_str)

    # Get or create user
    user = await authenticate_or_create_user(user_info, db)

    # Create JWT token
    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
