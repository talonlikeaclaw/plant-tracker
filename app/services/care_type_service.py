from app.models import CareType
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List


class CareTypeService:
    """Service class that handles business logic for CareType operations.

    Attributes:
        db (Session):
            - SQLAlchemy session used to interact with the database.
    """

    def __init__(self, db: Session):
        """Initializes the CareTypeService with a given SQLAlchemy session.

        Args:
            db (Session):
                - An active SQLAlchemy session.
        """
        self.db = db

    def create_care_type(self, data: dict) -> CareType:
        """Creates a new CareType record in the database.

        Args:
            data (dict): A dictionary containing the fields for the CareType:
                - 'user_id' (int, optional)
                - 'name' (str, required)
                - 'description' (str, optional)

        Returns:
            CareType:
                - The CareType object with a populated ID and commited state.

        Raises:
            ValueError: If required field is missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("name"):
            raise ValueError("name is required")

        care_type = CareType(**data)
        self.db.add(care_type)
        try:
            self.db.commit()
            self.db.refresh(care_type)
        except IntegrityError:
            self.db.rollback()
            raise
        return care_type
