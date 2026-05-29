from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import PerformanceData
from app.models.user import User, UserPosition
from app.schemas.reports import DashboardMetric, DashboardSummary, LeaderboardRow
from app.services.report_service import get_active_report, scoped_performance_query


def _pct(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def _metric(target: int, actual: int, valid: int) -> DashboardMetric:
    invalid = max(actual - valid, 0)
    return DashboardMetric(
        target=target,
        actual=actual,
        valid=valid,
        invalid=invalid,
        invalid_percentage=_pct(invalid, actual),
        achievement_percentage=_pct(valid, target),
        current_daily_run_rate=round(valid / 20, 2),
        required_daily_run_rate=round(max(target - valid, 0) / 10, 2),
    )


def _score(record: PerformanceData) -> float:
    return round((_pct(record.ind_valid, record.ind_target) + _pct(record.bus_valid, record.bus_target)) / 2, 2)


def _leaderboard(rows: list[tuple[PerformanceData, User]]) -> list[LeaderboardRow]:
    ranked = sorted(rows, key=lambda item: _score(item[0]), reverse=True)
    return [
        LeaderboardRow(
            rank=index,
            user_id=user.id,
            name=user.name,
            dao_code=user.dao_code,
            position=user.position.value,
            cluster_head_id=user.cluster_head_id,
            ind_achievement_percentage=_pct(record.ind_valid, record.ind_target),
            bus_achievement_percentage=_pct(record.bus_valid, record.bus_target),
            scorecard=_score(record),
        )
        for index, (record, user) in enumerate(ranked, start=1)
    ]


def dashboard_summary(db: Session, user: User) -> DashboardSummary:
    active_report, scoped_rows = scoped_performance_query(db, user)
    all_rows = []
    if active_report:
        all_rows = list(
            db.execute(
                select(PerformanceData, User)
                .join(User, User.id == PerformanceData.user_id)
                .where(PerformanceData.report_id == active_report.id)
            ).all()
        )

    target_rows = scoped_rows
    if user.position == UserPosition.FSO and not target_rows:
        target_rows = []

    ind_target = sum(record.ind_target for record, _ in target_rows)
    ind_actual = sum(record.ind_actual for record, _ in target_rows)
    ind_valid = sum(record.ind_valid for record, _ in target_rows)
    bus_target = sum(record.bus_target for record, _ in target_rows)
    bus_actual = sum(record.bus_actual for record, _ in target_rows)
    bus_valid = sum(record.bus_valid for record, _ in target_rows)

    individual = _metric(ind_target, ind_actual, ind_valid)
    business = _metric(bus_target, bus_actual, bus_valid)
    scorecard = round((individual.achievement_percentage + business.achievement_percentage) / 2, 2)
    leaderboard = _leaderboard(all_rows)
    user_rank = next((row.rank for row in leaderboard if row.user_id == user.id), None)
    ranking = f"{user_rank}th out of {len(leaderboard)} FSOs" if user_rank else "Not ranked"

    cluster_rows: list[LeaderboardRow] = []
    cluster_heads = [u for _, u in all_rows if u.cluster_head_id]
    for cluster_head_id in sorted({u.cluster_head_id for u in cluster_heads if u.cluster_head_id}, key=str):
        grouped = [(record, member) for record, member in all_rows if member.cluster_head_id == cluster_head_id]
        cluster_head = db.get(User, cluster_head_id)
        if not cluster_head:
            continue
        grouped_ind_target = sum(record.ind_target for record, _ in grouped)
        grouped_ind_valid = sum(record.ind_valid for record, _ in grouped)
        grouped_bus_target = sum(record.bus_target for record, _ in grouped)
        grouped_bus_valid = sum(record.bus_valid for record, _ in grouped)
        cluster_score = round((_pct(grouped_ind_valid, grouped_ind_target) + _pct(grouped_bus_valid, grouped_bus_target)) / 2, 2)
        cluster_rows.append(
            LeaderboardRow(
                rank=0,
                user_id=cluster_head.id,
                name=cluster_head.name,
                dao_code=cluster_head.dao_code,
                position=cluster_head.position.value,
                cluster_head_id=None,
                ind_achievement_percentage=_pct(grouped_ind_valid, grouped_ind_target),
                bus_achievement_percentage=_pct(grouped_bus_valid, grouped_bus_target),
                scorecard=cluster_score,
            )
        )
    cluster_rows = sorted(cluster_rows, key=lambda row: row.scorecard, reverse=True)
    for index, row in enumerate(cluster_rows, start=1):
        row.rank = index

    return DashboardSummary(
        report_date=active_report.report_date if active_report else None,
        individual=individual,
        business=business,
        scorecard=scorecard,
        ranking=ranking,
        team_summary={
            "total_team_target": ind_target + bus_target,
            "total_team_valid": ind_valid + bus_valid,
            "team_achievement_percentage": scorecard,
            "team_scorecard": scorecard,
            "team_ranking": "Not ranked",
            "team_current_daily_run_rate": individual.current_daily_run_rate + business.current_daily_run_rate,
            "team_required_daily_run_rate": individual.required_daily_run_rate + business.required_daily_run_rate,
        },
        leaderboard=_leaderboard(scoped_rows if user.position == UserPosition.CLUSTER_HEAD else all_rows),
        cluster_leaderboard=cluster_rows,
    )
