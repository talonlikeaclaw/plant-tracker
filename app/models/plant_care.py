from sqlalchemy import Column, Integer, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.models.database import Base


class PlantCare(Base):
    """Represents a log/action of PlantCare performed by a User"""
    __tablename__ = "plant_care"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    care_type_id = Column(Integer, ForeignKey("care_types.id"), nullable=False)
    note = Column(Text)
    care_date = Column(Date)

    plant = relationship("Plant", back_populates="care_logs")
    care_type = relationship("CareType", back_populates="plant_care_logs")
