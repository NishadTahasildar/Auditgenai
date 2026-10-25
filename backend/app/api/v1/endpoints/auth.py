from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, is_user_super_admin
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import RoleEnum
from app.models.role import Role, UserRole
from app.models.society import Society, SocietyMembership
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserMeResponse, UserResponse, UserRoleInfo

router = APIRouter()


@router.post(
    "/login",
    response_model=Token,
    summary="User Login",
    description="Authenticates with email and password, returning a JWT bearer token and setting an HttpOnly cookie.",
)
def login(
    login_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
) -> Any:
    # 1. Lookup user by email
    stmt = select(User).where(User.email == login_data.email.lower().strip())
    user = db.execute(stmt).scalars().first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Verify account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact the administrator.",
        )

    # 3. Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email},
        expires_delta=access_token_expires,
    )

    # 4. Set secure HttpOnly cookie for web client
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=not settings.DEBUG,  # True in production HTTPS
    )

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/logout",
    summary="User Logout",
    description="Clears authentication cookie.",
)
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get Current User Profile",
    description="Returns profile information, roles, and society associations for the authenticated user.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    # Gather roles
    roles_info: list[UserRoleInfo] = []

    # 1. System-wide user roles
    stmt_roles = (
        select(UserRole, Role, Society)
        .join(Role, UserRole.role_id == Role.id)
        .outerjoin(Society, UserRole.society_id == Society.id)
        .where(UserRole.user_id == current_user.id)
    )
    for ur, role, soc in db.execute(stmt_roles).all():
        roles_info.append(
            UserRoleInfo(
                role=role.name.value,
                society_id=ur.society_id,
                society_name=soc.name if soc else None,
            )
        )

    # 2. Society memberships
    stmt_memberships = (
        select(SocietyMembership, Role, Society)
        .join(Role, SocietyMembership.role_id == Role.id)
        .join(Society, SocietyMembership.society_id == Society.id)
        .where(
            SocietyMembership.user_id == current_user.id,
            SocietyMembership.is_active.is_(True),
        )
    )
    for sm, role, soc in db.execute(stmt_memberships).all():
        # Avoid duplicate entries if already in user_roles
        exists = any(
            r.role == role.name.value and r.society_id == sm.society_id
            for r in roles_info
        )
        if not exists:
            roles_info.append(
                UserRoleInfo(
                    role=role.name.value,
                    society_id=sm.society_id,
                    society_name=soc.name,
                )
            )

    is_super = is_user_super_admin(current_user, db)

    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        roles=roles_info,
        is_super_admin=is_super,
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register / Create User Account",
    description="Provisions a new user account with hashed password.",
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    # Check if email is already taken
    stmt = select(User).where(User.email == user_in.email.lower().strip())
    existing = db.execute(stmt).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    new_user = User(
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name.strip(),
        password_hash=hash_password(user_in.password),
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # Assign role if requested
    role_to_assign = user_in.role or RoleEnum.RESIDENT
    stmt_role = select(Role).where(Role.name == role_to_assign)
    role_obj = db.execute(stmt_role).scalars().first()

    if not role_obj:
        # Fallback create role if missing
        role_obj = Role(name=role_to_assign, description=f"{role_to_assign.value} role")
        db.add(role_obj)
        db.flush()

    if user_in.society_id:
        society = db.get(Society, user_in.society_id)
        if not society:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Society with ID {user_in.society_id} does not exist.",
            )
        # Create membership
        membership = SocietyMembership(
            user_id=new_user.id,
            society_id=society.id,
            role_id=role_obj.id,
            is_active=True,
        )
        db.add(membership)

        # Also add to UserRole
        user_role = UserRole(
            user_id=new_user.id,
            role_id=role_obj.id,
            society_id=society.id,
        )
        db.add(user_role)
    else:
        # Global role (e.g. system resident or super admin)
        user_role = UserRole(
            user_id=new_user.id,
            role_id=role_obj.id,
            society_id=None,
        )
        db.add(user_role)

    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        roles=[
            UserRoleInfo(
                role=role_to_assign.value,
                society_id=user_in.society_id,
            )
        ],
    )
