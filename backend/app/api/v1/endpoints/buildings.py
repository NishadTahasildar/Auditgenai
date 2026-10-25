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
from app.models.society import Society, SocietyMembership
from app.models.user import User
from app.schemas.building import BuildingCreate, BuildingUpdate, BuildingResponse

router = APIRouter()


def verify_building_admin_permission(
    building_id: int,
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
    if is_user_super_admin(current_user, db):
        return building, society

    stmt = select(SocietyMembership).where(
        SocietyMembership.society_id == society.id,
        SocietyMembership.user_id == current_user.id,
        SocietyMembership.is_active.is_(True),
    )
    memberships = db.execute(stmt).scalars().all()
    user_roles = [m.role.name for m in memberships]
    if RoleEnum.SOCIETY_ADMIN not in user_roles and RoleEnum.SUPER_ADMIN not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SOCIETY_ADMIN permission required for this operation",
        )
    return building, society


@router.post(
    "/societies/{society_id}/buildings",
    response_model=BuildingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Building in Society",
    description="Adds a building/wing to the housing society. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def create_building(
    society_id: int,
    building_in: BuildingCreate,
    society: Society = Depends(
        SocietyPermissionChecker(
            allowed_roles=[RoleEnum.SOCIETY_ADMIN, RoleEnum.SUPER_ADMIN]
        )
    ),
    db: Session = Depends(get_db),
) -> Any:
    # Verify uniqueness of building name within this society
    stmt = select(Building).where(
        Building.society_id == society_id,
        Building.name == building_in.name.strip(),
    )
    existing = db.execute(stmt).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Building '{building_in.name}' already exists in society {society.name}.",
        )

    building = Building(
        society_id=society_id,
        name=building_in.name.strip(),
    )
    db.add(building)
    db.commit()
    db.refresh(building)

    return BuildingResponse(
        id=building.id,
        society_id=building.society_id,
        name=building.name,
        created_at=building.created_at,
        updated_at=building.updated_at,
        flats_count=0,
    )


@router.get(
    "/societies/{society_id}/buildings",
    response_model=List[BuildingResponse],
    summary="List Buildings in Society",
    description="Lists all buildings for a society. Requires active society membership.",
)
def list_buildings(
    society_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    society: Society = Depends(SocietyPermissionChecker()),
    db: Session = Depends(get_db),
) -> Any:
    # Query buildings with flat count
    stmt = (
        select(
            Building,
            func.count(Flat.id).label("flats_count"),
        )
        .outerjoin(Flat, Building.id == Flat.building_id)
        .where(Building.society_id == society_id)
        .group_by(Building.id)
        .order_by(Building.name.asc())
        .offset(skip)
        .limit(limit)
    )
    results = db.execute(stmt).all()

    return [
        BuildingResponse(
            id=b.id,
            society_id=b.society_id,
            name=b.name,
            created_at=b.created_at,
            updated_at=b.updated_at,
            flats_count=flats_cnt,
        )
        for b, flats_cnt in results
    ]


@router.put(
    "/buildings/{building_id}",
    response_model=BuildingResponse,
    summary="Update Building",
    description="Updates building name. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def update_building(
    building_id: int,
    building_in: BuildingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    building, society = verify_building_admin_permission(building_id, current_user, db)
    if building_in.name is not None:
        new_name = building_in.name.strip()
        stmt = select(Building).where(
            Building.society_id == society.id,
            Building.name == new_name,
            Building.id != building_id,
        )
        existing = db.execute(stmt).scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Building '{new_name}' already exists in society {society.name}.",
            )
        building.name = new_name

    db.commit()
    db.refresh(building)

    flats_count = db.execute(
        select(func.count(Flat.id)).where(Flat.building_id == building.id)
    ).scalar_one()

    return BuildingResponse(
        id=building.id,
        society_id=building.society_id,
        name=building.name,
        created_at=building.created_at,
        updated_at=building.updated_at,
        flats_count=flats_count,
    )


@router.delete(
    "/buildings/{building_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Building",
    description="Deletes building and all associated flats. Requires SOCIETY_ADMIN or SUPER_ADMIN.",
)
def delete_building(
    building_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    building, _ = verify_building_admin_permission(building_id, current_user, db)
    building_name = building.name
    db.delete(building)
    db.commit()
    return {"message": f"Building '{building_name}' deleted successfully."}
