"""add performance indexes

Revision ID: 202605292000
Revises: 202605291900
Create Date: 2026-05-29 20:00:00
"""
from alembic import op

revision = "202605292000"
down_revision = "202605291900"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users.position — queried heavily in role checks
    op.create_index("ix_users_position", "users", ["position"])

    # performance_data — report_id FK had no explicit index
    op.create_index("ix_performance_data_report_id", "performance_data", ["report_id"])
    op.create_index("ix_performance_data_user_id", "performance_data", ["user_id"])

    # processed_performance.fso_rank — used in leaderboard ORDER BY / filter
    op.create_index("ix_processed_performance_fso_rank", "processed_performance", ["fso_rank"])

    # ai_insights.is_current — filtered on every insight lookup
    op.create_index("ix_ai_insights_is_current", "ai_insights", ["is_current"])


def downgrade() -> None:
    op.drop_index("ix_ai_insights_is_current", table_name="ai_insights")
    op.drop_index("ix_processed_performance_fso_rank", table_name="processed_performance")
    op.drop_index("ix_performance_data_user_id", table_name="performance_data")
    op.drop_index("ix_performance_data_report_id", table_name="performance_data")
    op.drop_index("ix_users_position", table_name="users")
