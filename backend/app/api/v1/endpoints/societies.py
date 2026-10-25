from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    SocietyPermissionChecker,
    get_current_active_user,
    get_db,
    is_user_super_admin,
    require_super_admin,
)
from app.models.enums import RoleEnum
from app.models.role import Role, UserRole
from app.models.society import Society, SocietyMembership
from app.models.user import User
from app.schemas.society import (
    SocietyCreate,
    SocietyUpdate,
    SocietyMembershipCreate,
    SocietyMembershipResponse,
    SocietyResponse,
)

router = APIRouter()


@router.post(
    "",
    response_model=SocietyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Society",
    description="Registers a new housing society. Restricted to Super Administrators.",
)
def create_society(
    society_in: SocietyCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> Any:
    # If registration_number provided, verify uniqueness
    if society_in.registration_number:
        stmt = select(Society).where(
            Society.registration_number == society_in.registration_number.strip()
        )
        existing = db.execute(stmt).scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Society with registration number '{society_in.registration_number}' already exists.",
            )

    society = Society(
        name=society_in.name.strip(),
        registration_number=society_in.registration_number.strip()
        if society_in.registration_number
        else None,
        address=society_in.address.strip(),
        city=society_in.city.strip(),
        state=society_in.state.strip(),
        postal_code=society_in.postal_code.strip(),
        is_active=True,
    )
    db.add(society)
    db.commit()
    db.refresh(society)
    return society


@router.get(
    "",
    response_model=List[SocietyResponse],
    summary="List Accessible Societies",
    description="Lists societies. Super Admins see all; other roles see societies where they hold an active membership.",
)
def list_societies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    if is_user_super_admin(current_user, db):
        stmt = (
            select(Society)
            .order_by(Society.id.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.execute(stmt).scalars().all()

    # Query societies user is an active member of
    stmt = (
        select(Society)
        .join(SocietyMembership, Society.id == SocietyMembership.society_id)
        .where(
            SocietyMembership.user_id == current_user.id,
            SocietyMembership.is_active.is_(True),
        )
        .distinct()
        .order_by(Society.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


@router.get(
    "/{society_id}",
    response_model=SocietyResponse,
    summary="Get Society by ID",
    description="Retrieves society details if the user has active membership or is a Super Administrator.",
)
def get_society_by_id(
    society_id: int,
    society: Society = Depends(SocietyPermissionChecker()),
) -> Any:
    return society


@router.put(
    "/{society_id}",
    response_model=SocietyResponse,
    summary="Update Society",
    description="Updates housing society details. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def update_society(
    society_id: int,
    society_in: SocietyUpdate,
    society: Society = Depends(
        SocietyPermissionChecker(
            allowed_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN]
        )
    ),
    db: Session = Depends(get_db),
) -> Any:
    # If registration_number provided, verify uniqueness against other societies
    if society_in.registration_number is not None:
        reg = society_in.registration_number.strip()
        if reg:
            stmt = select(Society).where(
                Society.registration_number == reg,
                Society.id != society_id,
            )
            existing = db.execute(stmt).scalars().first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Society with registration number '{reg}' already exists.",
                )
            society.registration_number = reg
        else:
            society.registration_number = None

    if society_in.name is not None:
        society.name = society_in.name.strip()
    if society_in.address is not None:
        society.address = society_in.address.strip()
    if society_in.city is not None:
        society.city = society_in.city.strip()
    if society_in.state is not None:
        society.state = society_in.state.strip()
    if society_in.postal_code is not None:
        society.postal_code = society_in.postal_code.strip()
    if society_in.is_active is not None:
        society.is_active = society_in.is_active

    db.commit()
    db.refresh(society)
    return society


@router.delete(
    "/{society_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Society",
    description="Deletes a housing society and all associated entities. Restricted to Super Administrators.",
)
def delete_society(
    society_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> Any:
    society = db.get(Society, society_id)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Society with ID {society_id} not found",
        )
    society_name = society.name
    db.delete(society)
    db.commit()
    return {"message": f"Society '{society_name}' deleted successfully."}


@router.post(
    "/{society_id}/members",
    response_model=SocietyMembershipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign User to Society with Role",
    description="Assigns a user to the society with a specified role. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def add_society_member(
    society_id: int,
    member_in: SocietyMembershipCreate,
    society: Society = Depends(
        SocietyPermissionChecker(
            allowed_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN]
        )
    ),
    db: Session = Depends(get_db),
) -> Any:
    target_user = db.get(User, member_in.user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {member_in.user_id} not found.",
        )

    # Fetch role
    stmt_role = select(Role).where(Role.name == member_in.role)
    role_obj = db.execute(stmt_role).scalars().first()
    if not role_obj:
        role_obj = Role(
            name=member_in.role, description=f"{member_in.role.value} role"
        )
        db.add(role_obj)
        db.flush()

    # Prevent duplicate active membership for same user, society, and role
    stmt_existing = select(SocietyMembership).where(
        SocietyMembership.society_id == society_id,
        SocietyMembership.user_id == target_user.id,
        SocietyMembership.role_id == role_obj.id,
    )
    existing_mem = db.execute(stmt_existing).scalars().first()
    if existing_mem:
        if not existing_mem.is_active:
            existing_mem.is_active = True
            db.commit()
            db.refresh(existing_mem)
            return SocietyMembershipResponse(
                id=existing_mem.id,
                society_id=existing_mem.society_id,
                user_id=existing_mem.user_id,
                user_full_name=target_user.full_name,
                user_email=target_user.email,
                role=role_obj.name.value,
                is_active=existing_mem.is_active,
                created_at=existing_mem.created_at,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already holds this active role in this society.",
        )

    membership = SocietyMembership(
        society_id=society_id,
        user_id=target_user.id,
        role_id=role_obj.id,
        is_active=True,
    )
    db.add(membership)

    # Also associate in UserRole
    user_role = UserRole(
        user_id=target_user.id,
        role_id=role_obj.id,
        society_id=society_id,
    )
    db.add(user_role)

    db.commit()
    db.refresh(membership)

    return SocietyMembershipResponse(
        id=membership.id,
        society_id=membership.society_id,
        user_id=membership.user_id,
        user_full_name=target_user.full_name,
        user_email=target_user.email,
        role=role_obj.name.value,
        is_active=membership.is_active,
        created_at=membership.created_at,
    )


@router.get(
    "/{society_id}/members",
    response_model=List[SocietyMembershipResponse],
    summary="List Society Members",
    description="Lists all member users and their assigned roles for a society.",
)
def list_society_members(
    society_id: int,
    society: Society = Depends(SocietyPermissionChecker()),
    db: Session = Depends(get_db),
) -> Any:
    stmt = (
        select(SocietyMembership, User, Role)
        .join(User, SocietyMembership.user_id == User.id)
        .join(Role, SocietyMembership.role_id == Role.id)
        .where(
            SocietyMembership.society_id == society_id,
            SocietyMembership.is_active.is_(True),
        )
        .order_by(SocietyMembership.id.asc())
    )
    results = db.execute(stmt).all()

    return [
        SocietyMembershipResponse(
            id=mem.id,
            society_id=mem.society_id,
            user_id=mem.user_id,
            user_full_name=usr.full_name,
            user_email=usr.email,
            role=role.name.value,
            is_active=mem.is_active,
            created_at=mem.created_at,
        )
        for mem, usr, role in results
    ]
