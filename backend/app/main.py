from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints.health import (
    check_api_health,
    check_database_health,
    check_storage_health,
    check_system_health,
)
from app.db.session import get_db, SessionLocal
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application startup: provision roles and initial super admin
    try:
        with SessionLocal() as db:
            init_db(db)
    except Exception as exc:
        # Avoid crashing app if database is still starting up
        print(f"Database initialization warning on startup: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AuditGenAI: AI-Powered Society Financial Audit and Intelligence Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS for Next.js frontend communication (supporting credentials/cookies)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root redirect → interactive API docs
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


# Root health endpoints (direct access)
@app.get("/health", tags=["Health"], summary="API Health Check")
def root_health():
    """
    Standard lightweight health check endpoint returning API operational status.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
    }


@app.get("/health/db", tags=["Health"], summary="Database Health Check")
def root_db_health(db: Session = Depends(get_db)):
    """
    Direct database connectivity check.
    """
    return check_database_health(db=db)


@app.get("/health/storage", tags=["Health"], summary="Storage Health Check")
def root_storage_health():
    """
    Direct MinIO storage connectivity check.
    """
    return check_storage_health()


@app.get("/health/system", tags=["Health"], summary="Comprehensive System Health Check")
def root_system_health(db: Session = Depends(get_db)):
    """
    Full diagnostic check including FastAPI, PostgreSQL, and MinIO.
    """
    return check_system_health(db=db)


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
