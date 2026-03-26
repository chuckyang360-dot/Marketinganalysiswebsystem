from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    # Server Configuration
    PORT: int = 8000
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./vibe_marketing.db"

    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None

    # X AI API Configuration
    XAI_API_KEY: Optional[str] = None
    XAI_API_URL: str = "https://api.x.ai/v1"
    XAI_MODEL: Optional[str] = None  # Must be set explicitly via environment variable
    X_ANALYSIS_PROVIDER: str = "mock"  # Options: "mock", "xai"

    # X (Twitter) API Configuration
    X_BEARER_TOKEN: Optional[str] = None  # Bearer token for X API v2

    # Exa API Configuration
    EXA_API_KEY: Optional[str] = None  # API key for Exa.ai neural search

    # Tavily API Configuration
    TAVILY_API_KEY: Optional[str] = None
    TAVILY_API_URL: str = "https://api.tavily.com"

    # Scrape.do API Configuration
    SCRAPE_DO_API_TOKEN: Optional[str] = Field(default=None, env="SCRAPE_DO_API_TOKEN")

    # Banana.dev（Flux 等 GPU 推理部署）
    BANANA_API_KEY: Optional[str] = Field(default=None, env="BANANA_API_KEY")
    BANANA_MODEL_KEY: Optional[str] = Field(default=None, env="BANANA_MODEL_KEY")
    BANANA_API_URL: str = Field(default="https://api.banana.dev/", env="BANANA_API_URL")

    # Google Gemini（图片优化首选；文生图需使用支持 IMAGE 输出的模型 ID）
    GEMINI_API_KEY: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    GEMINI_API_URL: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta",
        env="GEMINI_API_URL",
    )
    GEMINI_IMAGE_MODEL: str = Field(
        default="gemini-2.0-flash-preview-image-generation",
        env="GEMINI_IMAGE_MODEL",
    )

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # Frontend Configuration
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore undefined environment variables (e.g., VITE_*)
    )


settings = Settings()
