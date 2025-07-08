from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.decorators.auth import require_user_id
from app.models.database import SessionLocal
from app.services.care_type_service import CareTypeService

care_type_bp = Blueprint("care_type", __name__)


@care_type_bp.route("/default/", methods=["GET"])
@jwt_required()
@require_user_id
def get_default_care_types(user_id):
    """Gets all of the Care Types without a user_id."""
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
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


@care_type_bp.route("/user/", methods=["GET"])
@jwt_required()
@require_user_id
def get_user_care_types(user_id):
    """Gets all of the Care Types for a user."""
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
        # Get all Care Types
        care_types = care_type_service.get_care_types_by_user_id(user_id)

        # Convert Care Types into List of Dictionaries
        care_types_list = []
        for care_type in care_types:
            care_types_list.append(
                {
                    "id": care_type.id,
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


@care_type_bp.route("/<int:care_type_id>", methods=["GET"])
@jwt_required()
@require_user_id
def get_care_type_by_id(user_id, care_type_id):
    """Gets a Care Type by its ID."""
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
        # Get Care Type
        care_type = care_type_service.get_care_type_by_id(care_type_id)

        if not care_type:
            return jsonify({"error": "Care type not found"}), 404

        # Respond
        return jsonify({
            "care_type": {
                "id": care_type.id,
                "user_id": care_type.user_id,
                "name": care_type.name,
                "description": care_type.description,
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@care_type_bp.route("", methods=["POST"])
@jwt_required()
@require_user_id
def create_care_type(user_id):
    """Creates a new Care Type."""
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
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
            "care_type": {
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


@care_type_bp.route("/<int:care_type_id>", methods=["PATCH"])
@jwt_required()
@require_user_id
def update_care_type(user_id, care_type_id):
    """Updates a Care Type's information.

    Args:
        care_type_id (int): The ID of the Care Type to update.
    """
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
        # Ensure Care Type exists
        care_type = care_type_service.get_care_type_by_id(care_type_id)

        if not care_type:
            return jsonify({"error": "Care Type not found"}), 404

        if care_type.user_id != user_id:  # type: ignore
            return jsonify(
                {"error": "Unauthorized: Care Type does not belong to you."}
            ), 403

        # Get and validate request data
        data = request.get_json()
        allowed_fields = ["name", "description"]
        updates = {k: v for k, v in data.items() if k in allowed_fields}

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        # Update Care Type and validate success
        updated_care_type = care_type_service.update_care_type(
            care_type_id, updates)

        if not updated_care_type:
            return jsonify({"error": "Updated Care Type was not found"}), 500

        # Respond
        return jsonify({
            "message": "Care Type updated successfully!",
            "care_type": {
                "id": updated_care_type.id,
                "user_id": updated_care_type.user_id,
                "name": updated_care_type.name,
                "description": updated_care_type.description
            }
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@care_type_bp.route("/<int:care_type_id>", methods=["DELETE"])
@jwt_required()
@require_user_id
def delete_care_type(user_id, care_type_id):
    """Deletes a User's Care Type by ID.

    Args:
        care_type_id (int): The ID of the Care Type to delete.
    """
    db = SessionLocal()
    care_type_service = CareTypeService(db)

    try:
        # Verify Care Type exists and user owns it
        care_type = care_type_service.get_care_type_by_id(care_type_id)

        if not care_type:
            return jsonify({"error": "Care Type not found"}), 404

        if care_type.user_id != user_id:  # type: ignore
            return jsonify(
                {"error":
                 "Unauthorized: Care Type does not belong to you"}
            ), 403

        # Delete Care Type and verify delete worked
        deleted = care_type_service.delete_care_type(care_type_id)

        if not deleted:
            return jsonify({"error": "Care Type was not deleted"}), 404

        # Respond
        return jsonify({"message": "Care Type deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
