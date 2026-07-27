"""Add photo capture timestamps

Revision ID: b4e36d8a9c12
Revises: 7c9f2a4b8e01
Create Date: 2026-07-27 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b4e36d8a9c12"
down_revision: Union[str, None] = "7c9f2a4b8e01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add a timeline timestamp, preserving existing upload timestamps."""
    op.add_column("photos", sa.Column("taken_at", sa.DateTime(), nullable=True))
    op.execute("UPDATE photos SET taken_at = COALESCE(created_at, CURRENT_TIMESTAMP)")
    op.alter_column("photos", "taken_at", nullable=False)


def downgrade() -> None:
    """Remove the capture timestamp."""
    op.drop_column("photos", "taken_at")
