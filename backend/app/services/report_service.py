from collections import Counter
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.report import PerformanceData, Report
from app.models.user import User, UserPosition
from app.schemas.reports import UploadValidation
from app.utils.excel_parser import normalize_dao_code


def validate_rows(db: Session, rows: list[dict]) -> tuple[UploadValidation, dict[str, User]]:
    dao_codes = [normalize_dao_code(row["dao_code"]) for row in rows if row.get("dao_code")]
    counts = Counter(dao_codes)
    duplicate_dao_codes = sorted([code for code, count in counts.items() if count > 1])
    users = {
        user.dao_code: user
        for user in db.scalars(select(User).where(User.dao_code.in_(dao_codes))).all()
    }
    matched = sorted([code for code in dao_codes if code in users])
    unmatched = sorted(set(dao_codes) - set(users))
    validation = UploadValidation(
        total_records=len(rows),
        matched_dao_codes=matched,
        unmatched_dao_codes=unmatched,
        duplicate_dao_codes=duplicate_dao_codes,
        missing_required_fields=[],
    )
    return validation, users


def create_report(
    db: Session,
    report_date,
    rows: list[dict],
    missing_required_fields: list[str],
    uploaded_by: User,
) -> tuple[Report, UploadValidation, int]:
    validation, users = validate_rows(db, rows)
    validation.missing_required_fields = missing_required_fields
    if (
        validation.unmatched_dao_codes
        or validation.duplicate_dao_codes
        or validation.missing_required_fields
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation.model_dump(),
        )

    db.execute(update(Report).values(is_active=False))
    report = Report(report_date=report_date, uploaded_by=uploaded_by.id, is_active=True)
    db.add(report)
    db.flush()

    for row in rows:
        dao_code = normalize_dao_code(row["dao_code"])
        user = users[dao_code]
        db.add(
            PerformanceData(
                report_id=report.id,
                user_id=user.id,
                dao_code=dao_code,
                ind_target=row["ind_target"],
                ind_actual=row["ind_actual"],
                ind_valid=row["ind_valid"],
                bus_target=row["bus_target"],
                bus_actual=row["bus_actual"],
                bus_valid=row["bus_valid"],
            )
        )
    db.commit()
    db.refresh(report)
    return report, validation, len(rows)


def get_active_report(db: Session) -> Report | None:
    return db.scalar(select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc()))


def get_report_status(db: Session) -> tuple[Report | None, int, int]:
    active_report = get_active_report(db)
    total_reports = db.scalar(select(func.count(Report.id))) or 0
    total_records = 0
    if active_report:
        total_records = (
            db.scalar(
                select(func.count(PerformanceData.id)).where(
                    PerformanceData.report_id == active_report.id
                )
            )
            or 0
        )
    return active_report, total_reports, total_records


def delete_report(db: Session, report_id: UUID) -> None:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    was_active = report.is_active
    db.delete(report)
    db.commit()
    if was_active:
        latest = db.scalar(select(Report).order_by(Report.uploaded_at.desc()))
        if latest:
            latest.is_active = True
            db.commit()


def scoped_performance_query(db: Session, user: User):
    active_report = get_active_report(db)
    if not active_report:
        return None, []
    statement = (
        select(PerformanceData, User)
        .join(User, User.id == PerformanceData.user_id)
        .where(PerformanceData.report_id == active_report.id)
    )
    if user.position == UserPosition.FSO:
        statement = statement.where(User.id == user.id)
    elif user.position == UserPosition.CLUSTER_HEAD:
        statement = statement.where(User.cluster_head_id == user.id)
    return active_report, list(db.execute(statement).all())
