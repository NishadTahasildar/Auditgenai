from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    service: str = Field(..., json_schema_extra={"example": "AuditGenAI API"})


class DatabaseHealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    database: str = Field(..., json_schema_extra={"example": "PostgreSQL"})
    connected: bool = Field(..., json_schema_extra={"example": True})
    latency_ms: Optional[float] = Field(None, json_schema_extra={"example": 2.4})
    details: Optional[str] = Field(None, json_schema_extra={"example": "Database connection operational"})


class StorageHealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    storage: str = Field(..., json_schema_extra={"example": "MinIO"})
    connected: bool = Field(..., json_schema_extra={"example": True})
    details: Optional[str] = Field(None, json_schema_extra={"example": "MinIO storage operational"})


class SystemHealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    database: DatabaseHealthResponse
    storage: StorageHealthResponse
