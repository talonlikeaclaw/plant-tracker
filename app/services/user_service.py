from app.models import User
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List


class UserService:
    """Service class that handles business logic for User operations

    Attributes:
        db (Session):
            - SQLAlchemy session used to interact with the database.
    """

    def __init__(self, db: Session):
        """Initializes the SpeciesService with a given SQLAlchemy session.

        Args:
            db (Session):
                - An active SQLAlchemy session.
        """
        self.db = db
