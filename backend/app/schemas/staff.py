import uuid

from pydantic import BaseModel, Field

from app.models.user import UserPosition
from app.schemas.user import UserCreate, UserProfile, UserUpdate


class StaffCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dao_code: str = Field(min_length=2, max_length=64)
    position: UserPosition
    cluster_head_id: uuid.UUID | None = None


class StaffUpdate(UserUpdate):
    pass


class StaffBulkUploadResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]
    users: list[UserProfile]


class ClusterMapping(BaseModel):
    fso_id: uuid.UUID
    cluster_head_id: uuid.UUID


class StaffFilters(BaseModel):
    position: UserPosition | None = None
    cluster_head_id: uuid.UUID | None = None
    is_active: bool | None = None
    search: str | None = None


__all__ = [
    "StaffCreate",
    "StaffUpdate",
    "StaffBulkUploadResult",
    "ClusterMapping",
    "StaffFilters",
    "UserCreate",
]
