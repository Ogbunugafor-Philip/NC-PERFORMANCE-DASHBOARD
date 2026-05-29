import logging
import uuid
from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.insight import AIInsight, InsightRole, InsightSource
from app.models.report import ClusterHeadRanking, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.services.cerebras_service import CerebrasService
from app.services.fallback_insight_engine import FallbackInsightEngine
from app.services.prompt_builder import PromptBuilder
from app.services.status_engine import StatusEngine

logger = logging.getLogger(__name__)


class InsightService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.cerebras = CerebrasService()
        self.prompts = PromptBuilder()
        self.fallback = FallbackInsightEngine()
        self.status_engine = StatusEngine()

    # ------------------------------------------------------------------
    # internal helpers
    # ------------------------------------------------------------------

    async def _try_generate(self, prompt: str) -> tuple[str, str]:
        """Return (text, source). Always returns a result."""
        text = await self.cerebras.generate(prompt)
        if text:
            return text, InsightSource.CEREBRAS
        return None, None  # caller must provide fallback text

    def _upsert(
        self,
        report_id: uuid.UUID,
        user_id: uuid.UUID | None,
        role: str,
        text: str,
        source: str,
    ) -> AIInsight:
        self.db.execute(
            update(AIInsight)
            .where(
                AIInsight.report_id == report_id,
                AIInsight.user_id == user_id,
                AIInsight.role == role,
                AIInsight.is_current.is_(True),
            )
            .values(is_current=False)
        )
        insight = AIInsight(
            report_id=report_id,
            user_id=user_id,
            role=role,
            insight_text=text,
            insight_source=source,
            generated_at=datetime.utcnow(),
            is_current=True,
        )
        self.db.add(insight)
        self.db.flush()
        return insight

    def _active_report(self) -> Report | None:
        return self.db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )

    # ------------------------------------------------------------------
    # FSO insight generation
    # ------------------------------------------------------------------

    def _build_fso_data(self, row: ProcessedPerformance, user: User, total_fsos: int) -> dict:
        report = self.db.get(Report, row.report_id)
        return {
            "name": user.name,
            "report_date": report.report_date.isoformat() if report else "N/A",
            "ind_target": row.ind_target,
            "ind_valid": row.ind_valid,
            "ind_achievement": row.ind_percentage_achievement,
            "ind_current_drr": row.ind_current_drr,
            "ind_required_drr": row.ind_required_drr,
            "ind_status": self.status_engine.get_performance_status(row.ind_percentage_achievement),
            "bus_target": row.bus_target,
            "bus_valid": row.bus_valid,
            "bus_achievement": row.bus_percentage_achievement,
            "bus_current_drr": row.bus_current_drr,
            "bus_required_drr": row.bus_required_drr,
            "bus_status": self.status_engine.get_performance_status(row.bus_percentage_achievement),
            "scorecard": row.final_scorecard,
            "rank": row.fso_rank or 0,
            "total_fsos": total_fsos,
        }

    async def _generate_fso_insight_for_row(
        self, row: ProcessedPerformance, user: User, total_fsos: int
    ) -> AIInsight:
        data = self._build_fso_data(row, user, total_fsos)
        text, source = await self._try_generate(self.prompts.build_fso_prompt(data))
        if text is None:
            text = self.fallback.generate_fso_insight(data)
            source = InsightSource.FALLBACK
        insight = self._upsert(row.report_id, user.id, InsightRole.FSO, text, source)
        logger.info("FSO %s: insight generated via %s", row.dao_code, source)
        return insight

    async def generate_fso_insights(self, report_id: uuid.UUID) -> int:
        rows = list(
            self.db.execute(
                select(ProcessedPerformance, User)
                .join(User, User.id == ProcessedPerformance.user_id)
                .where(ProcessedPerformance.report_id == report_id)
            ).all()
        )
        total_fsos = len(rows)
        for row, user in rows:
            await self._generate_fso_insight_for_row(row, user, total_fsos)
        return total_fsos

    # ------------------------------------------------------------------
    # Cluster Head insight generation
    # ------------------------------------------------------------------

    def _build_cluster_data(
        self, ranking: ClusterHeadRanking, user: User, total_clusters: int, report_id: uuid.UUID
    ) -> dict:
        report = self.db.get(Report, report_id)
        team_rows = list(
            self.db.execute(
                select(ProcessedPerformance, User)
                .join(User, User.id == ProcessedPerformance.user_id)
                .where(
                    ProcessedPerformance.report_id == report_id,
                    User.cluster_head_id == ranking.cluster_head_id,
                )
                .order_by(ProcessedPerformance.final_scorecard.desc())
            ).all()
        )
        top_performer = team_rows[0][1].name if team_rows else "N/A"
        top_score = team_rows[0][0].final_scorecard if team_rows else 0
        bottom_performer = team_rows[-1][1].name if len(team_rows) > 1 else (top_performer if team_rows else "N/A")
        bottom_score = team_rows[-1][0].final_scorecard if len(team_rows) > 1 else top_score
        return {
            "name": user.name,
            "total_fsos": ranking.total_fso_count,
            "report_date": report.report_date.isoformat() if report else "N/A",
            "total_ind_target": ranking.total_ind_target,
            "total_ind_valid": ranking.total_ind_valid,
            "ind_achievement": ranking.ind_percentage_achievement,
            "ind_current_drr": ranking.ind_current_drr,
            "ind_required_drr": ranking.ind_required_drr,
            "total_bus_target": ranking.total_bus_target,
            "total_bus_valid": ranking.total_bus_valid,
            "bus_achievement": ranking.bus_percentage_achievement,
            "bus_current_drr": ranking.bus_current_drr,
            "bus_required_drr": ranking.bus_required_drr,
            "team_scorecard": ranking.team_scorecard,
            "cluster_rank": ranking.cluster_rank or 0,
            "total_clusters": total_clusters,
            "top_performer_name": top_performer,
            "top_performer_score": top_score,
            "bottom_performer_name": bottom_performer,
            "bottom_performer_score": bottom_score,
        }

    async def _generate_cluster_insight_for_row(
        self, ranking: ClusterHeadRanking, user: User, total_clusters: int, report_id: uuid.UUID
    ) -> AIInsight:
        data = self._build_cluster_data(ranking, user, total_clusters, report_id)
        text, source = await self._try_generate(self.prompts.build_cluster_head_prompt(data))
        if text is None:
            text = self.fallback.generate_cluster_head_insight(data)
            source = InsightSource.FALLBACK
        insight = self._upsert(report_id, user.id, InsightRole.CLUSTER_HEAD, text, source)
        logger.info("Cluster Head %s: insight generated via %s", user.dao_code, source)
        return insight

    async def generate_cluster_insights(self, report_id: uuid.UUID) -> int:
        rows = list(
            self.db.execute(
                select(ClusterHeadRanking, User)
                .join(User, User.id == ClusterHeadRanking.cluster_head_id)
                .where(ClusterHeadRanking.report_id == report_id)
            ).all()
        )
        total_clusters = len(rows)
        for ranking, user in rows:
            await self._generate_cluster_insight_for_row(ranking, user, total_clusters, report_id)
        return total_clusters

    # ------------------------------------------------------------------
    # RSM / Regional insight generation
    # ------------------------------------------------------------------

    def _build_regional_data(self, report_id: uuid.UUID) -> dict:
        from app.services.regional_engine import RegionalEngine

        report = self.db.get(Report, report_id)
        engine = RegionalEngine(self.db)
        summary = engine.get_regional_summary()
        fso_list = engine.get_fso_leaderboard()

        total_ind_target = summary.get("total_ind_target", 0)
        total_ind_valid = summary.get("total_ind_valid", 0)
        total_bus_target = summary.get("total_bus_target", 0)
        total_bus_valid = summary.get("total_bus_valid", 0)
        ind_achievement = round(total_ind_valid / max(total_ind_target, 1) * 100)
        bus_achievement = round(total_bus_valid / max(total_bus_target, 1) * 100)

        top_cluster = summary.get("top_performing_cluster_head") or {}
        bottom_cluster = summary.get("bottom_performing_cluster_head") or {}
        top_fso = summary.get("top_performing_fso") or {}

        critical_count = sum(1 for f in fso_list if f.get("final_scorecard", 0) < 50)
        on_track_count = sum(1 for f in fso_list if f.get("final_scorecard", 0) >= 80)

        return {
            "report_date": report.report_date.isoformat() if report else "N/A",
            "total_fsos": summary.get("total_fsos", 0),
            "total_clusters": summary.get("total_cluster_heads", 0),
            "total_ind_target": total_ind_target,
            "total_ind_valid": total_ind_valid,
            "ind_achievement": ind_achievement,
            "total_bus_target": total_bus_target,
            "total_bus_valid": total_bus_valid,
            "bus_achievement": bus_achievement,
            "regional_scorecard": summary.get("regional_scorecard", 0),
            "top_cluster_name": top_cluster.get("name", "N/A"),
            "top_cluster_score": top_cluster.get("team_scorecard", 0),
            "bottom_cluster_name": bottom_cluster.get("name", "N/A"),
            "bottom_cluster_score": bottom_cluster.get("team_scorecard", 0),
            "top_fso_name": top_fso.get("name", "N/A"),
            "top_fso_score": top_fso.get("final_scorecard", 0),
            "critical_count": critical_count,
            "on_track_count": on_track_count,
        }

    async def generate_rsm_insights(self, report_id: uuid.UUID) -> int:
        data = self._build_regional_data(report_id)
        text, source = await self._try_generate(self.prompts.build_rsm_prompt(data))
        if text is None:
            text = self.fallback.generate_rsm_insight(data)
            source = InsightSource.FALLBACK
        self._upsert(report_id, None, InsightRole.RSM, text, source)
        logger.info("Regional insight generated via %s", source)
        return 1

    # ------------------------------------------------------------------
    # Full pipeline
    # ------------------------------------------------------------------

    async def generate_all_insights(self, report_id: uuid.UUID) -> dict:
        logger.info("Starting full insight generation for report %s", report_id)
        fso_count = await self.generate_fso_insights(report_id)
        cluster_count = await self.generate_cluster_insights(report_id)
        rsm_count = await self.generate_rsm_insights(report_id)
        self.db.commit()
        result = {
            "fso_insights": fso_count,
            "cluster_insights": cluster_count,
            "rsm_insights": rsm_count,
        }
        logger.info("Insight generation complete: %s", result)
        return result

    # ------------------------------------------------------------------
    # On-demand / refresh
    # ------------------------------------------------------------------

    async def get_or_generate_insight(self, user: User, report_id: uuid.UUID) -> AIInsight:
        role = self._user_role(user)
        uid = None if role in (InsightRole.RSM, InsightRole.ADMIN) else user.id

        existing = self.db.scalar(
            select(AIInsight).where(
                AIInsight.report_id == report_id,
                AIInsight.user_id == uid,
                AIInsight.role == role,
                AIInsight.is_current.is_(True),
            )
        )
        if existing:
            return existing

        return await self._generate_for_user(user, report_id, role, uid)

    async def refresh_insight_for_user(self, user: User, report_id: uuid.UUID) -> AIInsight:
        role = self._user_role(user)
        uid = None if role in (InsightRole.RSM, InsightRole.ADMIN) else user.id
        insight = await self._generate_for_user(user, report_id, role, uid)
        self.db.commit()
        return insight

    async def _generate_for_user(
        self, user: User, report_id: uuid.UUID, role: str, uid: uuid.UUID | None
    ) -> AIInsight:
        if role == InsightRole.FSO:
            row = self.db.scalar(
                select(ProcessedPerformance).where(
                    ProcessedPerformance.report_id == report_id,
                    ProcessedPerformance.user_id == user.id,
                )
            )
            if row is None:
                text = f"No performance data found for {user.name} in the active report."
                return self._upsert(report_id, uid, role, text, InsightSource.FALLBACK)
            total_fsos = self.db.scalar(
                select(func.count(ProcessedPerformance.id)).where(
                    ProcessedPerformance.report_id == report_id
                )
            ) or 1
            return await self._generate_fso_insight_for_row(row, user, total_fsos)

        if role == InsightRole.CLUSTER_HEAD:
            ranking = self.db.scalar(
                select(ClusterHeadRanking).where(
                    ClusterHeadRanking.report_id == report_id,
                    ClusterHeadRanking.cluster_head_id == user.id,
                )
            )
            if ranking is None:
                text = f"No team data found for {user.name} in the active report."
                return self._upsert(report_id, uid, role, text, InsightSource.FALLBACK)
            total_clusters = self.db.scalar(
                select(func.count(ClusterHeadRanking.id)).where(
                    ClusterHeadRanking.report_id == report_id
                )
            ) or 1
            return await self._generate_cluster_insight_for_row(ranking, user, total_clusters, report_id)

        # RSM / ADMIN — regional insight
        data = self._build_regional_data(report_id)
        text, source = await self._try_generate(self.prompts.build_rsm_prompt(data))
        if text is None:
            text = self.fallback.generate_rsm_insight(data)
            source = InsightSource.FALLBACK
        return self._upsert(report_id, None, InsightRole.RSM, text, source)

    @staticmethod
    def _user_role(user: User) -> str:
        mapping = {
            UserPosition.FSO: InsightRole.FSO,
            UserPosition.CLUSTER_HEAD: InsightRole.CLUSTER_HEAD,
            UserPosition.RSM: InsightRole.RSM,
            UserPosition.ADMIN: InsightRole.ADMIN,
        }
        return mapping.get(user.position, InsightRole.RSM)


async def bg_generate_all_insights(report_id: uuid.UUID) -> None:
    """Standalone async function for FastAPI BackgroundTasks."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        service = InsightService(db)
        await service.generate_all_insights(report_id)
    except Exception as exc:
        logger.error("Background insight generation failed: %s", exc)
    finally:
        db.close()
