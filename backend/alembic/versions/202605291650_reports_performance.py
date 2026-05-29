"""reports and performance data

Revision ID: 202605291650
Revises: 202605291500
Create Date: 2026-05-29 16:50:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "202605291650"
down_revision = "202605291500"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reports_report_date"), "reports", ["report_date"], unique=False)

    op.create_table(
        "performance_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dao_code", sa.String(length=64), nullable=False),
        sa.Column("ind_target", sa.Integer(), nullable=False),
        sa.Column("ind_actual", sa.Integer(), nullable=False),
        sa.Column("ind_valid", sa.Integer(), nullable=False),
        sa.Column("bus_target", sa.Integer(), nullable=False),
        sa.Column("bus_actual", sa.Integer(), nullable=False),
        sa.Column("bus_valid", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_performance_data_dao_code"), "performance_data", ["dao_code"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_performance_data_dao_code"), table_name="performance_data")
    op.drop_table("performance_data")
    op.drop_index(op.f("ix_reports_report_date"), table_name="reports")
    op.drop_table("reports")
