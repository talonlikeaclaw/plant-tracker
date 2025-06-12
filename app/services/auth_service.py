from app.services.user_service import UserService
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import Session
from typing import Optional


class AuthService:
    """Handles authentication logic such as hasing and login verification."""

    def __init__(self, user_service: UserService):
        """Initializes the AuthService with a user service dependency.

        Args:
            user_service (UserService): Instance of UserService to fetch users.
        """
        self.user_service = user_service
