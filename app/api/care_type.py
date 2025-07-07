from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.database import SessionLocal
from app.services.care_type_service import CareTypeService

care_type_bp = Blueprint("care_type", __name__)


@care_type_bp.route("", methods=["GET"])
@jwt_required()
def get_default_care_types():
    """Gets all of the Care Types without a user_id."""
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
        # Validate User identity
        user_id = get_jwt_identity()

        if user_id is None:
            return jsonify({"error":
                            "Unauthorized: no identity in token"}), 401

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error":
                            "Unauthorized: invalid identity in token"}), 401

        # Get all Care Types
        care_types = care_type_service.get_default_care_types()

        # Convert Care Types into List of Dictionaries
        care_types_list = []
        for care_type in care_types:
            care_types_list.append(
                {
                    "id": care_type.id,
                    "user_id": care_type.user_id,
                    "name": care_type.name,
                    "description": care_type.description,
                }
            )

        # Respond
        return jsonify({"care_types": care_types_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@care_type_bp.route("", methods=["POST"])
@jwt_required()
def create_care_type():
    """Creates a new Care Type."""
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
        # Validate user identity
        user_id = get_jwt_identity()

        if user_id is None:
            return jsonify({"error":
                            "Unauthorized: no identity in token"}), 401

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error":
                            "Unauthorized: invalid identity in token"}), 401

        # Get request data
        data = request.get_json()

        name = data.get("name")
        description = data.get("description")

        # Validate required fields
        if not name:
            return jsonify(
                {"error": "The name field is required."}
            ), 400

        # Prepare Care Type data
        care_type_data = {
            "user_id": user_id,
            "name": name,
            "description": description
        }

        new_care_type = care_type_service.create_care_type(care_type_data)

        # Respond
        return jsonify({
            "message": "Care Type created successfully!",
            "species": {
                "id": new_care_type.id,
                "user_id": new_care_type.user_id,
                "name": new_care_type.name,
                "description": new_care_type.description
            }
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
