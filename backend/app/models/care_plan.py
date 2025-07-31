from sqlalchemy import Column, Integer, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.database import Base


class CarePlan(Base):
    """Represents a recurring Care Type occuring in the future"""

    __tablename__ = "care_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    care_type_id = Column(Integer, ForeignKey("care_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    frequency_days = Column(Integer, nullable=False)
    note = Column(Text)
    active = Column(Boolean)

    user = relationship("User", back_populates="care_plans")
    plant = relationship("Plant", back_populates="care_plans")
    care_type = relationship("CareType", back_populates="care_plans")
