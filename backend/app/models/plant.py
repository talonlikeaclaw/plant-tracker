from sqlalchemy import Column, Integer, String, ForeignKey, Date
from app.models.database import Base
from sqlalchemy.orm import relationship


class Plant(Base):
    """Represents a User's owned Plant"""
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"))
    nickname = Column(String, nullable=False)
    date_added = Column(Date)
    last_watered = Column(Date)
    location = Column(String)

    user = relationship("User", back_populates="plants")
    species = relationship("Species", back_populates="plants")
    care_logs = relationship(
        "PlantCare",
        back_populates="plant",
        cascade="all, delete")
