import uuid
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin, require_roles
from app.database import get_db
from app.models.insight import AIInsight, InsightRole, InsightSource
from app.models.report import Report
from app.models.user import User, UserPosition
from app.services.cerebras_service import CerebrasService
from app.services.insight_service import InsightService, bg_generate_all_insights

router = APIRouter(prefix="/insights", tags=["insights"])

# In-memory rate-limit tracker: user_id → list of datetime
_refresh_times: dict[str, list[datetime]] = defaultdict(list)


def _rate_limit_ok(user_id: str) -> bool:
    """Return True if the user is within the 5-per-hour refresh limit."""
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=1)
    times = [t for t in _refresh_times[user_id] if t > cutoff]
    _refresh_times[user_id] = times
    if len(times) >= 5:
        return False
    _refresh_times[user_id].append(now)
    return True


def active_report_or_404(db: Session) -> Report:
    report = db.scalar(
        select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
    )
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active report exists")
    return report


def _insight_to_dict(insight: AIInsight) -> dict:
    return {
        "insight_text": insight.insight_text,
        "insight_source": insight.insight_source,
        "generated_at": insight.generated_at.isoformat(),
        "role": insight.role,
    }


@router.get("/me")
async def get_my_insight(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    report = active_report_or_404(db)
    service = InsightService(db)
    insight = await service.get_or_generate_insight(current_user, report.id)
    db.commit()
    return _insight_to_dict(insight)


@router.post("/refresh")
async def refresh_insight(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if not _rate_limit_ok(str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Refresh limit reached. Maximum 5 refreshes per hour.",
        )
    report = active_report_or_404(db)
    service = InsightService(db)
    insight = await service.refresh_insight_for_user(current_user, report.id)
    return _insight_to_dict(insight)


@router.get("/regional")
async def regional_insight(
    current_user: User = Depends(
        require_roles(UserPosition.RSM, UserPosition.ADMIN)
    ),
    db: Session = Depends(get_db),
) -> dict:
    report = active_report_or_404(db)
    insight = db.scalar(
        select(AIInsight).where(
            AIInsight.report_id == report.id,
            AIInsight.role == InsightRole.RSM,
            AIInsight.is_current.is_(True),
        )
    )
    if insight is None:
        service = InsightService(db)
        insight = await service.get_or_generate_insight(current_user, report.id)
        db.commit()
    return _insight_to_dict(insight)


@router.get("/status")
async def insights_status(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    cerebras = CerebrasService()
    available = await cerebras.is_available()

    total = db.scalar(select(func.count(AIInsight.id))) or 0
    cerebras_count = (
        db.scalar(
            select(func.count(AIInsight.id)).where(
                AIInsight.insight_source == InsightSource.CEREBRAS
            )
        )
        or 0
    )
    fallback_count = total - cerebras_count

    latest = db.scalar(
        select(AIInsight.generated_at).order_by(AIInsight.generated_at.desc())
    )

    return {
        "cerebras_available": available,
        "cerebras_model": cerebras.model,
        "total_insights": total,
        "cerebras_count": cerebras_count,
        "fallback_count": fallback_count,
        "last_generated_at": latest.isoformat() if latest else None,
    }


@router.post("/generate-all")
async def generate_all_insights(
    background_tasks: BackgroundTasks,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    report = active_report_or_404(db)
    background_tasks.add_task(bg_generate_all_insights, report.id)
    return {
        "status": "generating",
        "message": "Insights are being generated in the background.",
        "report_id": str(report.id),
    }
