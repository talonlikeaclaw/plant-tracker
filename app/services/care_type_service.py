from sqlalchemy import false
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

    def get_care_type_by_id(self, care_type_id: int) -> Optional[CareType]:
        """Fetches a single CareType by its ID.

        Args:
            care_type_id (int): The primary key of the CareType to retrieve.

        Returns:
            CareType or None: Found CareType or None if not found.
        """
        return self.db.query(CareType).filter_by(id=care_type_id).first()

    def get_care_types_by_user_id(self, user_id: int) -> List[CareType]:
        """Fetches all CareTypes for a particular User.

        Args:
            user_id (int):
                - The primary key of the User to get the Care Types for.

        Returns:
            List[CareType] or []:
                - All Care Types for the User, or an empty list.
        """
        return (
            self.db.query(CareType)
            .filter_by(user_id=user_id)
            .order_by(CareType.name.desc())
            .all()
        )

    def get_default_care_types(self) -> List[CareType]:
        """Fetches all CareTypes without a user_id associated with them.

        Returns:
            List[CareType]:
                - All default Care Types not bound to a User
        """
        return (
            self.db.query(CareType)
            .filter_by(user_id=None)
            .order_by(CareType.name.desc())
            .all()
        )

    def update_care_type(self, care_type_id: int, updates: dict) -> Optional[CareType]:
        """Updates fields of an existing Care Type.

        Args:
            care_type_id (int): ID of the Care Type to update.
            updates (dict): Fields to update.

        Returns:
            CareType or None: Updated Care Log or None if not found.
        """
        care_type = self.get_care_type_by_id(care_type_id)
        if not care_type:
            return None

        for key, value in updates.items():
            if hasattr(care_type, key):
                setattr(care_type, key, value)

        try:
            self.db.commit()
            self.db.refresh(care_type)
        except IntegrityError:
            self.db.rollback()
            raise
        return care_type

    def delete_care_type(self, care_type_id: int) -> bool:
        """Deletes a Care Type from the database.

        Args:
            care_type_id (int): ID of the Care Type to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        care_type = self.get_care_type_by_id(care_type_id)
        if not care_type:
            return False

        self.db.delete(care_type)
        self.db.commit()
        return True
