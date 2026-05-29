import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserPosition


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dao_code: str = Field(min_length=2, max_length=64)
    position: UserPosition
    cluster_head_id: uuid.UUID | None = None


class UserCreate(UserBase):
    email: EmailStr | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    position: UserPosition | None = None
    cluster_head_id: uuid.UUID | None = None
    is_active: bool | None = None


class OwnProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    dao_code: str
    email: EmailStr | None
    position: UserPosition
    is_active: bool
    is_first_login: bool
    cluster_head_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
