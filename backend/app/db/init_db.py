from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.enums import RoleEnum
from app.models.role import Role, UserRole
from app.models.user import User


def init_db(db: Session) -> None:
    """
    Initializes standard roles and provisions the initial Super Administrator if not present.
    """
    # 1. Seed standard roles
    role_descriptions = {
        RoleEnum.SUPER_ADMIN: "System-wide Super Administrator with unrestricted access",
        RoleEnum.SOCIETY_ADMIN: "Society Executive Administrator managing society master data",
        RoleEnum.ACCOUNTANT: "Society Accountant handling ledgers and billing records",
        RoleEnum.AUDITOR: "Independent Financial Auditor reviewing society accounts",
        RoleEnum.RESIDENT: "Society Resident with member-level visibility",
    }

    role_map: dict[RoleEnum, Role] = {}
    for role_enum, description in role_descriptions.items():
        stmt = select(Role).where(Role.name == role_enum)
        role_obj = db.execute(stmt).scalars().first()
        if not role_obj:
            role_obj = Role(name=role_enum, description=description)
            db.add(role_obj)
            db.flush()
        role_map[role_enum] = role_obj

    # 2. Seed initial Super Admin user if configured
    if settings.FIRST_SUPERADMIN_EMAIL:
        stmt = select(User).where(User.email == settings.FIRST_SUPERADMIN_EMAIL)
        admin_user = db.execute(stmt).scalars().first()

        if not admin_user:
            admin_user = User(
                email=settings.FIRST_SUPERADMIN_EMAIL,
                full_name="System Super Administrator",
                password_hash=hash_password(settings.FIRST_SUPERADMIN_PASSWORD),
                is_active=True,
            )
            db.add(admin_user)
            db.flush()

            # Assign system-wide SUPER_ADMIN role (society_id is None)
            super_role = role_map[RoleEnum.SUPER_ADMIN]
            user_role = UserRole(
                user_id=admin_user.id,
                role_id=super_role.id,
                society_id=None,
            )
            db.add(user_role)

    db.commit()
