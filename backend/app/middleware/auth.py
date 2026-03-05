from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import User
from ...auth.jwt_handler import verify_token

security = HTTPBearer()


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware to protect routes"""

    async def dispatch(self, request: Request, call_next):
        # Skip authentication for specific routes
        public_paths = [
            "/api/v1/auth/google/login",
            "/api/v1/auth/google/auth-url",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]

        if request.url.path in public_paths:
            return await call_next(request)

        # Get authorization header
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise HTTPException(
                status_code=403,
                detail="Authorization header required"
            )

        try:
            # Extract token from "Bearer <token>"
            token = auth_header.replace("Bearer ", "")
            payload = verify_token(token)
            email = payload.get("sub")

            # Get database session
            db = next(get_db())

            # Get user from database
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

            # Add user to request state
            request.state.user = user

        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )

        return await call_next(request)