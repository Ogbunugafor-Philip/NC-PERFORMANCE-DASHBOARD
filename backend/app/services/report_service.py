import logging
import re
from collections import Counter
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.models.insight import AIInsight
from app.models.report import PerformanceData, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.schemas.reports import UploadValidation
from app.utils.excel_parser import normalize_dao_code

logger = logging.getLogger(__name__)


def _norm_name(value: str) -> str:
    """Normalise a person name for matching: collapse whitespace, lowercase."""
    return " ".join(str(value or "").split()).lower()


def _slug_dao(name: str, taken: set[str]) -> str:
    """Synthesise a unique DAO code for an auto-created Cluster Head."""
    base = re.sub(r"[^A-Za-z0-9]+", "", name).upper()[:18] or "HEAD"
    candidate = f"CH-{base}"
    suffix = 1
    while candidate in taken:
        suffix += 1
        candidate = f"CH-{base}-{suffix}"
    taken.add(candidate)
    return candidate


class ClusterHeadResolver:
    """Resolves (and auto-creates) Cluster Head users from Excel names."""

    def __init__(self, db: Session):
        self.db = db
        heads = db.scalars(
            select(User).where(User.position == UserPosition.CLUSTER_HEAD)
        ).all()
        self._by_name: dict[str, User] = {_norm_name(h.name): h for h in heads}
        self._taken_dao: set[str] = {
            code for code in db.scalars(select(User.dao_code)).all()
        }
        self.created: list[User] = []

    def resolve(self, name: str, state_cluster: str) -> User | None:
        key = _norm_name(name)
        if not key:
            return None
        head = self._by_name.get(key)
        if head is None:
            head = User(
                name=" ".join(name.split()),
                dao_code=_slug_dao(name, self._taken_dao),
                position=UserPosition.CLUSTER_HEAD,
                is_active=True,
                is_first_login=True,
                cluster_name=state_cluster or None,
            )
            self.db.add(head)
            self.db.flush()  # assign id
            self._by_name[key] = head
            self.created.append(head)
        elif state_cluster and not head.cluster_name:
            head.cluster_name = state_cluster
        return head


