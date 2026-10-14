import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "HealthMate AI"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    DATABASE_NAME: str = "(default)"
    CLINICAL_GUARDRAIL_STRICT: bool = True

settings = Settings()
