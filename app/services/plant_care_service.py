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

    def create_care_log(self, data: dict) -> PlantCare:
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

        care_log = PlantCare(**data)
        self.db.add(care_log)
        try:
            self.db.commit()
            self.db.refresh(care_log)
        except IntegrityError:
            self.db.rollback()
            raise
        return care_log

    def get_care_log_by_id(self, care_id: int) -> Optional[PlantCare]:
        """Fetches a single PlantCare by its ID.

        Args:
            care_id (int): The primary key of the PlantCare to retrieve.

        Returns:
            PlantCare or None: Found PlantCare or None if not found.
        """
        return self.db.query(PlantCare).filter_by(id=care_id).first()

    def get_plant_care_logs(self, plant_id: int) -> List[PlantCare]:
        """Fetches all PlantCare logs for a specified Plant.

        Args:
            plant_id (int):
                - The primary key of the plant to get the care logs for.

        Returns:
            List[PlantCare] or []:
                - All care logs for the plant, or an empty list.
        """
        return self.db.query(PlantCare).filter_by(plant_id=plant_id).all()
