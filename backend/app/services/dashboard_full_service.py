from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.report import ClusterHeadRanking, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.services.calculation_engine import KPICalculator
from app.services.ranking_engine import get_fso_rank_display
from app.services.status_engine import StatusEngine


class FullDashboardService:
    """Builds the rich, fully-detailed payloads consumed by the rebuilt
    Admin / RSM / Cluster Head dashboards. All numeric values are whole numbers."""

    def __init__(self, db: Session):
        self.db = db
        self.status = StatusEngine()
        self.calc = KPICalculator()

    # ── helpers ──────────────────────────────────────────────────────────
    def active_report(self) -> Report | None:
        return self.db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )

    def _head_map(self) -> dict[UUID, User]:
        heads = self.db.scalars(
            select(User).where(User.position == UserPosition.CLUSTER_HEAD)
        ).all()
        return {head.id: head for head in heads}

    def _cluster_head_count(self) -> int:
        return self.db.scalar(
            select(func.count(User.id)).where(User.position == UserPosition.CLUSTER_HEAD)
        ) or 0

    def _fso_count(self) -> int:
        return self.db.scalar(
            select(func.count(User.id)).where(User.position == UserPosition.FSO)
        ) or 0

    def fso_row(self, row: ProcessedPerformance, user: User, head: User | None,
                rank: int, total: int) -> dict:
        ind_invalid = max(row.ind_actual - row.ind_valid, 0)
        bus_invalid = max(row.bus_actual - row.bus_valid, 0)
        position = (
            f"{get_fso_rank_display(rank)} out of {total} FSOs" if rank else "Unranked"
        )
        return {
            "user_id": str(user.id),
            "name": user.name,
            "dao_code": row.dao_code,
            "cluster_head_id": str(user.cluster_head_id) if user.cluster_head_id else None,
            "cluster_head": head.name if head else "Unassigned",
            "state_cluster": (head.cluster_name if head and head.cluster_name else "—"),
            "ind_target": row.ind_target,
            "ind_actual": row.ind_actual,
            "ind_valid": row.ind_valid,
            "ind_invalid": ind_invalid,
            "ind_pct_invalid": row.ind_percentage_invalid,
            "ind_pct_achievement": row.ind_percentage_achievement,
            "ind_score": row.ind_score,
            "ind_current_drr": row.ind_current_drr,
            "ind_required_drr": row.ind_required_drr,
            "bus_target": row.bus_target,
            "bus_actual": row.bus_actual,
            "bus_valid": row.bus_valid,
            "bus_invalid": bus_invalid,
            "bus_pct_invalid": row.bus_percentage_invalid,
            "bus_pct_achievement": row.bus_percentage_achievement,
            "bus_score": row.bus_score,
            "bus_current_drr": row.bus_current_drr,
            "bus_required_drr": row.bus_required_drr,
            "final_scorecard": row.final_scorecard,
            "rank": rank,
            "position": position,
            "status": self.status.get_performance_status(row.final_scorecard),
        }

    # ── FSO leaderboard (region-wide) ────────────────────────────────────
    def fso_leaderboard(self, report: Report) -> list[dict]:
        heads = self._head_map()
        rows = list(
            self.db.execute(
                select(ProcessedPerformance, User)
                .join(User, User.id == ProcessedPerformance.user_id)
                .where(ProcessedPerformance.report_id == report.id)
                .order_by(ProcessedPerformance.fso_rank, ProcessedPerformance.dao_code)
            ).all()
        )
        total = len(rows)
        return [
            self.fso_row(row, user, heads.get(user.cluster_head_id), row.fso_rank or 0, total)
            for row, user in rows
        ]

    # ── FSO table for one cluster head (rank within team) ────────────────
    def team_fso_table(self, report: Report, cluster_head_id: UUID) -> list[dict]:
        heads = self._head_map()
        rows = list(
            self.db.execute(
                select(ProcessedPerformance, User)
                .join(User, User.id == ProcessedPerformance.user_id)
                .where(
                    ProcessedPerformance.report_id == report.id,
                    User.cluster_head_id == cluster_head_id,
                )
                .order_by(ProcessedPerformance.final_scorecard.desc(), ProcessedPerformance.dao_code)
            ).all()
        )
        total = len(rows)
        result: list[dict] = []
        prev_score = None
        prev_rank = 0
        for index, (row, user) in enumerate(rows, start=1):
            if prev_score is not None and row.final_scorecard == prev_score:
                rank = prev_rank
            else:
                rank = index
                prev_rank = index
            prev_score = row.final_scorecard
            result.append(
                self.fso_row(row, user, heads.get(user.cluster_head_id), rank, total)
            )
        return result

    # ── Cluster head cards ───────────────────────────────────────────────
    def clusters(self, report: Report) -> list[dict]:
        rows = list(
            self.db.execute(
                select(ClusterHeadRanking, User)
                .join(User, User.id == ClusterHeadRanking.cluster_head_id)
                .where(ClusterHeadRanking.report_id == report.id)
                .order_by(ClusterHeadRanking.cluster_rank, User.name)
            ).all()
        )
        total = len(rows)
        result: list[dict] = []
        for ranking, head in rows:
            ind_invalid = max(ranking.total_ind_actual - ranking.total_ind_valid, 0)
            bus_invalid = max(ranking.total_bus_actual - ranking.total_bus_valid, 0)
            result.append({
                "cluster_head_id": str(head.id),
                "name": head.name,
                "dao_code": head.dao_code,
                "state_cluster": head.cluster_name or "—",
                "rank": ranking.cluster_rank or 0,
                "rank_display": get_fso_rank_display(ranking.cluster_rank or 0) if ranking.cluster_rank else "Unranked",
                "rank_total": total,
                "team_scorecard": ranking.team_scorecard,
                "scorecard_grade": self.status.get_scorecard_grade(ranking.team_scorecard),
                "status": self.status.get_performance_status(ranking.team_scorecard),
                "total_fso_count": ranking.total_fso_count,
                "individual": {
                    "target": ranking.total_ind_target,
                    "actual": ranking.total_ind_actual,
                    "valid": ranking.total_ind_valid,
                    "invalid": ind_invalid,
                    "pct_invalid": self.calc.calculate_percentage_invalid(ind_invalid, ranking.total_ind_actual),
                    "pct_achievement": ranking.ind_percentage_achievement,
                    "current_drr": ranking.ind_current_drr,
                    "required_drr": ranking.ind_required_drr,
                    "status": self.status.get_performance_status(ranking.ind_percentage_achievement),
                },
                "business": {
                    "target": ranking.total_bus_target,
                    "actual": ranking.total_bus_actual,
                    "valid": ranking.total_bus_valid,
                    "invalid": bus_invalid,
                    "pct_invalid": self.calc.calculate_percentage_invalid(bus_invalid, ranking.total_bus_actual),
                    "pct_achievement": ranking.bus_percentage_achievement,
                    "current_drr": ranking.bus_current_drr,
                    "required_drr": ranking.bus_required_drr,
                    "status": self.status.get_performance_status(ranking.bus_percentage_achievement),
                },
            })
        return result

    # ── Regional summary ─────────────────────────────────────────────────
    def regional_summary(self, report: Report, fsos: list[dict]) -> dict:
        ind_target = sum(f["ind_target"] for f in fsos)
        ind_actual = sum(f["ind_actual"] for f in fsos)
        ind_valid = sum(f["ind_valid"] for f in fsos)
        bus_target = sum(f["bus_target"] for f in fsos)
        bus_actual = sum(f["bus_actual"] for f in fsos)
        bus_valid = sum(f["bus_valid"] for f in fsos)
        ind_invalid = max(ind_actual - ind_valid, 0)
        bus_invalid = max(bus_actual - bus_valid, 0)
        ind_ach = self.calc.calculate_percentage_achievement(ind_valid, ind_target)
        bus_ach = self.calc.calculate_percentage_achievement(bus_valid, bus_target)
        ind_out = self.calc.calculate_accounts_outstanding(ind_target, ind_valid)
        bus_out = self.calc.calculate_accounts_outstanding(bus_target, bus_valid)
        scorecard = (
            self.calc._round(sum(f["final_scorecard"] for f in fsos) / len(fsos)) if fsos else 0
        )
        return {
            "report_date": report.report_date.isoformat(),
            "report_date_label": report.report_date.strftime("%B %-d, %Y"),
            "total_fsos": self._fso_count(),
            "total_cluster_heads": self._cluster_head_count(),
            "matched_fsos": len(fsos),
            "regional_scorecard": scorecard,
            "scorecard_grade": self.status.get_scorecard_grade(scorecard),
            "regional_ind_pct_achievement": ind_ach,
            "regional_bus_pct_achievement": bus_ach,
            "individual": {
                "target": ind_target,
                "actual": ind_actual,
                "valid": ind_valid,
                "invalid": ind_invalid,
                "pct_invalid": self.calc.calculate_percentage_invalid(ind_invalid, ind_actual),
                "pct_achievement": ind_ach,
                "current_drr": self.calc.calculate_current_daily_run_rate(ind_valid, report.report_date),
                "required_drr": self.calc.calculate_required_daily_run_rate(ind_out, report.report_date),
                "status": self.status.get_performance_status(ind_ach),
            },
            "business": {
                "target": bus_target,
                "actual": bus_actual,
                "valid": bus_valid,
                "invalid": bus_invalid,
                "pct_invalid": self.calc.calculate_percentage_invalid(bus_invalid, bus_actual),
                "pct_achievement": bus_ach,
                "current_drr": self.calc.calculate_current_daily_run_rate(bus_valid, report.report_date),
                "required_drr": self.calc.calculate_required_daily_run_rate(bus_out, report.report_date),
                "status": self.status.get_performance_status(bus_ach),
            },
        }

    # ── Composite payloads ───────────────────────────────────────────────
    def full(self, report: Report) -> dict:
        fsos = self.fso_leaderboard(report)
        clusters = self.clusters(report)
        return {
            "summary": self.regional_summary(report, fsos),
            "clusters": clusters,
            "fsos": fsos,
        }

    def system_status(self, report: Report) -> dict:
        from app.config import settings

        total_fsos = self._fso_count()
        total_heads = self._cluster_head_count()
        total_users = self.db.scalar(select(func.count(User.id))) or 0
        last_calc = self.db.scalar(
            select(func.max(ProcessedPerformance.updated_at)).where(
                ProcessedPerformance.report_id == report.id
            )
        )
        return {
            "database": "connected",
            "last_calculation_run": last_calc.isoformat() if last_calc else None,
            "total_users": total_users,
            "total_fsos": total_fsos,
            "total_cluster_heads": total_heads,
            "cerebras_configured": bool(getattr(settings, "CEREBRAS_API_KEY", "")),
            "report_date": report.report_date.isoformat(),
            "report_date_label": report.report_date.strftime("%B %-d, %Y"),
        }
