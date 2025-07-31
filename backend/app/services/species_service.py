from app.models import Species
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List


class SpeciesService:
    """Service class that handles business logic for Species operations

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

    def create_species(self, data: dict) -> Species:
        """Creates a new Species record in the database.

        Args:
            data (dict): A dictionary containing the fields for the Species:
                - 'common_name' (str, required)
                - 'scientific_name' (str, optional)
                - 'sunlight' (str, optional)
                - 'water_requirements' (str, optional)

        Returns:
            Species:
                - The Species object with a populated ID and commited state.

        Raises:
            ValueError: If required field is missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("common_name"):
            raise ValueError("common_name is required")

        species = Species(**data)
        self.db.add(species)
        try:
            self.db.commit()
            self.db.refresh(species)
        except IntegrityError:
            self.db.rollback()
            raise
        return species

    def get_species(self, species_id: int) -> Optional[Species]:
        """Fetches a single Species by its ID.

        Args:
            species_id (int): The primary key of the Species to retrieve.

        Returns:
            Species or None: Found Species or None if not found.
        """
        return self.db.query(Species).filter_by(id=species_id).first()

    def get_all_species(self) -> List[Species]:
        """Fetches all Species from the database.

        Returns:
            List[Species] or []: All species in a list or an empty list.
        """
        return self.db.query(Species).all()

    def update_species(self, species_id: int, updates: dict) -> Optional[Species]:
        """Updates fields of an existing species.

        Args:
            species_id (int): ID of the species to update.
            updates (dict): Fields to update.

        Returns:
            Species or None: Updated species or None if not found.
        """
        species = self.get_species(species_id)
        if not species:
            return None

        for key, value in updates.items():
            if hasattr(species, key):
                setattr(species, key, value)

        try:
            self.db.commit()
            self.db.refresh(species)
        except IntegrityError:
            self.db.rollback()
            raise
        return species

    def delete_species(self, species_id: int) -> bool:
        """Deletes a species from the database.

        Args:
            species_id (int): ID of the species to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        species = self.get_species(species_id)
        if not species:
            return False

        self.db.delete(species)
        self.db.commit()
        return True
