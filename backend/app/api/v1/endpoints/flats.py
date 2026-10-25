from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    SocietyPermissionChecker,
    get_current_active_user,
    get_db,
    is_user_super_admin,
)
from app.models.building import Building
from app.models.enums import RoleEnum
from app.models.flat import Flat
from app.models.society import Society, SocietyMembership
from app.models.user import User
from app.schemas.flat import FlatCreate, FlatUpdate, FlatResponse

router = APIRouter()


def get_building_and_verify_permission(
    building_id: int,
    required_roles: list[RoleEnum] | None,
    current_user: User,
    db: Session,
) -> tuple[Building, Society]:
    building = db.get(Building, building_id)
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building with ID {building_id} not found",
        )

    society = db.get(Society, building.society_id)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent society not found",
        )

    # Super admin bypass
    if is_user_super_admin(current_user, db):
        return building, society

    # Query society membership
    stmt = (
        select(SocietyMembership)
        .where(
            SocietyMembership.society_id == society.id,
            SocietyMembership.user_id == current_user.id,
            SocietyMembership.is_active.is_(True),
        )
    )
    memberships = db.execute(stmt).scalars().all()
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Not a member of society {society.id}",
        )

    if required_roles:
        user_roles = [m.role.name for m in memberships]
        if not any(r in required_roles for r in user_roles):
            role_names = ", ".join([r.value for r in required_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {role_names}",
            )

    return building, society


@router.post(
    "/buildings/{building_id}/flats",
    response_model=FlatResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Flat in Building",
    description="Creates a flat/unit in a building. Flat number must be unique within the building. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def create_flat(
    building_id: int,
    flat_in: FlatCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    building, _ = get_building_and_verify_permission(
        building_id=building_id,
        required_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN],
        current_user=current_user,
        db=db,
    )

    # Check for duplicate flat_number within building
    stmt = select(Flat).where(
        Flat.building_id == building_id,
        Flat.flat_number == flat_in.flat_number.strip(),
    )
    existing = db.execute(stmt).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Flat number '{flat_in.flat_number}' already exists in building '{building.name}'.",
        )

    flat = Flat(
        building_id=building_id,
        flat_number=flat_in.flat_number.strip(),
        floor_number=flat_in.floor_number,
        area_sqft=flat_in.area_sqft,
    )
    db.add(flat)
    db.commit()
    db.refresh(flat)
    return flat


@router.get(
    "/buildings/{building_id}/flats",
    response_model=List[FlatResponse],
    summary="List Flats in Building",
    description="Lists all flats in a building. Requires active society membership.",
)
def list_flats(
    building_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    get_building_and_verify_permission(
        building_id=building_id,
        required_roles=None,  # any active society member
        current_user=current_user,
        db=db,
    )

    stmt = (
        select(Flat)
        .where(Flat.building_id == building_id)
        .order_by(Flat.flat_number.asc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


def get_flat_and_verify_permission(
    flat_id: int,
    required_roles: list[RoleEnum] | None,
    current_user: User,
    db: Session,
) -> tuple[Flat, Building, Society]:
    flat = db.get(Flat, flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flat with ID {flat_id} not found",
        )
    building, society = get_building_and_verify_permission(
        building_id=flat.building_id,
        required_roles=required_roles,
        current_user=current_user,
        db=db,
    )
    return flat, building, society


@router.put(
    "/flats/{flat_id}",
    response_model=FlatResponse,
    summary="Update Flat in Building",
    description="Updates flat details. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def update_flat(
    flat_id: int,
    flat_in: FlatUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    flat, building, _ = get_flat_and_verify_permission(
        flat_id=flat_id,
        required_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN],
        current_user=current_user,
        db=db,
    )

    if flat_in.flat_number is not None:
        new_num = flat_in.flat_number.strip()
        stmt = select(Flat).where(
            Flat.building_id == building.id,
            Flat.flat_number == new_num,
            Flat.id != flat_id,
        )
        existing = db.execute(stmt).scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Flat number '{new_num}' already exists in building '{building.name}'.",
            )
        flat.flat_number = new_num

    if flat_in.floor_number is not None:
        flat.floor_number = flat_in.floor_number

    if flat_in.area_sqft is not None:
        flat.area_sqft = flat_in.area_sqft

    db.commit()
    db.refresh(flat)
    return flat


@router.delete(
    "/flats/{flat_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Flat",
    description="Deletes flat and its resident associations. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def delete_flat(
    flat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    flat, _, _ = get_flat_and_verify_permission(
        flat_id=flat_id,
        required_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN],
        current_user=current_user,
        db=db,
    )
    flat_num = flat.flat_number
    db.delete(flat)
    db.commit()
    return {"message": f"Flat '{flat_num}' deleted successfully."}
