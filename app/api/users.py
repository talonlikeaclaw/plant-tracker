from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.database import SessionLocal
from app.services.user_service import UserService
from app.services.auth_service import AuthService

user_bp = Blueprint("user", __name__)


@user_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    """Gets a User by their ID and returns their info.

    Args:
        user_id (int): The ID of the User to retrieve.
    """
    db = SessionLocal()
    user_service = UserService(db)

    # Ensure User can only see their own information.
    current_user_id = int(get_jwt_identity())
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        user = user_service.get_user_by_id(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Respond
        return jsonify(
            {
                "user": {
                    "user_id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            }
        ), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
