import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import settings
from app.database import SessionLocal  # noqa: F401 — used in health endpoint
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

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _request_timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    if elapsed > 2.0:
        logger.warning("SLOW REQUEST %.3fs  %s %s", elapsed, request.method, request.url.path)
    response.headers["X-Response-Time"] = f"{elapsed:.3f}s"
    return response


@app.get("/health")
def health() -> dict:
    from sqlalchemy import select, text
    from app.models.report import Report

    db = SessionLocal()
    db_status = "connected"
    active_report_label = None
    try:
        db.execute(text("SELECT 1"))
        report = db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )
        if report:
            active_report_label = report.report_date.strftime("%-d %b %Y")
    except Exception:
        db_status = "error"
    finally:
        db.close()

    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "active_report": active_report_label,
        "version": getattr(settings, "APP_VERSION", "1.0.0"),
        "environment": settings.APP_ENV,
    }


API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(staff.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(insights_router.router, prefix=API_PREFIX)
