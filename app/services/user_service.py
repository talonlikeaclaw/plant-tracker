from app.models import User
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from datetime import date


class UserService:
    """Service class that handles business logic for User operations

    Attributes:
        db (Session):
            - SQLAlchemy session used to interact with the database.
    """

    def __init__(self, db: Session):
        """Initializes the UserService with a given SQLAlchemy session.

        Args:
            db (Session):
                - An active SQLAlchemy session.
        """
        self.db = db

    def create_user(self, data: dict) -> User:
        """Creates a new User record in the database.

        Args:
            data (dict): A dictionary containing the fields for the User:
                - 'username' (str, required, unique)
                - 'email' (str, required, unique)
                - 'password_hash' (str, required)
                - 'created_at' (date, auto)

        Returns:
            User:
                - The User object with a populated ID and commited state.

        Raises:
            ValueError: If required field is missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("username"):
            raise ValueError("username is required")

        if not data.get("email"):
            raise ValueError("email is required")

        if not data.get("password_hash"):
            raise ValueError("password_hash is required")

        data["created_at"] = date.today()

        user = User(**data)
        self.db.add(user)
        try:
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise
        return user

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Fetches a single User by their ID.

        Args:
            user_id (int): The primary key of the User to retrieve.

        Returns:
            User or None: Found User or None if not found.
        """
        return self.db.query(User).filter_by(id=user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Fetches a single User by their email.

        Args:
            email (str): The email of the User to retrieve.

        Returns:
            User or None: Found User or None if not found.
        """
        return self.db.query(User).filter_by(email=email).first()

    def get_all_users(self) -> List[User]:
        """Fetches all Users from the database.

        Returns:
            List[User] or []: All Users in a list or an empty list.
        """
        return self.db.query(User).all()

    def update_user(self, user_id: int, updates: dict) -> Optional[User]:
        """Updates fields of an existing User.

        Args:
            user_id (int): ID of the User to update.
            updates (dict): Fields to update.

        Returns:
            User or None: Updated User or None if not found.
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        for key, value in updates.items():
            if hasattr(user, key):
                setattr(user, key, value)

        try:
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise
        return user

    def delete_user(self, user_id: int) -> bool:
        """Deletes a User from the database.

        Args:
            user_id (int): ID of the User to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()
        return True
