from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import RoleEnum


class SocietyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    registration_number: Optional[str] = Field(None, max_length=100)
    address: str = Field(..., min_length=5, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)


class SocietyCreate(SocietyBase):
    pass


class SocietyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    registration_number: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, min_length=5, max_length=500)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=3, max_length=20)
    is_active: Optional[bool] = None


class SocietyResponse(SocietyBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SocietyMembershipCreate(BaseModel):
    user_id: int
    role: RoleEnum = RoleEnum.RESIDENT


class SocietyMembershipResponse(BaseModel):
    id: int
    society_id: int
    user_id: int
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
