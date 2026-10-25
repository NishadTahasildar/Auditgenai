from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Society(Base):
    __tablename__ = "societies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    registration_number = Column(String(100), unique=True, nullable=True, index=True)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    buildings = relationship(
        "Building",
        back_populates="society",
        cascade="all, delete-orphan",
    )
    memberships = relationship(
        "SocietyMembership",
        back_populates="society",
        cascade="all, delete-orphan",
    )
    residents = relationship(
        "Resident",
        back_populates="society",
        cascade="all, delete-orphan",
    )
    user_roles = relationship(
        "UserRole",
        back_populates="society",
        cascade="all, delete-orphan",
    )


class SocietyMembership(Base):
    __tablename__ = "society_memberships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    society_id = Column(
        Integer,
        ForeignKey("societies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id = Column(
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "society_id",
            "role_id",
            name="uq_user_society_role_membership",
        ),
    )

    # Relationships
    user = relationship("User", back_populates="society_memberships")
    society = relationship("Society", back_populates="memberships")
    role = relationship("Role", back_populates="society_memberships")
