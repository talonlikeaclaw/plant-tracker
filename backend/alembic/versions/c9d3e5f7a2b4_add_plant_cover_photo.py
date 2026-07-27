"""Add explicit plant cover photo

Revision ID: c9d3e5f7a2b4
Revises: b4e36d8a9c12
Create Date: 2026-07-27 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9d3e5f7a2b4"
down_revision: Union[str, None] = "b4e36d8a9c12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Store the selected cover independently of photo ownership and ordering."""
    op.add_column("plants", sa.Column("cover_photo_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_plants_cover_photo_id_photos",
        "plants",
        "photos",
        ["cover_photo_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.execute(
        """
        UPDATE plants
        SET cover_photo_id = (
            SELECT id
            FROM photos
            WHERE photos.plant_id = plants.id
            ORDER BY position ASC, created_at ASC
            LIMIT 1
        )
        """
    )


def downgrade() -> None:
    """Remove the explicit cover reference."""
    op.drop_constraint("fk_plants_cover_photo_id_photos", "plants", type_="foreignkey")
    op.drop_column("plants", "cover_photo_id")
