from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Flat(Base):
    __tablename__ = "flats"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building_id = Column(
        Integer,
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    flat_number = Column(String(50), nullable=False)
    floor_number = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=True)
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
            "building_id",
            "flat_number",
            name="uq_building_flat_number",
        ),
    )

    # Relationships
    building = relationship("Building", back_populates="flats")
    flat_residents = relationship(
        "FlatResident",
        back_populates="flat",
        cascade="all, delete-orphan",
    )
