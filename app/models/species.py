from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.models.database import Base


class Species(Base):
    """Represents a particular Plant species"""
    __tablename__ = "species"

    id = Column(Integer, primary_key=True, index=True)
    common_name = Column(String, nullable=False)
    scientific_name = Column(String)
    sunlight = Column(String)
    water_requirements = Column(String)
    perenual_id = Column(Integer)

    plants = relationship("Plant", back_populates="species")
