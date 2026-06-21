from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.database import Base


class Photo(Base):
    """Represents a photo attached to a Plant or a PlantCare"""

    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(
        Integer,
        ForeignKey("plants.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    care_log_id = Column(
        Integer,
        ForeignKey("plant_care.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    filename = Column(String, nullable=False)
    original_filename = Column(String)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    width = Column(Integer)
    height = Column(Integer)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    plant = relationship("Plant", back_populates="photos")
    care_log = relationship("PlantCare", back_populates="photos")
