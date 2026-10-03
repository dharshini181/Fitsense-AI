from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "FitSense AI 2.0 Backend"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./fitsense.db"
    JWT_SECRET: str = "super-secret-fitsense-key"
    REFRESH_TOKEN_SECRET: str = "super-secret-refresh-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    WEATHER_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    CORS_ORIGINS: str = ""  # comma-separated extra allowed origins for production

    class Config:
        env_file = ".env"


settings = Settings()
