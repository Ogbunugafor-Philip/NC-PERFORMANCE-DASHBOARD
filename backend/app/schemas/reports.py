import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class PerformanceRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    dao_code: str
    ind_target: int
    ind_actual: int
    ind_valid: int
    bus_target: int
    bus_actual: int
    bus_valid: int


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    report_date: date
    uploaded_by: uuid.UUID
    uploaded_at: datetime
    is_active: bool


class ReportStatus(BaseModel):
    active_report: ReportOut | None
    total_reports: int
    total_records: int


class UploadValidation(BaseModel):
    total_records: int
    matched_dao_codes: list[str]
    unmatched_dao_codes: list[str]
    duplicate_dao_codes: list[str]
    missing_required_fields: list[str]


class ReportUploadResponse(BaseModel):
    report: ReportOut
    validation: UploadValidation
    records_created: int


class DashboardMetric(BaseModel):
    target: int
    actual: int
    valid: int
    invalid: int
    invalid_percentage: float
    achievement_percentage: float
    current_daily_run_rate: float
    required_daily_run_rate: float


class LeaderboardRow(BaseModel):
    rank: int
    user_id: uuid.UUID
    name: str
    dao_code: str
    position: str
    cluster_head_id: uuid.UUID | None = None
    ind_achievement_percentage: float
    bus_achievement_percentage: float
    scorecard: float


class DashboardSummary(BaseModel):
    report_date: date | None
    individual: DashboardMetric
    business: DashboardMetric
    scorecard: float
    ranking: str
    team_summary: dict[str, float | int | str | None]
    leaderboard: list[LeaderboardRow]
    cluster_leaderboard: list[LeaderboardRow]
