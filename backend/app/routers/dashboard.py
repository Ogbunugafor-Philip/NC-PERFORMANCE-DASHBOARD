from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin, require_roles
from app.database import get_db
from app.models.report import ClusterHeadRanking, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.services.performance_processor import ProcessorService
from app.services.ranking_engine import get_fso_rank_display
from app.services.regional_engine import RegionalEngine
from app.services.status_engine import StatusEngine


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def active_report_or_404(db: Session) -> Report:
    report = db.scalar(select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc()))
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active report exists")
    return report


def enrich_fso(row: ProcessedPerformance, user: User, total: int) -> dict:
    status_engine = StatusEngine()
    rank = row.fso_rank or 0
    return {
        "report_id": str(row.report_id),
        "user_id": str(user.id),
        "name": user.name,
        "dao_code": row.dao_code,
        "cluster_head_id": str(user.cluster_head_id) if user.cluster_head_id else None,
        "rank": rank,
        "rank_ordinal": get_fso_rank_display(rank) if rank else "Unranked",
        "rank_total": total,
        "rank_display": f"You are ranked {get_fso_rank_display(rank)} out of {total} FSOs in North Central" if rank else "Not ranked",
        "individual": {
            "target": row.ind_target,
            "actual": row.ind_actual,
            "valid": row.ind_valid,
            "invalid_count": row.ind_invalid_count,
            "percentage_invalid": row.ind_percentage_invalid,
            "percentage_achievement": row.ind_percentage_achievement,
            "current_drr": row.ind_current_drr,
            "required_drr": row.ind_required_drr,
            "accounts_outstanding": row.ind_target - row.ind_valid,
            "status": status_engine.get_performance_status(row.ind_percentage_achievement),
            "drr_status": status_engine.get_drr_status(row.ind_current_drr, row.ind_required_drr),
        },
        "business": {
            "target": row.bus_target,
            "actual": row.bus_actual,
            "valid": row.bus_valid,
            "invalid_count": row.bus_invalid_count,
            "percentage_invalid": row.bus_percentage_invalid,
            "percentage_achievement": row.bus_percentage_achievement,
            "current_drr": row.bus_current_drr,
            "required_drr": row.bus_required_drr,
            "accounts_outstanding": row.bus_target - row.bus_valid,
            "status": status_engine.get_performance_status(row.bus_percentage_achievement),
            "drr_status": status_engine.get_drr_status(row.bus_current_drr, row.bus_required_drr),
        },
        "ind_score": row.ind_score,
        "bus_score": row.bus_score,
        "final_scorecard": row.final_scorecard,
        "scorecard_grade": status_engine.get_scorecard_grade(row.final_scorecard),
    }


def fso_total(db: Session, report: Report) -> int:
    return db.scalar(
        select(func.count(ProcessedPerformance.id)).where(ProcessedPerformance.report_id == report.id)
    ) or 0


@router.get("/summary")
def summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    if current_user.position == UserPosition.FSO:
        return fso_me(current_user, db)
    if current_user.position == UserPosition.CLUSTER_HEAD:
        return cluster_me(current_user, db)
    return rsm_summary(current_user, db)


