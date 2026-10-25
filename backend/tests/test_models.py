import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.society import Society, SocietyMembership
from app.models.building import Building
from app.models.flat import Flat
from app.models.role import Role
from app.models.enums import RoleEnum
from app.core.security import hash_password


def test_user_email_uniqueness_constraint(db):
    u1 = User(
        email="unique@test.com",
        full_name="User One",
        password_hash=hash_password("Pass1"),
        is_active=True,
    )
    db.add(u1)
    db.commit()

    u2 = User(
        email="unique@test.com",
        full_name="User Two",
        password_hash=hash_password("Pass2"),
        is_active=True,
    )
    db.add(u2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_flat_number_unique_within_same_building(db, building_a):
    f1 = Flat(building_id=building_a.id, flat_number="101", floor_number=1, area_sqft=850.0)
    db.add(f1)
    db.commit()

    # Attempt duplicate flat_number in the same building
    f2 = Flat(building_id=building_a.id, flat_number="101", floor_number=2, area_sqft=900.0)
    db.add(f2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_same_flat_number_allowed_in_different_buildings(db, society_a, building_a):
    # Create building B in society A
    building_b = Building(society_id=society_a.id, name="Tower Beta")
    db.add(building_b)
    db.commit()

    f1 = Flat(building_id=building_a.id, flat_number="201", floor_number=2)
    f2 = Flat(building_id=building_b.id, flat_number="201", floor_number=2)
    db.add_all([f1, f2])
    db.commit()

    assert f1.id is not None
    assert f2.id is not None
    assert f1.flat_number == f2.flat_number
    assert f1.building_id != f2.building_id


def test_building_name_unique_within_same_society(db, society_a):
    b1 = Building(society_id=society_a.id, name="Wing A")
    db.add(b1)
    db.commit()

    b2 = Building(society_id=society_a.id, name="Wing A")
    db.add(b2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_society_membership_unique_role_constraint(db, society_a):
    user = User(
        email="membership_test@test.com",
        full_name="Member Test",
        password_hash=hash_password("Pass"),
        is_active=True,
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter_by(name=RoleEnum.ACCOUNTANT).first()

    m1 = SocietyMembership(user_id=user.id, society_id=society_a.id, role_id=role.id, is_active=True)
    db.add(m1)
    db.commit()

    m2 = SocietyMembership(user_id=user.id, society_id=society_a.id, role_id=role.id, is_active=True)
    db.add(m2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
