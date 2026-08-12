from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from app.models.database import SessionLocal
from app.services.user_service import UserService
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Registers a new user and returns a JWT access token."""
    db = SessionLocal()
    user_service = UserService(db)

    try:
        data = request.get_json()

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # Validate fields
        if not username or not email or not password:
            return jsonify(
                {"error":
                 "The username, email, and password fields are required"}
            ), 400

        # Hash password
        hashed_password = generate_password_hash(password)

        # Create User
        new_user = user_service.create_user(
            {"username": username, "email": email,
                "password_hash": hashed_password}
        )

        # Issue JWT tokens
        access_token = create_access_token(identity=str(new_user.id))
        refresh_token = create_refresh_token(identity=str(new_user.id))

        # Respond
        return jsonify(
            {
                "message": "User registered successfully!",
                "access_token": access_token,
                "refresh_token": refresh_token,
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

    try:
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        # Validate fields
        if not email or not password:
            return jsonify({"error":
                            "The email and password fields are required"}), 400

        # Authenticate user
        user = user_service.get_user_by_email(email)

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401

        # Issue JWT tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        # Respond
        return jsonify(
            {
                "message": f"User ({user.username}) logged in successfully!",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {"id": user.id,
                         "username": user.username,
                         "email": user.email},
            }
        ), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refreshes an access token using a refresh token."""
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token), 200
