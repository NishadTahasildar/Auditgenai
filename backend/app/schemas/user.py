from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import RoleEnum


class UserRoleInfo(BaseModel):
    role: str
    society_id: Optional[int] = None
    society_name: Optional[str] = None

    model_config = {"from_attributes": True}


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plaintext user password")
    role: Optional[RoleEnum] = RoleEnum.RESIDENT
    society_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    roles: List[UserRoleInfo] = []

    model_config = {"from_attributes": True}


class UserMeResponse(UserResponse):
    is_super_admin: bool = False
