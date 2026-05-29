"""ai_insights table

Revision ID: 202605291900
Revises: 202605291820
Create Date: 2026-05-29 19:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "202605291900"
down_revision = "202605291820"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_insights",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("insight_text", sa.Text(), nullable=False),
        sa.Column("insight_source", sa.String(length=32), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_insights_report_id"), "ai_insights", ["report_id"], unique=False)
    op.create_index(op.f("ix_ai_insights_user_id"), "ai_insights", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_insights_user_id"), table_name="ai_insights")
    op.drop_index(op.f("ix_ai_insights_report_id"), table_name="ai_insights")
    op.drop_table("ai_insights")
