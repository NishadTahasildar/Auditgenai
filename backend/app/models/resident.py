from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import ResidentTypeEnum


class Resident(Base):
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    society_id = Column(
        Integer,
        ForeignKey("societies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True, index=True)
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
    society = relationship("Society", back_populates="residents")
    user = relationship("User", back_populates="residents")
    flat_associations = relationship(
        "FlatResident",
        back_populates="resident",
        cascade="all, delete-orphan",
    )


class FlatResident(Base):
    __tablename__ = "flat_residents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flat_id = Column(
        Integer,
        ForeignKey("flats.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resident_id = Column(
        Integer,
        ForeignKey("residents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resident_type = Column(
        SAEnum(ResidentTypeEnum, name="resident_type_enum"),
        default=ResidentTypeEnum.OWNER,
        nullable=False,
    )
    is_primary = Column(Boolean, default=False, nullable=False)
    start_date = Column(Date, nullable=False, server_default=func.current_date())
    end_date = Column(Date, nullable=True)
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
    flat = relationship("Flat", back_populates="flat_residents")
    resident = relationship("Resident", back_populates="flat_associations")
