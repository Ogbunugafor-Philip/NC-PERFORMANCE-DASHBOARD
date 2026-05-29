"""add file_path to reports

Revision ID: 202605292200
Revises: 202605292100
Create Date: 2026-05-29
"""

import sqlalchemy as sa
from alembic import op


revision = "202605292200"
down_revision = "202605292100"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("reports")}
    if "file_path" not in columns:
        op.add_column("reports", sa.Column("file_path", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("reports", "file_path")
