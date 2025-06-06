from app.models import Plant
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError


class PlantService:
    """Service class that handles business logic for Plant operations

    Attributes:
        db (Session):
            - SQLAlchemy session used to interact with the database.
    """

    def __init__(self, db: Session):
        """Intializaes the PlantService with a given SQLAlchemy sessions.

        Args:
            db (Session):
                - An active SQLAlchemy session.
        """
        self.db = db

    def create_plant(self, data: dict) -> Plant:
        """Creates a new Plant record in the database

        Args:
            data (dict): A dictionary containing the fields for the Plant:
                - 'nickname' (str, required)
                - 'user_id' (int, required)
                - 'species_id' (int, optional)
                - 'date_added' (date, optional)
                - 'last_watered' (date, optional)
                - 'location' (str, optional)

        Returns:
            Plant:
                - The created Plant object with a populated ID and commited state.

        Raises:
            ValueError: If required fields are missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("nickname"):
            raise ValueError("nickname is required")
        if not data.get("user_id"):
            raise ValueError("user_id is required")

        plant = Plant(**data)
        self.db.add(plant)
        try:
            self.db.commit()
            self.db.refresh(plant)
        except IntegrityError:
            self.db.rollback()
            raise
        return plant
