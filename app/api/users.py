from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.decorators.auth import require_user_id
from app.models.database import SessionLocal
from app.services.user_service import UserService
from app.services.auth_service import AuthService

user_bp = Blueprint("user", __name__)


@user_bp.route("", methods=["GET"])
@jwt_required()
@require_user_id
def get_user(user_id):
    """Gets a User by their ID and returns their info.

    Args:
        user_id (int): The ID of the User to retrieve.
    """
    db = SessionLocal()
    user_service = UserService(db)

    try:
        user = user_service.get_user_by_id(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Respond
        return jsonify(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            }
        ), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@user_bp.route("", methods=["PATCH"])
@jwt_required()
@require_user_id
def update_user(user_id):
    """Updates a User's information.

    Args:
        user_id (int): The ID of the User to update.
    """
    db = SessionLocal()
    user_service = UserService(db)

    try:
        # Parse and validate fields
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")

        if not username and not email:
            return jsonify({"error":
                            "Provide at least one field to update"}), 400

        # Create updates dictionary
        updates = {}
        if username:
            updates["username"] = username
        if email:
            updates["email"] = email

        # Update User
        updated_user = user_service.update_user(user_id, updates)

        if not updated_user:
            return jsonify({"error": "Failed to update user"}), 400

        # Respond
        return jsonify(
            {
                "message": "User info updated successfully!",
                "user": {
                    "id": updated_user.id,
                    "username": updated_user.username,
                    "email": updated_user.email,
                },
            }
        ), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@user_bp.route("/password", methods=["PATCH"])
@jwt_required()
@require_user_id
def update_password(user_id):
    """Updates a User's password.

    Args:
        user_id (int): The ID of the User to update.
    """
    db = SessionLocal()
    user_service = UserService(db)
    auth_service = AuthService(user_service)

    try:
        data = request.get_json()

        email = data.get("email")
        old_password = data.get("old_password")
        new_password = data.get("new_password")
        confirm_password = data.get("confirm_password")

        if not (
            email and old_password and new_password and confirm_password
        ):
            return jsonify({"error":
                            "All fields are required"}), 400

        if new_password != confirm_password:
            return jsonify(
                {"error":
                 "The new_password and confirm_passwond fields must match."}
            ), 400

        user = auth_service.authenticate_user(email, old_password)
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        hashed_password = auth_service.hash_password(new_password)
        user_service.update_user(user_id, {"password_hash": hashed_password})

        return jsonify({"message": "Password updated successfully!"}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
