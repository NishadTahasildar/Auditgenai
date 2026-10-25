import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base Application Configuration
    PROJECT_NAME: str = "AuditGenAI API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # PostgreSQL Database Configuration
    POSTGRES_USER: str = "auditgenai"
    POSTGRES_PASSWORD: str = "auditgenai_dev_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "auditgenai_db"
    DATABASE_URL: str | None = None

    # Authentication & Security
    JWT_SECRET_KEY: str = "auditgenai_super_secret_jwt_key_dev_2026_phase2_security"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Initial Super Admin Defaults
    FIRST_SUPERADMIN_EMAIL: str = "admin@auditgenai.com"
    FIRST_SUPERADMIN_PASSWORD: str = "Admin@AuditGen2026"

    # MinIO Object Storage Configuration
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_CONSOLE_PORT: int = 9001
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "auditgenai-documents"
    MINIO_USE_SSL: bool = False

    # AI Configuration Placeholder (Phase 2+)
    OPENAI_API_KEY: str | None = None

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
