from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.models.database import Base
from flask_login import UserMixin
from datetime import datetime, timezone


class User(Base, UserMixin):
    """Represents a User in the system"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    plants = relationship("Plant", back_populates="user", cascade="all, delete")
    care_types = relationship("CareType", back_populates="user", cascade="all, delete")
    care_plans = relationship("CarePlan", back_populates="user", cascade="all, delete")
