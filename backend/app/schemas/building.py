from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BuildingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class BuildingCreate(BuildingBase):
    pass


class BuildingUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class BuildingResponse(BuildingBase):
    id: int
    society_id: int
    created_at: datetime
    updated_at: datetime
    flats_count: Optional[int] = 0

    model_config = {"from_attributes": True}
