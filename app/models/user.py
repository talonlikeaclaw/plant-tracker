from flask_login import UserMixin


class User(UserMixin):
    """Represents a User in the system"""

    def __init__(self, **kwargs):
        """Initializes a User"""
        self.id = kwargs.get("id")
        self.username = kwargs.get("username")
        self.email = kwargs.get("email")
        self.password_hash = kwargs.get("password_hash")
        self.created_at = kwargs.get("created_at")
