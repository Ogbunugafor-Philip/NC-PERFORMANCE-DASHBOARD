"""initial users

Revision ID: 202605291500
Revises:
Create Date: 2026-05-29 15:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "202605291500"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_position = postgresql.ENUM(
        "ADMIN",
        "RSM",
        "CLUSTER_HEAD",
        "FSO",
        name="user_position",
        create_type=False,
    )
    user_position.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("dao_code", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("position", user_position, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_first_login", sa.Boolean(), nullable=False),
        sa.Column("cluster_head_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["cluster_head_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_dao_code"), "users", ["dao_code"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_dao_code"), table_name="users")
    op.drop_table("users")
    postgresql.ENUM(name="user_position").drop(op.get_bind(), checkfirst=True)
