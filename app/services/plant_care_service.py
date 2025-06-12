from app.models import PlantCare
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List


class PlantCareService:
    """Service class that handles business logic for PlantCare operations.

    Attributes:
        db (Session):
            - SQLAlchemy session used to interact with the database.
    """

    def __init__(self, db: Session):
        """Initializes the PlantCareService with a given SQLAlchemy session.

        Args:
            db (Session):
                - An active SQLAlchemy session.
        """
        self.db = db

    def create_plant_care(self, data: dict) -> PlantCare:
        """Creates a new PlantCare record in the database.

        Args:
            data (dict): A dictionary containing the fields for the PlantCare:
                - 'plant_id' (int, required)
                - 'care_type_id' (int, required)
                - 'note' (str, optional)
                - 'care_date' (date, optional)

        Returns:
            PlantCare:
                - The PlantCare object with a populated ID and commited state.

        Raises:
            ValueError: If required field is missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("plant_id"):
            raise ValueError("plant_id is required")

        if not data.get("care_type_id"):
            raise ValueError("care_type_id is required")

        plant_care = PlantCare(**data)
        self.db.add(plant_care)
        try:
            self.db.commit()
            self.db.refresh(plant_care)
        except IntegrityError:
            self.db.rollback()
            raise
        return plant_care
