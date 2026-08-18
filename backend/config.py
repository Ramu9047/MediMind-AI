import os
from pydantic_settings import BaseSettings

env_path = os.path.join(os.path.dirname(__file__), ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediMind AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "medimind-super-secret-jwt-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "medimind_db")
    
    # LLM Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    
    # Admin Credentials (Env Sourced)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@medimind.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "SecuRe#Admin$9824!MediMind")
    
    # Medical Disclaimer
    MEDICAL_DISCLAIMER: str = (
        "MediMind AI provides educational information only and is not a substitute "
        "for professional medical advice, diagnosis, or treatment. Always consult a "
        "qualified healthcare provider."
    )

    class Config:
        env_file = env_path
        extra = "ignore"

settings = Settings()
