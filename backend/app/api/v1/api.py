from fastapi import APIRouter
from app.api.v1.endpoints import auth, buildings, flats, health, residents, societies, users

api_router = APIRouter()

# Authentication & Users
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Master Data & Society Domain
api_router.include_router(societies.router, prefix="/societies", tags=["Societies"])
api_router.include_router(buildings.router, prefix="", tags=["Buildings"])
api_router.include_router(flats.router, prefix="", tags=["Flats"])
api_router.include_router(residents.router, prefix="", tags=["Residents"])

# Diagnostics & Health
api_router.include_router(health.router, prefix="", tags=["Health"])
