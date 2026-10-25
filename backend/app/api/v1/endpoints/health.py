import time
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from minio import Minio

from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import (
    HealthResponse,
    DatabaseHealthResponse,
    StorageHealthResponse,
    SystemHealthResponse,
)

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Basic API Health Check",
    tags=["Health"],
)
def check_api_health() -> HealthResponse:
    """
    Standard lightweight health check endpoint returning API operational status.
    """
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
    )


@router.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    summary="Database Connectivity Health Check",
    tags=["Health"],
)
def check_database_health(db: Session = Depends(get_db)):
    """
    Verifies that FastAPI can establish a connection to PostgreSQL
    and execute a basic query (SELECT 1).
    """
    start_time = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        latency = (time.perf_counter() - start_time) * 1000
        return DatabaseHealthResponse(
            status="healthy",
            database="PostgreSQL",
            connected=True,
            latency_ms=round(latency, 2),
            details="Successfully connected to PostgreSQL database",
        )
    except Exception as exc:
        latency = (time.perf_counter() - start_time) * 1000
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=DatabaseHealthResponse(
                status="unhealthy",
                database="PostgreSQL",
                connected=False,
                latency_ms=round(latency, 2),
                details=f"PostgreSQL connection failure: {str(exc)}",
            ).model_dump(),
        )


@router.get(
    "/health/storage",
    response_model=StorageHealthResponse,
    summary="MinIO Storage Connectivity Health Check",
    tags=["Health"],
)
def check_storage_health():
    """
    Verifies that FastAPI can reach the MinIO object storage service.
    """
    try:
        client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL,
        )
        # Attempt to list buckets to verify credentials and connectivity
        client.list_buckets()
        return StorageHealthResponse(
            status="healthy",
            storage="MinIO",
            connected=True,
            details=f"Connected to MinIO at {settings.MINIO_ENDPOINT}",
        )
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=StorageHealthResponse(
                status="unhealthy",
                storage="MinIO",
                connected=False,
                details=f"MinIO storage unreachable: {str(exc)}",
            ).model_dump(),
        )


@router.get(
    "/health/system",
    response_model=SystemHealthResponse,
    summary="Combined System Health Check",
    tags=["Health"],
)
def check_system_health(db: Session = Depends(get_db)):
    """
    Full diagnostic endpoint reporting the status of FastAPI, PostgreSQL, and MinIO.
    """
    db_res = check_database_health(db=db)
    if isinstance(db_res, JSONResponse):
        db_health = DatabaseHealthResponse(**db_res.body)  # type: ignore
    else:
        db_health = db_res

    minio_res = check_storage_health()
    if isinstance(minio_res, JSONResponse):
        minio_health = StorageHealthResponse(**minio_res.body)  # type: ignore
    else:
        minio_health = minio_res

    is_healthy = db_health.connected and minio_health.connected

    response_data = SystemHealthResponse(
        status="healthy" if is_healthy else "degraded",
        service=settings.PROJECT_NAME,
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        database=db_health,
        storage=minio_health,
    )

    if not is_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response_data.model_dump(),
        )
    return response_data
