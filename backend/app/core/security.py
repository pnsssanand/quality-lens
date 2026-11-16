import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin if credentials are supplied
_firebase_initialized = False

def initialize_firebase_admin():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials
        
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with service account certificate.")
        elif not firebase_admin._apps:
            # Initialize with project default or application credentials
            try:
                firebase_admin.initialize_app()
                _firebase_initialized = True
                logger.info("Firebase Admin initialized with default credentials.")
            except Exception as e:
                logger.warning(f"Firebase Admin default init failed: {e}. Dev fallback active.")
    except Exception as e:
        logger.warning(f"Could not initialize Firebase Admin SDK: {e}. Dev fallback will be used.")

initialize_firebase_admin()

async def verify_firebase_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Verifies the Firebase ID token passed in the Authorization header:
    Bearer <token>
    Returns user dict with uid, email, etc.
    """
    if not authorization:
        if settings.DEV_AUTH_BYPASS:
            return {
                "uid": "dev-user-demo-123",
                "email": "quality.engineer@example.com",
                "name": "Quality Engineer Demo",
                "is_anonymous": False,
                "role": "engineer"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be Bearer <token>"
        )
    
    token = parts[1]
    
    # Try Firebase Admin verification
    try:
        import firebase_admin
        from firebase_admin import auth
        if firebase_admin._apps:
            decoded_token = auth.verify_id_token(token)
            return {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email", ""),
                "name": decoded_token.get("name", "Quality User"),
                "is_anonymous": decoded_token.get("is_anonymous", False),
                "claims": decoded_token
            }
    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        if settings.DEV_AUTH_BYPASS:
            # If in dev mode and token is a demo token
            return {
                "uid": "dev-user-demo-123",
                "email": "quality.engineer@example.com",
                "name": "Quality Engineer Demo",
                "is_anonymous": False,
                "role": "engineer"
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )
    
    if settings.DEV_AUTH_BYPASS:
        return {
            "uid": "dev-user-demo-123",
            "email": "quality.engineer@example.com",
            "name": "Quality Engineer Demo",
            "is_anonymous": False,
            "role": "engineer"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Firebase verification service unavailable"
    )
