from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.database import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.reports import ReportOut, ReportStatus, ReportUploadResponse
from app.services.report_service import (
    create_report,
    delete_report,
    get_active_report,
    get_report_status,
)
from app.utils.performance_parser import parse_performance_excel


router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/upload", response_model=ReportUploadResponse)
async def upload_report(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ReportUploadResponse:
    report_date, rows, missing_fields = await parse_performance_excel(file)
    report, validation, created = create_report(db, report_date, rows, missing_fields, current_user)
    return ReportUploadResponse(report=report, validation=validation, records_created=created)


@router.get("/active", response_model=ReportOut | None)
def active_report(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReportOut | None:
    return get_active_report(db)


@router.get("/status", response_model=ReportStatus)
def report_status(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReportStatus:
    active_report, total_reports, total_records = get_report_status(db)
    return ReportStatus(
        active_report=active_report,
        total_reports=total_reports,
        total_records=total_records,
    )


@router.delete("/{report_id}", response_model=MessageResponse)
def delete_report_endpoint(
    report_id: UUID,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    delete_report(db, report_id)
    return MessageResponse(message="Report deleted successfully")
