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

    def create_plant(self, data: dict):
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
                - The Plant object with a populated ID and commited state.

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

    def get_plant(self, plant_id: int):
        """Fetches a single Plant by its ID.

        Args:
            plant_id (int): The primary key of the Plant to retrieve.

        Returns:
            Plant or None: Found plant or None if not found.
        """
        return self.db.query(Plant).filter_by(id=plant_id).first()

    def get_user_plants(self, user_id: int):
        """Gets all plants that belong to a specific user.

        Args:
            user_id (int): User's ID.

        Returns:
            List[Plant]: All associated plants.
        """
        return self.db.query(Plant).filter_by(user_id=user_id).all()

    def update_plant(self, plant_id: int, updates: dict):
        """Updates fields of an existing plant.

        Args:
            plant_id (int): ID of the plant to update.
            updates (dict): Fields to update.

        Returns:
            Plant or None: Updated plant or None if not found.
        """
        plant = self.get_plant(plant_id)
        if not plant:
            return None

        for key, value in updates.items():
            if hasattr(plant, key):
                setattr(plant, key, value)

        try:
            self.db.commit()
            self.db.refresh(plant)
        except IntegrityError:
            self.db.rollback()
            raise
        return plant