def validate_rows(db: Session, rows: list[dict]) -> tuple[UploadValidation, dict[str, User]]:
    dao_codes = [normalize_dao_code(row["dao_code"]) for row in rows if row.get("dao_code")]
    counts = Counter(dao_codes)
    duplicate_dao_codes = sorted([code for code, count in counts.items() if count > 1])
    users = {
        user.dao_code: user
        for user in db.scalars(select(User).where(User.dao_code.in_(dao_codes))).all()
    }
    # Deduplicate: keep first occurrence only
    seen: set[str] = set()
    unique_codes: list[str] = []
    for code in dao_codes:
        if code not in seen:
            seen.add(code)
            unique_codes.append(code)
    matched = sorted([code for code in unique_codes if code in users])
    unmatched = sorted(set(unique_codes) - set(users))
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
    parse_meta: dict,
    uploaded_by: User,
    file_path: str | None = None,
) -> tuple[Report, UploadValidation, int]:
    """Fully-automatic upload with smart FSO sync.

    RULE 1  new FSO (in Excel, not in DB)      → auto-register, link to Cluster Head
    RULE 2  existing FSO (in Excel and DB)      → keep login details; only refresh
                                                  name + cluster_head_id (+ state)
    RULE 3  terminated FSO (in DB, not in Excel)→ delete the FSO and its data
            (only position == FSO; never Admin/RSM/Cluster Head)

    All mutations run in a single transaction — any failure rolls back everything.
    """
    try:
        # Existing user lookup by DAO code
        existing: dict[str, User] = {
            u.dao_code: u for u in db.scalars(select(User)).all()
        }
        head_resolver = ClusterHeadResolver(db)

        counts = Counter(normalize_dao_code(r["dao_code"]) for r in rows if r.get("dao_code"))
        duplicate_dao_codes = sorted([c for c, n in counts.items() if n > 1])

        new_fsos = 0
        updated_fsos = 0
        seen_codes: set[str] = set()
        import_rows: list[tuple[User, dict]] = []
        matched_codes: list[str] = []
        new_fso_list: list[str] = []

        # ── Steps 4 & 5 — register new (Rule 1) / refresh existing (Rule 2) ──
        for row in rows:
            dao_code = normalize_dao_code(row["dao_code"])
            if not dao_code or dao_code in seen_codes:
                continue
            seen_codes.add(dao_code)

            name = " ".join(str(row.get("name", "")).split())
            state_cluster = (row.get("state_cluster") or "").strip()
            head = head_resolver.resolve(row.get("cluster_head", ""), state_cluster)

            user = existing.get(dao_code)
            if user is None:
                user = User(
                    name=name or dao_code,
                    dao_code=dao_code,
                    position=UserPosition.FSO,
                    email=None,
                    is_active=True,
                    is_first_login=True,
                    cluster_head_id=head.id if head else None,
                    cluster_name=state_cluster or None,
                )
                db.add(user)
                db.flush()
                existing[dao_code] = user
                new_fsos += 1
                new_fso_list.append(f"{user.name} ({dao_code})")
                logger.info("New FSO registered: %s %s", user.name, dao_code)
            else:
                # Rule 2: NEVER touch email / password / is_first_login.
                if name and user.name != name:
                    user.name = name
                    updated_fsos += 1
                if head and user.cluster_head_id != head.id:
                    user.cluster_head_id = head.id
                if state_cluster and user.cluster_name != state_cluster:
                    user.cluster_name = state_cluster
                logger.info("Existing FSO kept: %s %s", user.name, dao_code)

            matched_codes.append(dao_code)
            import_rows.append((user, row))

        excel_dao_codes = set(seen_codes)

        # ── Step 6 — Rule 3: remove terminated FSOs (only position == FSO) ──
        # Guard: never wipe FSOs when the Excel had no usable rows.
        terminated_fso_list: list[str] = []
        if excel_dao_codes:
            terminated_fsos = db.scalars(
                select(User).where(
                    User.position == UserPosition.FSO,
                    User.dao_code.notin_(excel_dao_codes),
                )
            ).all()
            for fso in terminated_fsos:
                terminated_fso_list.append(f"{fso.name} ({fso.dao_code})")
                logger.info("FSO removed (not in Excel): %s %s", fso.name, fso.dao_code)
                # Explicitly clear dependent data (also enforced by ON DELETE CASCADE)
                db.execute(delete(AIInsight).where(AIInsight.user_id == fso.id))
                db.execute(delete(ProcessedPerformance).where(ProcessedPerformance.user_id == fso.id))
                db.execute(delete(PerformanceData).where(PerformanceData.user_id == fso.id))
                db.delete(fso)
            db.flush()

        # ── Step 7 — deactivate prior reports, create new report + performance data ──
        db.execute(update(Report).values(is_active=False))
        report = Report(
            report_date=report_date,
            uploaded_by=uploaded_by.id,
            is_active=True,
            file_path=file_path,
        )
        db.add(report)
        db.flush()

        for user, row in import_rows:
            db.add(
                PerformanceData(
                    report_id=report.id,
                    user_id=user.id,
                    dao_code=user.dao_code,
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
    except Exception:
        db.rollback()
        logger.exception("Report upload failed — rolled back")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed and was rolled back. No changes were saved.",
        )

    # ── Step 8 — full calculation pipeline (KPIs, rankings, aggregation) ──
    from app.services.performance_processor import ProcessorService

    ProcessorService(db).run_full_pipeline(report)

    validation = UploadValidation(
        report_date_extracted=f"{report_date.strftime('%B')} {report_date.day}, {report_date.year}",
        total_rows_found=parse_meta.get("total_rows_found", 0),
        rows_skipped=parse_meta.get("rows_skipped", 0),
        total_records=len(import_rows),
        matched_dao_codes=sorted(matched_codes),
        unmatched_dao_codes=[],
        duplicate_dao_codes=duplicate_dao_codes,
        new_fsos_registered=new_fsos,
        existing_fsos_updated=updated_fsos,
        existing_fsos_kept=len(import_rows) - new_fsos,
        terminated_fsos_removed=len(terminated_fso_list),
        cluster_heads_created=len(head_resolver.created),
        new_fso_list=new_fso_list,
        terminated_fso_list=terminated_fso_list,
        calculations_complete=True,
        rankings_updated=True,
    )
    logger.info(
        "Sync complete — %s new, %s kept, %s removed",
        new_fsos, len(import_rows) - new_fsos, len(terminated_fso_list),
    )
    return report, validation, len(import_rows)


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
