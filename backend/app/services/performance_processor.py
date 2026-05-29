from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.report import PerformanceData, ProcessedPerformance, Report
from app.models.user import User, UserPosition
from app.services.calculation_engine import KPICalculator


class ProcessorService:
    def __init__(self, db: Session):
        self.db = db
        self.calculator = KPICalculator()

    def get_active_report(self) -> Report | None:
        return self.db.scalar(
            select(Report).where(Report.is_active.is_(True)).order_by(Report.uploaded_at.desc())
        )

    def process_report(self, report: Report | None = None) -> list[ProcessedPerformance]:
        active_report = report or self.get_active_report()
        if active_report is None:
            return []

        self.db.execute(
            delete(ProcessedPerformance).where(ProcessedPerformance.report_id == active_report.id)
        )
        records = list(
            self.db.scalars(
                select(PerformanceData)
                .join(User, User.id == PerformanceData.user_id)
                .where(
                    PerformanceData.report_id == active_report.id,
                    User.position == UserPosition.FSO,
                )
            ).all()
        )
        processed: list[ProcessedPerformance] = []
        for record in records:
            ind_invalid = self.calculator.calculate_invalid_count(record.ind_actual, record.ind_valid)
            ind_achievement = self.calculator.calculate_percentage_achievement(
                record.ind_valid, record.ind_target
            )
            ind_outstanding = self.calculator.calculate_accounts_outstanding(
                record.ind_target, record.ind_valid
            )
            bus_invalid = self.calculator.calculate_invalid_count(record.bus_actual, record.bus_valid)
            bus_achievement = self.calculator.calculate_percentage_achievement(
                record.bus_valid, record.bus_target
            )
            bus_outstanding = self.calculator.calculate_accounts_outstanding(
                record.bus_target, record.bus_valid
            )
            item = ProcessedPerformance(
                report_id=active_report.id,
                user_id=record.user_id,
                dao_code=record.dao_code,
                ind_target=record.ind_target,
                ind_actual=record.ind_actual,
                ind_valid=record.ind_valid,
                ind_invalid_count=ind_invalid,
                ind_percentage_invalid=self.calculator.calculate_percentage_invalid(
                    ind_invalid, record.ind_actual
                ),
                ind_percentage_achievement=ind_achievement,
                ind_current_drr=self.calculator.calculate_current_daily_run_rate(
                    record.ind_valid, active_report.report_date
                ),
                ind_required_drr=self.calculator.calculate_required_daily_run_rate(
                    ind_outstanding, active_report.report_date
                ),
                bus_target=record.bus_target,
                bus_actual=record.bus_actual,
                bus_valid=record.bus_valid,
                bus_invalid_count=bus_invalid,
                bus_percentage_invalid=self.calculator.calculate_percentage_invalid(
                    bus_invalid, record.bus_actual
                ),
                bus_percentage_achievement=bus_achievement,
                bus_current_drr=self.calculator.calculate_current_daily_run_rate(
                    record.bus_valid, active_report.report_date
                ),
                bus_required_drr=self.calculator.calculate_required_daily_run_rate(
                    bus_outstanding, active_report.report_date
                ),
                ind_score=int(self.calculator.calculate_scorecard_component(ind_achievement)),
                bus_score=int(self.calculator.calculate_scorecard_component(bus_achievement)),
                final_scorecard=self.calculator.calculate_final_scorecard(
                    ind_achievement, bus_achievement
                ),
            )
            self.db.add(item)
            processed.append(item)
        self.db.flush()
        return processed

    def run_full_pipeline(self, report: Report | None = None) -> dict[str, int]:
        from app.services.ranking_engine import ClusterHeadEngine, FSORankingEngine

        processed = self.process_report(report)
        ranked = FSORankingEngine(self.db).rank_active_report()
        clusters = ClusterHeadEngine(self.db).rebuild_cluster_rankings()
        self.db.commit()
        return {
            "processed_records": len(processed),
            "ranked_fsos": len(ranked),
            "ranked_clusters": len(clusters),
        }
