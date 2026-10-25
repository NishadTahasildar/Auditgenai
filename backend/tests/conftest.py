import os
import sys
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import hash_password, create_access_token
from app.models.enums import RoleEnum, ResidentTypeEnum
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.society import Society, SocietyMembership
from app.models.building import Building
from app.models.flat import Flat
from app.models.resident import Resident

# Dedicated SQLite test engine with StaticPool for fast, isolated tests
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed roles
    for role_name in RoleEnum:
        if not session.query(Role).filter_by(name=role_name).first():
            session.add(Role(name=role_name, description=f"{role_name.value} role"))
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def super_admin_user(db: Session) -> User:
    user = User(
        email="superadmin@test.com",
        full_name="Super Admin",
        password_hash=hash_password("SuperSecure123"),
        is_active=True,
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter_by(name=RoleEnum.SUPER_ADMIN).first()
    db.add(UserRole(user_id=user.id, role_id=role.id, society_id=None))
    db.commit()
    return user


@pytest.fixture
def super_admin_headers(super_admin_user: User) -> dict[str, str]:
    token = create_access_token(subject=super_admin_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def society_a(db: Session) -> Society:
    soc = Society(
        name="Green Meadows Society",
        registration_number="REG-GM-101",
        address="100 Nature Way",
        city="Pune",
        state="Maharashtra",
        postal_code="411001",
        is_active=True,
    )
    db.add(soc)
    db.commit()
    return soc


@pytest.fixture
def society_b(db: Session) -> Society:
    soc = Society(
        name="Blue Horizon Towers",
        registration_number="REG-BH-202",
        address="200 Sky Avenue",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400001",
        is_active=True,
    )
    db.add(soc)
    db.commit()
    return soc


@pytest.fixture
def society_admin_a(db: Session, society_a: Society) -> User:
    user = User(
        email="admin_a@test.com",
        full_name="Admin Society A",
        password_hash=hash_password("PasswordA123"),
        is_active=True,
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter_by(name=RoleEnum.SOCIETY_ADMIN).first()
    db.add(SocietyMembership(user_id=user.id, society_id=society_a.id, role_id=role.id, is_active=True))
    db.add(UserRole(user_id=user.id, role_id=role.id, society_id=society_a.id))
    db.commit()
    return user


@pytest.fixture
def society_admin_a_headers(society_admin_a: User) -> dict[str, str]:
    token = create_access_token(subject=society_admin_a.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def resident_a(db: Session, society_a: Society) -> User:
    user = User(
        email="resident_a@test.com",
        full_name="Resident Society A",
        password_hash=hash_password("ResidentPass123"),
        is_active=True,
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter_by(name=RoleEnum.RESIDENT).first()
    db.add(SocietyMembership(user_id=user.id, society_id=society_a.id, role_id=role.id, is_active=True))
    db.commit()
    return user


@pytest.fixture
def resident_a_headers(resident_a: User) -> dict[str, str]:
    token = create_access_token(subject=resident_a.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def building_a(db: Session, society_a: Society) -> Building:
    bld = Building(society_id=society_a.id, name="Tower Alpha")
    db.add(bld)
    db.commit()
    return bld
