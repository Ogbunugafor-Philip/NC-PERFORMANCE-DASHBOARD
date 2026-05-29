from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database import get_db
from app.models.user import User, UserPosition
from app.schemas.auth import MessageResponse
from app.schemas.staff import ClusterMapping, StaffBulkUploadResult, StaffCreate, StaffUpdate
from app.schemas.user import UserProfile
from app.services.staff_service import (
    assign_cluster_head,
    create_staff,
    create_staff_from_rows,
    delete_staff,
    list_staff,
    update_staff,
)
from app.utils.excel_parser import parse_staff_excel


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/staff", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def create_staff_endpoint(
    payload: StaffCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    return create_staff(db, payload)


@router.post("/staff/bulk", response_model=StaffBulkUploadResult)
async def bulk_upload_staff(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StaffBulkUploadResult:
    rows = await parse_staff_excel(file)
    created, errors = create_staff_from_rows(db, rows)
    return StaffBulkUploadResult(
        created=len(created),
        skipped=len(errors),
        errors=errors,
        users=created,
    )


@router.put("/staff/{staff_id}", response_model=UserProfile)
def update_staff_endpoint(
    staff_id: UUID,
    payload: StaffUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    return update_staff(db, staff_id, payload)


@router.delete("/staff/{staff_id}", response_model=MessageResponse)
def delete_staff_endpoint(
    staff_id: UUID,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    delete_staff(db, staff_id)
    return MessageResponse(message="Staff deleted successfully")


@router.get("/staff", response_model=list[UserProfile])
def list_staff_endpoint(
    position: UserPosition | None = Query(default=None),
    cluster_head_id: UUID | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[User]:
    return list_staff(db, position, cluster_head_id, is_active, search)


@router.post("/staff/map-cluster", response_model=UserProfile)
def map_cluster(
    payload: ClusterMapping,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    return assign_cluster_head(db, payload)


@router.get("/users", response_model=list[UserProfile])
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[User]:
    return list_staff(db)
