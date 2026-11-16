from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "QualityLens"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./qualitylens.db",
        description="PostgreSQL or SQLite fallback connection URL"
    )

    # Firebase
    FIREBASE_PROJECT_ID: str = "quality-lens-c174e"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    DEV_AUTH_BYPASS: bool = True

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "dlvjvskje"
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    CLOUDINARY_UPLOAD_PRESET: str = "Quality lens"

    # Quality Threshold Defaults (%)
    THRESHOLD_NORMAL_MAX: float = 2.0
    THRESHOLD_WARNING_MAX: float = 5.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"

settings = Settings()
