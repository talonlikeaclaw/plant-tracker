from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.database import SessionLocal
from app.services.plant_service import PlantService
from app.services.plant_care_service import PlantCareService

plant_care_bp = Blueprint("plant_care", __name__)


@plant_care_bp.route("/plant/<int:plant_id>", methods=["GET"])
@jwt_required()
def get_care_logs_by_plant(plant_id):
    """Gets all of the Care Logs for a Plant."""
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

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

        # Validate user owns Plant
        plant = plant_service.get_plant(plant_id)
        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error":
                            "Unauthorized access to this plant."}), 403

        # Get all Care Logs for plant
        care_logs = plant_care_service.get_plant_care_logs(plant_id)

        # Convert Care Logs into List of Dictionaries
        care_logs_list = []
        for log in care_logs:
            care_logs_list.append(
                {
                    "id": log.id,
                    "plant_id": log.plant_id,
                    "care_type_id": log.care_type_id,
                    "note": log.note,
                    "care_date": log.care_date.isoformat(),
                }
            )

        # Respond
        return jsonify({"care_logs": care_logs_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
@plant_care_bp.route("/<int:care_log_id>", methods=["GET"])
@jwt_required()
def get_care_log(care_log_id):
    """Gets a Care Log by its ID and returns its info.

    Args:
        care_log_id (int): The ID of the Care Log to retrieve.
    """
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    # Validate user identity
    current_user_id = get_jwt_identity()

    if current_user_id is None:
        return jsonify({"error": "Unauthorized: no identity in token"}), 401

    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        return jsonify({"error":
                        "Unauthorized: invalid identity in token"}), 401
    try:
        # Get Care Log and validate it exists
        care_log = plant_care_service.get_care_log_by_id(care_log_id)

        if not care_log:
            return jsonify({"error": "Care log not found"}), 404

        # Validate User is accessing Care Log for a Plant they own
        plant_id = care_log.plant_id  # type: ignore
        plant = plant_service.get_plant(plant_id)  # type: ignore

        if plant.user_id != current_user_id:  # type: ignore
            return jsonify({"error":
                            "Unauthorized access to this care log."}), 403

        # Respond
        return jsonify({
            "care_log": {
                "id": care_log.id,
                "plant_id": care_log.plant_id,
                "care_type_id": care_log.care_type_id,
                "note": care_log.note,
                "care_date": care_log.care_date.isoformat(),
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
