import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=datetime.utcnow, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    uploader = relationship("User")
    performance_records: Mapped[list["PerformanceData"]] = relationship(
        "PerformanceData", back_populates="report", cascade="all, delete-orphan"
    )


class PerformanceData(Base):
    __tablename__ = "performance_data"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    dao_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    ind_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    report: Mapped[Report] = relationship("Report", back_populates="performance_records")
    user = relationship("User")


class ProcessedPerformance(Base):
    __tablename__ = "processed_performance"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dao_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    ind_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_invalid_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_percentage_invalid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_percentage_achievement: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_current_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_required_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_invalid_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_percentage_invalid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_percentage_achievement: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_current_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_required_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    final_scorecard: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fso_rank: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    report = relationship("Report")
    user = relationship("User")


class ClusterHeadRanking(Base):
    __tablename__ = "cluster_head_rankings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cluster_head_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    total_ind_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_ind_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_ind_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_bus_target: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_bus_valid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_bus_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_percentage_achievement: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_percentage_achievement: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_current_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ind_required_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_current_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bus_required_drr: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    team_scorecard: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cluster_rank: Mapped[int | None] = mapped_column(Integer)
    total_fso_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=datetime.utcnow, nullable=False
    )

    report = relationship("Report")
    cluster_head = relationship("User")
