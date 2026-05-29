import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal
from app.routers import admin, auth, dashboard, reports, staff, users
from app.routers import insights as insights_router
from app.services.bootstrap_service import ensure_admin_user

logger = logging.getLogger(__name__)


async def _check_stale_insights() -> None:
    """On startup, regenerate insights if they are missing or older than 24 hours."""
    await asyncio.sleep(3)  # let the app finish starting before hitting the DB
    from sqlalchemy import select
    from app.models.report import Report
    from app.models.insight import AIInsight
    from app.services.insight_service import InsightService

    db = SessionLocal()
    try:
        report = db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )
        if report is None:
            return
        latest = db.scalar(
            select(AIInsight)
            .where(AIInsight.report_id == report.id, AIInsight.is_current.is_(True))
            .order_by(AIInsight.generated_at.desc())
        )
        stale = latest is None or (datetime.utcnow() - latest.generated_at) > timedelta(hours=24)
        if stale:
            logger.info("Stale or missing insights detected — regenerating in background")
            service = InsightService(db)
            await service.generate_all_insights(report.id)
            logger.info("Startup insight regeneration complete")
    except Exception as exc:
        logger.warning("Startup insight check failed: %s", exc)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        ensure_admin_user(db)
    finally:
        db.close()
    asyncio.create_task(_check_stale_insights())
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=getattr(settings, "APP_VERSION", "1.0.0"),
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(staff.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(insights_router.router, prefix=API_PREFIX)
