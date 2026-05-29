"""processed performance and cluster rankings

Revision ID: 202605291820
Revises: 202605291650
Create Date: 2026-05-29 18:20:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "202605291820"
down_revision = "202605291650"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "processed_performance",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dao_code", sa.String(length=64), nullable=False),
        sa.Column("ind_target", sa.Integer(), nullable=False),
        sa.Column("ind_actual", sa.Integer(), nullable=False),
        sa.Column("ind_valid", sa.Integer(), nullable=False),
        sa.Column("ind_invalid_count", sa.Integer(), nullable=False),
        sa.Column("ind_percentage_invalid", sa.Integer(), nullable=False),
        sa.Column("ind_percentage_achievement", sa.Integer(), nullable=False),
        sa.Column("ind_current_drr", sa.Integer(), nullable=False),
        sa.Column("ind_required_drr", sa.Integer(), nullable=False),
        sa.Column("bus_target", sa.Integer(), nullable=False),
        sa.Column("bus_actual", sa.Integer(), nullable=False),
        sa.Column("bus_valid", sa.Integer(), nullable=False),
        sa.Column("bus_invalid_count", sa.Integer(), nullable=False),
        sa.Column("bus_percentage_invalid", sa.Integer(), nullable=False),
        sa.Column("bus_percentage_achievement", sa.Integer(), nullable=False),
        sa.Column("bus_current_drr", sa.Integer(), nullable=False),
        sa.Column("bus_required_drr", sa.Integer(), nullable=False),
        sa.Column("ind_score", sa.Integer(), nullable=False),
        sa.Column("bus_score", sa.Integer(), nullable=False),
        sa.Column("final_scorecard", sa.Integer(), nullable=False),
        sa.Column("fso_rank", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_processed_performance_report_id"), "processed_performance", ["report_id"], unique=False)
    op.create_index(op.f("ix_processed_performance_user_id"), "processed_performance", ["user_id"], unique=False)
    op.create_index(op.f("ix_processed_performance_dao_code"), "processed_performance", ["dao_code"], unique=False)

    op.create_table(
        "cluster_head_rankings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cluster_head_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("total_ind_target", sa.Integer(), nullable=False),
        sa.Column("total_ind_valid", sa.Integer(), nullable=False),
        sa.Column("total_ind_actual", sa.Integer(), nullable=False),
        sa.Column("total_bus_target", sa.Integer(), nullable=False),
        sa.Column("total_bus_valid", sa.Integer(), nullable=False),
        sa.Column("total_bus_actual", sa.Integer(), nullable=False),
        sa.Column("ind_percentage_achievement", sa.Integer(), nullable=False),
        sa.Column("bus_percentage_achievement", sa.Integer(), nullable=False),
        sa.Column("ind_current_drr", sa.Integer(), nullable=False),
        sa.Column("ind_required_drr", sa.Integer(), nullable=False),
        sa.Column("bus_current_drr", sa.Integer(), nullable=False),
        sa.Column("bus_required_drr", sa.Integer(), nullable=False),
        sa.Column("team_scorecard", sa.Integer(), nullable=False),
        sa.Column("cluster_rank", sa.Integer(), nullable=True),
        sa.Column("total_fso_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["cluster_head_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cluster_head_rankings_report_id"), "cluster_head_rankings", ["report_id"], unique=False)
    op.create_index(op.f("ix_cluster_head_rankings_cluster_head_id"), "cluster_head_rankings", ["cluster_head_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cluster_head_rankings_cluster_head_id"), table_name="cluster_head_rankings")
    op.drop_index(op.f("ix_cluster_head_rankings_report_id"), table_name="cluster_head_rankings")
    op.drop_table("cluster_head_rankings")
    op.drop_index(op.f("ix_processed_performance_dao_code"), table_name="processed_performance")
    op.drop_index(op.f("ix_processed_performance_user_id"), table_name="processed_performance")
    op.drop_index(op.f("ix_processed_performance_report_id"), table_name="processed_performance")
    op.drop_table("processed_performance")
