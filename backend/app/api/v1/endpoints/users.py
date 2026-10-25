from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.api.v1.endpoints.auth import get_current_user_profile
from app.models.user import User
from app.schemas.user import UserMeResponse

router = APIRouter()


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get Current User (Users resource)",
    description="Returns detailed profile information, roles, and society associations for the authenticated user.",
)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    return get_current_user_profile(current_user=current_user, db=db)
