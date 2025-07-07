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
