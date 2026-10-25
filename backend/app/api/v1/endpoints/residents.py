from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
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
from app.models.resident import FlatResident, Resident
from app.models.society import Society, SocietyMembership
from app.models.user import User
from app.schemas.resident import (
    FlatResidentCreate,
    FlatResidentResponse,
    ResidentCreate,
    ResidentUpdate,
    ResidentResponse,
)

router = APIRouter()


@router.post(
    "/societies/{society_id}/residents",
    response_model=ResidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Resident in Society",
    description="Registers a resident record within the society. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def create_resident(
    society_id: int,
    resident_in: ResidentCreate,
    society: Society = Depends(
        SocietyPermissionChecker(
            allowed_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN]
        )
    ),
    db: Session = Depends(get_db),
) -> Any:
    # If user_id is provided, verify it exists
    if resident_in.user_id:
        user = db.get(User, resident_in.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {resident_in.user_id} not found.",
            )

    resident = Resident(
        society_id=society_id,
        user_id=resident_in.user_id,
        full_name=resident_in.full_name.strip(),
        phone_number=resident_in.phone_number.strip()
        if resident_in.phone_number
        else None,
        email=resident_in.email.lower().strip()
        if resident_in.email
        else None,
    )
    db.add(resident)
    db.commit()
    db.refresh(resident)
    return resident


@router.get(
    "/societies/{society_id}/residents",
    response_model=List[ResidentResponse],
    summary="List Residents in Society",
    description="Lists all resident records in a society. Requires active society membership.",
)
def list_residents(
    society_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    society: Society = Depends(SocietyPermissionChecker()),
    db: Session = Depends(get_db),
) -> Any:
    stmt = (
        select(Resident)
        .where(Resident.society_id == society_id)
        .order_by(Resident.full_name.asc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


def get_resident_and_verify_permission(
    resident_id: int,
    required_roles: list[RoleEnum] | None,
    current_user: User,
    db: Session,
) -> tuple[Resident, Society]:
    resident = db.get(Resident, resident_id)
    if not resident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resident with ID {resident_id} not found",
        )
    society = db.get(Society, resident.society_id)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent society not found",
        )
    if is_user_super_admin(current_user, db):
        return resident, society

    stmt = select(SocietyMembership).where(
        SocietyMembership.society_id == society.id,
        SocietyMembership.user_id == current_user.id,
        SocietyMembership.is_active.is_(True),
    )
    memberships = db.execute(stmt).scalars().all()
    user_roles = [m.role.name for m in memberships]
    if required_roles and not any(r in required_roles for r in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to manage residents in this society",
        )
    return resident, society


@router.put(
    "/residents/{resident_id}",
    response_model=ResidentResponse,
    summary="Update Resident in Society",
    description="Updates resident details. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def update_resident(
    resident_id: int,
    resident_in: ResidentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    resident, _ = get_resident_and_verify_permission(
        resident_id=resident_id,
        required_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN],
        current_user=current_user,
        db=db,
    )

    if resident_in.full_name is not None:
        resident.full_name = resident_in.full_name.strip()
    if resident_in.phone_number is not None:
        resident.phone_number = resident_in.phone_number.strip() or None
    if resident_in.email is not None:
        resident.email = resident_in.email.lower().strip() or None

    db.commit()
    db.refresh(resident)
    return resident


@router.delete(
    "/residents/{resident_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Resident",
    description="Deletes resident and associated flat associations. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def delete_resident(
    resident_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    resident, _ = get_resident_and_verify_permission(
        resident_id=resident_id,
        required_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN],
        current_user=current_user,
        db=db,
    )
    name = resident.full_name
    db.delete(resident)
    db.commit()
    return {"message": f"Resident '{name}' deleted successfully."}


@router.post(
    "/flats/{flat_id}/residents",
    response_model=FlatResidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Associate Resident with Flat",
    description="Links a resident to a specific flat (as Owner, Tenant, etc.). Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def associate_flat_resident(
    flat_id: int,
    assoc_in: FlatResidentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    flat = db.get(Flat, flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flat with ID {flat_id} not found",
        )

    building = db.get(Building, flat.building_id)
    society_id = building.society_id if building else 0

    # Verify authorization
    if not is_user_super_admin(current_user, db):
        stmt_mem = select(SocietyMembership).where(
            SocietyMembership.society_id == society_id,
            SocietyMembership.user_id == current_user.id,
            SocietyMembership.is_active.is_(True),
        )
        memberships = db.execute(stmt_mem).scalars().all()
        user_roles = [m.role.name for m in memberships]
        if RoleEnum.SOCIETY_ADMIN not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="SOCIETY_ADMIN permission required to link residents to flats",
            )

    resident = db.get(Resident, assoc_in.resident_id)
    if not resident or resident.society_id != society_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resident {assoc_in.resident_id} does not belong to this society",
        )

    flat_resident = FlatResident(
        flat_id=flat_id,
        resident_id=assoc_in.resident_id,
        resident_type=assoc_in.resident_type,
        is_primary=assoc_in.is_primary,
        start_date=assoc_in.start_date
        if assoc_in.start_date
        else func.current_date(),
        is_active=True,
    )
    db.add(flat_resident)
    db.commit()
    db.refresh(flat_resident)

    return FlatResidentResponse(
        id=flat_resident.id,
        flat_id=flat_resident.flat_id,
        resident_id=flat_resident.resident_id,
        resident_name=resident.full_name,
        resident_type=flat_resident.resident_type.value,
        is_primary=flat_resident.is_primary,
        start_date=flat_resident.start_date,
        end_date=flat_resident.end_date,
        is_active=flat_resident.is_active,
        created_at=flat_resident.created_at,
    )


@router.get(
    "/flats/{flat_id}/residents",
    response_model=List[FlatResidentResponse],
    summary="List Residents Associated with Flat",
    description="Lists residents associated with a specific flat. Requires active society membership.",
)
def list_flat_residents(
    flat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    flat = db.get(Flat, flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flat with ID {flat_id} not found",
        )

    building = db.get(Building, flat.building_id)
    society_id = building.society_id if building else 0

    # Check society membership or super admin
    if not is_user_super_admin(current_user, db):
        stmt_mem = select(SocietyMembership).where(
            SocietyMembership.society_id == society_id,
            SocietyMembership.user_id == current_user.id,
            SocietyMembership.is_active.is_(True),
        )
        membership = db.execute(stmt_mem).scalars().first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access records for this flat",
            )

    stmt = (
        select(FlatResident, Resident)
        .join(Resident, FlatResident.resident_id == Resident.id)
        .where(
            FlatResident.flat_id == flat_id,
            FlatResident.is_active.is_(True),
        )
        .order_by(FlatResident.is_primary.desc(), FlatResident.start_date.desc())
    )
    results = db.execute(stmt).all()

    return [
        FlatResidentResponse(
            id=fr.id,
            flat_id=fr.flat_id,
            resident_id=fr.resident_id,
            resident_name=r.full_name,
            resident_type=fr.resident_type.value,
            is_primary=fr.is_primary,
            start_date=fr.start_date,
            end_date=fr.end_date,
            is_active=fr.is_active,
            created_at=fr.created_at,
        )
        for fr, r in results
    ]
