from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.database import SessionLocal
from app.services.user_service import UserService
from app.services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Registers a new user and returns a JWT access token.

    Returns:
        JWT access token and new user infomation in JSON.
    """
    db = SessionLocal()
    user_service = UserService(db)
    auth_service = AuthService(user_service)

    try:
        data = request.get_json()

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # Validate fields
        if not username or not email or not password:
            return jsonify({"error": "username, email, and password are required"}), 400

        # Hash password
        hashed_password = auth_service.hash_password(password)

        # Create User
        new_user = user_service.create_user(
            {"username": username, "email": email, "password_hash": hashed_password}
        )

        # Issue JWT token
        access_token = create_access_token(identity=new_user.id)

        # Respone
        return jsonify(
            {
                "message": "User registered successfully",
                "access_token": access_token,
                "user": {
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email,
                },
            }
        ), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticates user and returns a JWT access token."""
    db = SessionLocal()
    user_service = UserService(db)
    auth_service = AuthService(user_service)

    try:
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        # Validate fields
        if not email or not password:
            return jsonify({"error": "email and password are required"}), 400

        # Authenticate user
        user = auth_service.authenticate_user(email, password)

        if not user:
            return jsonify({"error": "invalid email or password"}), 401

        # Issue JWT access token
        access_token = create_access_token(identity=user.id)

        # Respond
        return jsonify(
            {
                "message": f"{user.username} logged in!",
                "access_token": access_token,
                "user": {"id": user.id, "username": user.username, "email": user.email},
            }
        ), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
