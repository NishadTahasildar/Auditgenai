from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import ResidentTypeEnum


class ResidentBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    user_id: Optional[int] = None


class ResidentCreate(ResidentBase):
    pass


class ResidentUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None


class ResidentResponse(ResidentBase):
    id: int
    society_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FlatResidentCreate(BaseModel):
    resident_id: int
    resident_type: ResidentTypeEnum = ResidentTypeEnum.OWNER
    is_primary: bool = False
    start_date: Optional[date] = None


class FlatResidentResponse(BaseModel):
    id: int
    flat_id: int
    resident_id: int
    resident_name: Optional[str] = None
    resident_type: str
    is_primary: bool
    start_date: date
    end_date: Optional[date] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
