from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.report import ClusterHeadRanking, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.services.calculation_engine import KPICalculator


def get_fso_rank_display(rank: int, total: int | None = None) -> str:
    if 10 <= rank % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(rank % 10, "th")
    return f"{rank}{suffix}"


class FSORankingEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_active_report(self) -> Report | None:
        return self.db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )

    def rank_active_report(self) -> list[ProcessedPerformance]:
        report = self.get_active_report()
        if report is None:
            return []
        records = list(
            self.db.scalars(
                select(ProcessedPerformance)
                .where(ProcessedPerformance.report_id == report.id)
                .order_by(ProcessedPerformance.final_scorecard.desc(), ProcessedPerformance.dao_code)
            ).all()
        )
        previous_score = None
        previous_rank = 0
        for index, record in enumerate(records, start=1):
            if previous_score is not None and record.final_scorecard == previous_score:
                record.fso_rank = previous_rank
            else:
                record.fso_rank = index
                previous_rank = index
            previous_score = record.final_scorecard
        self.db.flush()
        return records


class ClusterHeadEngine:
    def __init__(self, db: Session):
        self.db = db
        self.calculator = KPICalculator()

    def get_active_report(self) -> Report | None:
        return self.db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )

    def aggregate_cluster_performance(self, cluster_head_id: UUID) -> dict:
        report = self.get_active_report()
        if report is None:
            return {}
        rows = list(
            self.db.execute(
                select(ProcessedPerformance, User)
                .join(User, User.id == ProcessedPerformance.user_id)
                .where(
                    ProcessedPerformance.report_id == report.id,
                    User.cluster_head_id == cluster_head_id,
                )
            ).all()
        )
        total_ind_target = sum(row.ind_target for row, _ in rows)
        total_ind_valid = sum(row.ind_valid for row, _ in rows)
        total_ind_actual = sum(row.ind_actual for row, _ in rows)
        total_bus_target = sum(row.bus_target for row, _ in rows)
        total_bus_valid = sum(row.bus_valid for row, _ in rows)
        total_bus_actual = sum(row.bus_actual for row, _ in rows)
        ind_achievement = self.calculator.calculate_percentage_achievement(
            total_ind_valid, total_ind_target
        )
        bus_achievement = self.calculator.calculate_percentage_achievement(
            total_bus_valid, total_bus_target
        )
        ind_outstanding = self.calculator.calculate_accounts_outstanding(
            total_ind_target, total_ind_valid
        )
        bus_outstanding = self.calculator.calculate_accounts_outstanding(
            total_bus_target, total_bus_valid
        )
        return {
            "report_id": report.id,
            "cluster_head_id": cluster_head_id,
            "total_ind_target": total_ind_target,
            "total_ind_valid": total_ind_valid,
            "total_ind_actual": total_ind_actual,
            "total_bus_target": total_bus_target,
            "total_bus_valid": total_bus_valid,
            "total_bus_actual": total_bus_actual,
            "ind_percentage_achievement": ind_achievement,
            "bus_percentage_achievement": bus_achievement,
            "ind_current_drr": self.calculator.calculate_current_daily_run_rate(
                total_ind_valid, report.report_date
            ),
            "ind_required_drr": self.calculator.calculate_required_daily_run_rate(
                ind_outstanding, report.report_date
            ),
            "bus_current_drr": self.calculator.calculate_current_daily_run_rate(
                total_bus_valid, report.report_date
            ),
            "bus_required_drr": self.calculator.calculate_required_daily_run_rate(
                bus_outstanding, report.report_date
            ),
            "team_scorecard": self.calculator.calculate_final_scorecard(
                ind_achievement, bus_achievement
            ),
            "total_fso_count": len(rows),
        }

    def rebuild_cluster_rankings(self) -> list[ClusterHeadRanking]:
        report = self.get_active_report()
        if report is None:
            return []
        self.db.execute(
            delete(ClusterHeadRanking).where(ClusterHeadRanking.report_id == report.id)
        )
        cluster_heads = list(
            self.db.scalars(
                select(User).where(User.position == UserPosition.CLUSTER_HEAD, User.is_active.is_(True))
            ).all()
        )
        rankings: list[ClusterHeadRanking] = []
        for cluster_head in cluster_heads:
            aggregate = self.aggregate_cluster_performance(cluster_head.id)
            if not aggregate:
                continue
            ranking = ClusterHeadRanking(**aggregate)
            self.db.add(ranking)
            rankings.append(ranking)
        rankings.sort(key=lambda row: row.team_scorecard, reverse=True)
        previous_score = None
        previous_rank = 0
        for index, row in enumerate(rankings, start=1):
            if previous_score is not None and row.team_scorecard == previous_score:
                row.cluster_rank = previous_rank
            else:
                row.cluster_rank = index
                previous_rank = index
            previous_score = row.team_scorecard
        self.db.flush()
        return rankings
