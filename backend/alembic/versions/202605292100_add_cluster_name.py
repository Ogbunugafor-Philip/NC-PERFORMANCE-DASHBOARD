"""add cluster_name to users

Revision ID: 202605292100
Revises: 202605292000
Create Date: 2026-05-29
"""

import sqlalchemy as sa
from alembic import op


revision = "202605292100"
down_revision = "202605292000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "cluster_name" not in columns:
        op.add_column("users", sa.Column("cluster_name", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "cluster_name")
