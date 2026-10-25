from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FlatBase(BaseModel):
    flat_number: str = Field(..., min_length=1, max_length=50)
    floor_number: Optional[int] = None
    area_sqft: Optional[float] = Field(None, gt=0)


class FlatCreate(FlatBase):
    pass


class FlatUpdate(BaseModel):
    flat_number: Optional[str] = Field(None, min_length=1, max_length=50)
    floor_number: Optional[int] = None
    area_sqft: Optional[float] = Field(None, gt=0)


class FlatResponse(FlatBase):
    id: int
    building_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
