from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.enums import RoleEnum
from app.models.role import Role, UserRole
from app.models.society import Society, SocietyMembership
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_token_from_request(
    request: Request,
    header_token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[str]:
    """
    Extracts access token from Authorization header or from HttpOnly cookie.
    """
    if header_token:
        return header_token
    # Fallback to cookie
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        if cookie_token.startswith("Bearer "):
            return cookie_token.split(" ", 1)[1]
        return cookie_token
    return None


def get_current_user(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates token and returns current authenticated user.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Verifies that the current user account is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user


def is_user_super_admin(user: User, db: Session) -> bool:
    """
    Checks if a user holds the system-wide SUPER_ADMIN role.
    """
    stmt = (
        select(UserRole)
        .join(Role, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == user.id,
            Role.name == RoleEnum.SUPER_ADMIN,
        )
    )
    result = db.execute(stmt).scalars().first()
    return result is not None


def require_super_admin(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> User:
    """
    Restricts access strictly to users with the SUPER_ADMIN role.
    """
    if not is_user_super_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super administrator privileges required",
        )
    return current_user


class SocietyPermissionChecker:
    """
    Reusable dependency to enforce society-level data isolation and role permissions.
    """

    def __init__(self, allowed_roles: Optional[List[RoleEnum]] = None):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        society_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db),
    ) -> Society:
        # Verify society exists
        society = db.get(Society, society_id)
        if not society:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Society with ID {society_id} not found",
            )

        # Super Admin has global access to all societies
        if is_user_super_admin(current_user, db):
            return society

        # Query active society membership for current user
        stmt = (
            select(SocietyMembership)
            .join(Role, SocietyMembership.role_id == Role.id)
            .where(
                SocietyMembership.society_id == society_id,
                SocietyMembership.user_id == current_user.id,
                SocietyMembership.is_active.is_(True),
            )
        )
        memberships = db.execute(stmt).scalars().all()

        if not memberships:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not an active member of society {society_id}",
            )

        # If specific roles are required, verify user has at least one of them
        if self.allowed_roles:
            user_society_roles = [m.role.name for m in memberships]
            has_role = any(r in self.allowed_roles for r in user_society_roles)
            if not has_role:
                allowed_str = ", ".join([r.value for r in self.allowed_roles])
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions for this society. Required: {allowed_str}",
                )

        return society