@router.get("/fso/me")
def fso_me(
    current_user: User = Depends(require_roles(UserPosition.FSO, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    report = active_report_or_404(db)
    row = db.scalar(
        select(ProcessedPerformance).where(
            ProcessedPerformance.report_id == report.id,
            ProcessedPerformance.user_id == current_user.id,
        )
    )
    if row is None:
        return {"report_date": report.report_date.isoformat(), "empty": True, "message": "No performance data for this FSO in the active report"}
    return {"report_date": report.report_date.isoformat(), "empty": False, **enrich_fso(row, current_user, fso_total(db, report))}


@router.get("/cluster/me")
def cluster_me(
    current_user: User = Depends(require_roles(UserPosition.CLUSTER_HEAD, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    report = active_report_or_404(db)
    ranking = db.scalar(
        select(ClusterHeadRanking).where(
            ClusterHeadRanking.report_id == report.id,
            ClusterHeadRanking.cluster_head_id == current_user.id,
        )
    )
    if ranking is None:
        return {"report_date": report.report_date.isoformat(), "empty": True, "message": "No team data for this Cluster Head in the active report"}
    status_engine = StatusEngine()
    return {
        "report_date": report.report_date.isoformat(),
        "empty": False,
        "cluster_head_id": str(current_user.id),
        "name": current_user.name,
        "dao_code": current_user.dao_code,
        "rank": ranking.cluster_rank,
        "rank_ordinal": get_fso_rank_display(ranking.cluster_rank or 0),
        "total_fso_count": ranking.total_fso_count,
        "team_scorecard": ranking.team_scorecard,
        "scorecard_grade": status_engine.get_scorecard_grade(ranking.team_scorecard),
        "individual": {
            "target": ranking.total_ind_target,
            "actual": ranking.total_ind_actual,
            "valid": ranking.total_ind_valid,
            "percentage_achievement": ranking.ind_percentage_achievement,
            "current_drr": ranking.ind_current_drr,
            "required_drr": ranking.ind_required_drr,
            "status": status_engine.get_performance_status(ranking.ind_percentage_achievement),
            "drr_status": status_engine.get_drr_status(ranking.ind_current_drr, ranking.ind_required_drr),
        },
        "business": {
            "target": ranking.total_bus_target,
            "actual": ranking.total_bus_actual,
            "valid": ranking.total_bus_valid,
            "percentage_achievement": ranking.bus_percentage_achievement,
            "current_drr": ranking.bus_current_drr,
            "required_drr": ranking.bus_required_drr,
            "status": status_engine.get_performance_status(ranking.bus_percentage_achievement),
            "drr_status": status_engine.get_drr_status(ranking.bus_current_drr, ranking.bus_required_drr),
        },
    }


@router.get("/cluster/team")
def cluster_team(
    current_user: User = Depends(require_roles(UserPosition.CLUSTER_HEAD, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> list[dict]:
    report = active_report_or_404(db)
    rows = list(
        db.execute(
            select(ProcessedPerformance, User)
            .join(User, User.id == ProcessedPerformance.user_id)
            .where(ProcessedPerformance.report_id == report.id, User.cluster_head_id == current_user.id)
            .order_by(ProcessedPerformance.fso_rank)
        ).all()
    )
    total = fso_total(db, report)
    return [enrich_fso(row, user, total) for row, user in rows]


@router.get("/cluster/leaderboard")
def cluster_leaderboard(
    _: User = Depends(require_roles(UserPosition.CLUSTER_HEAD, UserPosition.RSM, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> list[dict]:
    active_report_or_404(db)
    return RegionalEngine(db).get_cluster_leaderboard()


@router.get("/rsm/summary")
def rsm_summary(
    _: User = Depends(require_roles(UserPosition.RSM, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    active_report_or_404(db)
    return RegionalEngine(db).get_regional_summary()


@router.get("/rsm/fso-leaderboard")
def rsm_fso_leaderboard(
    _: User = Depends(require_roles(UserPosition.RSM, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> list[dict]:
    active_report_or_404(db)
    return RegionalEngine(db).get_fso_leaderboard()


@router.get("/rsm/cluster-leaderboard")
def rsm_cluster_leaderboard(
    _: User = Depends(require_roles(UserPosition.RSM, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> list[dict]:
    active_report_or_404(db)
    return RegionalEngine(db).get_cluster_leaderboard()


@router.get("/rsm/top-performers")
def rsm_top_performers(
    _: User = Depends(require_roles(UserPosition.RSM, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> list[dict]:
    active_report_or_404(db)
    return RegionalEngine(db).get_top_performers(10)


@router.get("/rsm/bottom-performers")
def rsm_bottom_performers(
    _: User = Depends(require_roles(UserPosition.RSM, UserPosition.ADMIN)),
    db: Session = Depends(get_db),
) -> list[dict]:
    active_report_or_404(db)
    return RegionalEngine(db).get_bottom_performers(10)


@router.get("/admin/summary")
def admin_summary(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    active_report_or_404(db)
    return RegionalEngine(db).get_regional_summary()


@router.post("/admin/recalculate")
def admin_recalculate(
    background_tasks: BackgroundTasks,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    from app.services.insight_service import bg_generate_all_insights

    report = active_report_or_404(db)
    result = ProcessorService(db).run_full_pipeline(report)
    background_tasks.add_task(bg_generate_all_insights, report.id)
    return result


@router.get("/admin/validation")
def admin_validation(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    report = active_report_or_404(db)
    raw_count = db.scalar(select(func.count()).select_from(ProcessedPerformance).where(ProcessedPerformance.report_id == report.id)) or 0
    missing_rank_count = db.scalar(
        select(func.count()).select_from(ProcessedPerformance).where(
            ProcessedPerformance.report_id == report.id,
            ProcessedPerformance.fso_rank.is_(None),
        )
    ) or 0
    return {
        "report_date": report.report_date.isoformat(),
        "processed_records": raw_count,
        "missing_rank_count": missing_rank_count,
        "status": "PASSED" if raw_count > 0 and missing_rank_count == 0 else "REVIEW REQUIRED",
    }
