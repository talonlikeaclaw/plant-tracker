from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.database import Base


class CareType(Base):
    """Represents a Type of Plant Care"""

    __tablename__ = "care_types"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    description = Column(String)

    user = relationship("User", back_populates="care_types")
    plant_care_logs = relationship(
        "PlantCare", back_populates="care_type", cascade="all, delete"
    )
    care_plans = relationship(
        "CarePlan", back_populates="care_type", cascade="all, delete"
    )
