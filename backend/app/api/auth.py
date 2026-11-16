from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.core.security import verify_firebase_token
from app.schemas.schemas import UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/verify", response_model=UserProfile)
async def verify_auth_token(user: Dict[str, Any] = Depends(verify_firebase_token)):
    """
    Verifies the client Firebase ID token and returns authenticated user profile.
    """
    return UserProfile(
        uid=user.get("uid", ""),
        email=user.get("email", ""),
        name=user.get("name", "Quality Engineer"),
        is_anonymous=user.get("is_anonymous", False),
        role=user.get("role", "engineer")
    )
