import os
from pydantic_settings import BaseSettings

env_path = os.path.join(os.path.dirname(__file__), ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediMind AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", ""))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 120 minutes (2 hours)

    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "medimind_db")
    
    # LLM Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    
    # Admin Credentials (Env Sourced)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@medimind.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    
    # Medical Disclaimer
    MEDICAL_DISCLAIMER: str = (
        "MediMind AI provides educational information only and is not a substitute "
        "for professional medical advice, diagnosis, or treatment. Always consult a "
        "qualified healthcare provider."
    )

    class Config:
        env_file = env_path
        extra = "ignore"

def validate_required_secrets(settings_obj: Settings):
    if not settings_obj.SECRET_KEY:
        raise RuntimeError(
            "CRITICAL SECURITY ERROR: JWT_SECRET (or SECRET_KEY) environment variable is unset or empty. "
            "Application startup aborted."
        )
    if not settings_obj.ADMIN_PASSWORD:
        raise RuntimeError(
            "CRITICAL SECURITY ERROR: ADMIN_PASSWORD environment variable is unset or empty. "
            "Application startup aborted."
        )

settings = Settings()
validate_required_secrets(settings)

