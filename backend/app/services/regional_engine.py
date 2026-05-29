from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.report import ClusterHeadRanking, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.services.ranking_engine import get_fso_rank_display


class RegionalEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_active_report(self) -> Report | None:
        return self.db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )

    def _fso_rows(self):
        report = self.get_active_report()
        if report is None:
            return None, []
        rows = list(
            self.db.execute(
                select(ProcessedPerformance, User)
                .join(User, User.id == ProcessedPerformance.user_id)
                .where(ProcessedPerformance.report_id == report.id)
                .order_by(ProcessedPerformance.fso_rank, ProcessedPerformance.dao_code)
            ).all()
        )
        return report, rows

    def _cluster_rows(self):
        report = self.get_active_report()
        if report is None:
            return None, []
        rows = list(
            self.db.execute(
                select(ClusterHeadRanking, User)
                .join(User, User.id == ClusterHeadRanking.cluster_head_id)
                .where(ClusterHeadRanking.report_id == report.id)
                .order_by(ClusterHeadRanking.cluster_rank, User.name)
            ).all()
        )
        return report, rows

    def fso_to_dict(self, row: ProcessedPerformance, user: User) -> dict:
        total = self.db.scalar(
            select(func.count(ProcessedPerformance.id)).where(
                ProcessedPerformance.report_id == row.report_id
            )
        ) or 0
        return {
            "user_id": str(user.id),
            "name": user.name,
            "dao_code": row.dao_code,
            "position": user.position.value,
            "cluster_head_id": str(user.cluster_head_id) if user.cluster_head_id else None,
            "rank": row.fso_rank or 0,
            "rank_display": get_fso_rank_display(row.fso_rank or 0) if row.fso_rank else "Unranked",
            "rank_total": total,
            "ind_target": row.ind_target,
            "ind_actual": row.ind_actual,
            "ind_valid": row.ind_valid,
            "ind_invalid_count": row.ind_invalid_count,
            "ind_percentage_invalid": row.ind_percentage_invalid,
            "ind_percentage_achievement": row.ind_percentage_achievement,
            "ind_current_drr": row.ind_current_drr,
            "ind_required_drr": row.ind_required_drr,
            "bus_target": row.bus_target,
            "bus_actual": row.bus_actual,
            "bus_valid": row.bus_valid,
            "bus_invalid_count": row.bus_invalid_count,
            "bus_percentage_invalid": row.bus_percentage_invalid,
            "bus_percentage_achievement": row.bus_percentage_achievement,
            "bus_current_drr": row.bus_current_drr,
            "bus_required_drr": row.bus_required_drr,
            "ind_score": row.ind_score,
            "bus_score": row.bus_score,
            "final_scorecard": row.final_scorecard,
        }

    def cluster_to_dict(self, row: ClusterHeadRanking, user: User) -> dict:
        return {
            "cluster_head_id": str(user.id),
            "name": user.name,
            "dao_code": user.dao_code,
            "rank": row.cluster_rank or 0,
            "total_ind_target": row.total_ind_target,
            "total_ind_valid": row.total_ind_valid,
            "total_ind_actual": row.total_ind_actual,
            "total_bus_target": row.total_bus_target,
            "total_bus_valid": row.total_bus_valid,
            "total_bus_actual": row.total_bus_actual,
            "ind_percentage_achievement": row.ind_percentage_achievement,
            "bus_percentage_achievement": row.bus_percentage_achievement,
            "ind_current_drr": row.ind_current_drr,
            "ind_required_drr": row.ind_required_drr,
            "bus_current_drr": row.bus_current_drr,
            "bus_required_drr": row.bus_required_drr,
            "team_scorecard": row.team_scorecard,
            "total_fso_count": row.total_fso_count,
        }

    def get_fso_leaderboard(self) -> list[dict]:
        _, rows = self._fso_rows()
        return [self.fso_to_dict(row, user) for row, user in rows]

    def get_top_performers(self, n: int = 10) -> list[dict]:
        return self.get_fso_leaderboard()[:n]

    def get_bottom_performers(self, n: int = 10) -> list[dict]:
        return list(reversed(self.get_fso_leaderboard()[-n:]))

    def get_cluster_leaderboard(self) -> list[dict]:
        _, rows = self._cluster_rows()
        return [self.cluster_to_dict(row, user) for row, user in rows]

    def get_regional_summary(self) -> dict:
        report, fso_rows = self._fso_rows()
        _, cluster_rows = self._cluster_rows()
        fso_data = [self.fso_to_dict(row, user) for row, user in fso_rows]
        cluster_data = [self.cluster_to_dict(row, user) for row, user in cluster_rows]
        total_ind_target = sum(item["ind_target"] for item in fso_data)
        total_bus_target = sum(item["bus_target"] for item in fso_data)
        total_ind_valid = sum(item["ind_valid"] for item in fso_data)
        total_bus_valid = sum(item["bus_valid"] for item in fso_data)
        score_total = sum(item["final_scorecard"] for item in fso_data)
        total_score = round(score_total / len(fso_data)) if fso_data else 0
        total_target = total_ind_target + total_bus_target
        total_valid = total_ind_valid + total_bus_valid
        regional_achievement = round((total_valid / total_target) * 100) if total_target else 0
        return {
            "report_date": report.report_date.isoformat() if report else None,
            "total_fsos": self.db.scalar(select(func.count(User.id)).where(User.position == UserPosition.FSO)) or 0,
            "total_cluster_heads": self.db.scalar(select(func.count(User.id)).where(User.position == UserPosition.CLUSTER_HEAD)) or 0,
            "total_ind_target": total_ind_target,
            "total_bus_target": total_bus_target,
            "total_target": total_target,
            "total_ind_valid": total_ind_valid,
            "total_bus_valid": total_bus_valid,
            "total_valid": total_valid,
            "regional_percentage_achievement": regional_achievement,
            "regional_scorecard": total_score,
            "top_performing_fso": fso_data[0] if fso_data else None,
            "bottom_performing_fso": fso_data[-1] if fso_data else None,
            "top_performing_cluster_head": cluster_data[0] if cluster_data else None,
            "bottom_performing_cluster_head": cluster_data[-1] if cluster_data else None,
        }
