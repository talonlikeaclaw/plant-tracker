from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.decorators.auth import require_user_id
from app.models.database import SessionLocal
from app.services.plant_service import PlantService
from app.services.plant_care_service import PlantCareService
from app.models.care_plan import CarePlan
from datetime import datetime

plant_care_bp = Blueprint("plant_care", __name__)


def serialize_care_plan(plan: CarePlan) -> dict:
    """Return a JSON dict from a care plan object"""
    return {
        "id": plan.id,
        "plant_id": plan.plant_id,
        "care_type_id": plan.care_type_id,
        "note": plan.note,
        "start_date": plan.start_date.isoformat(),
        "frequency_days": plan.frequency_days,
        "active": plan.active,
    }


@plant_care_bp.route("/plant/<int:plant_id>", methods=["GET"])
@jwt_required()
@require_user_id
def get_care_logs_by_plant(user_id, plant_id):
    """Gets all of the Care Logs for a Plant."""
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    try:
        # Validate user owns Plant
        plant = plant_service.get_plant(plant_id)

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized access to this plant."}), 403

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


@plant_care_bp.route("", methods=["POST"])
@jwt_required()
@require_user_id
def create_care_log(user_id):
    """Creates a new Care Log."""
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    try:
        # Get request data
        data = request.get_json()

        plant_id = data.get("plant_id")
        care_type_id = data.get("care_type_id")
        note = data.get("note")
        care_date = data.get("care_date")

        # Validate required fields
        if not plant_id or not care_type_id:
            return (
                jsonify(
                    {"error": "The plant_id and care_type_id fields are required."}
                ),
                400,
            )

        # Ensure user owns Plant
        plant = plant_service.get_plant(plant_id)

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized access to this plant."}), 403

        # Prepare Care Log data
        care_log_data = {
            "plant_id": plant_id,
            "care_type_id": care_type_id,
            "note": note,
            "care_date": care_date,
        }

        new_care_log = plant_care_service.create_care_log(care_log_data)

        # Respond
        return (
            jsonify(
                {
                    "message": "Care Log created successfully!",
                    "care_log": {
                        "id": new_care_log.id,
                        "plant_id": new_care_log.plant_id,
                        "care_type_id": new_care_log.care_type_id,
                        "note": new_care_log.note,
                        "care_date": (
                            new_care_log.care_date.isoformat()
                            if new_care_log.care_date
                            else None
                        ),  # type: ignore
                    },
                }
            ),
            201,
        )

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_care_bp.route("/care-plans", methods=["POST"])
@jwt_required()
@require_user_id
def create_care_plan(user_id):
    """Creates a new Care Plan"""
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    try:
        # Get request data
        data = request.get_json()

        plant_id = data.get("plant_id")
        care_type_id = data.get("care_type_id")
        note = data.get("note")
        start_date = data.get("start_date")
        frequency_days = data.get("frequency_days")
        active = data.get("active")

        # Validate required fields
        if not plant_id or not care_type_id:
            return (
                jsonify(
                    {"error": "The plant_id and care_type_id fields are required."}
                ),
                400,
            )

        plant = plant_service.get_plant(plant_id)

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:
            return jsonify({"error": "Unauthorized access to this plant."}), 403

        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date).date()
            except ValueError:
                return (
                    jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD."}),
                    400,
                )

        if active is None:
            active = True

        # Prepare data
        care_plan_data = {
            "plant_id": plant_id,
            "care_type_id": care_type_id,
            "note": note,
            "start_date": start_date,
            "frequency_days": frequency_days,
            "active": active,
        }

        # Create Care Plan and return json
        new_care_plan = plant_care_service.create_care_plan(care_plan_data)

        return (
            jsonify(
                {
                    "message": "Care Plan created successfully!",
                    "care_plan": {
                        "id": new_care_plan.id,
                        "plant_id": new_care_plan.plant_id,
                        "care_type_id": new_care_plan.care_type_id,
                        "note": new_care_plan.note,
                        "start_date": new_care_plan.start_date.isoformat(),
                        "frequency_days": new_care_plan.frequency_days,
                        "active": new_care_plan.active,
                    },
                }
            ),
            201,
        )

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_care_bp.route("/<int:care_log_id>", methods=["GET"])
@jwt_required()
@require_user_id
def get_care_log(user_id, care_log_id):
    """Gets a Care Log by its ID and returns its info.

    Args:
        care_log_id (int): The ID of the Care Log to retrieve.
    """
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    try:
        # Get Care Log and validate it exists
        care_log = plant_care_service.get_care_log_by_id(care_log_id)

        if not care_log:
            return jsonify({"error": "Care log not found"}), 404

        # Validate User is accessing Care Log for a Plant they own
        plant_id = care_log.plant_id  # type: ignore
        plant = plant_service.get_plant(plant_id)  # type: ignore

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized access to this care log."}), 403

        # Respond
        return (
            jsonify(
                {
                    "care_log": {
                        "id": care_log.id,
                        "plant_id": care_log.plant_id,
                        "care_type_id": care_log.care_type_id,
                        "note": care_log.note,
                        "care_date": care_log.care_date.isoformat(),
                    }
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_care_bp.route("/care-plans/upcoming", methods=["GET"])
@jwt_required()
@require_user_id
def get_upcoming_care_plans(user_id):
    """Returns a list of upcoming plant care tasks."""
    db = SessionLocal()
    plant_care_service = PlantCareService(db)

    try:
        upcoming_logs = plant_care_service.get_upcoming_care_logs(user_id)
        if not upcoming_logs:
            return jsonify({"error": "Unable to find any upcoming care plans."}), 404

        return jsonify(upcoming_logs), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_care_bp.route("/care-plans", methods=["GET"])
@jwt_required()
@require_user_id
def get_user_care_plans(user_id):
    """Returns a list of all a user's care plans."""
    db = SessionLocal()
    plant_care_service = PlantCareService(db)

    try:
        care_plans = plant_care_service.get_all_care_plans_for_user(user_id)
        if not care_plans:
            return jsonify({"error": "Unable to find any care plans."}), 404

        return jsonify([serialize_care_plan(plan) for plan in care_plans]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
@plant_care_bp.route("/<int:care_log_id>", methods=["PATCH"])
@jwt_required()
@require_user_id
def update_care_log(user_id, care_log_id):
    """Updates a Care Log's information.

    Args:
        user_id (int): The ID of the user making the request.
        care_log_id (int): The ID of the Care Log to update.
    """
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    try:
        # Ensure Care Log exists
        care_log = plant_care_service.get_care_log_by_id(care_log_id)

        if not care_log:
            return jsonify({"error": "Care Log not found"}), 404

        # Get and validate request data
        data = request.get_json()
        allowed_fields = ["plant_id", "care_type_id", "note", "care_date"]
        updates = {k: v for k, v in data.items() if k in allowed_fields}

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        plant = plant_service.get_plant(updates.get("plant_id"))  # type: ignore

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized: Plant does not belong to you"}), 403

        # Update Care Log and validate success
        updated_care_log = plant_care_service.update_care_log(care_log_id, updates)

        if not updated_care_log:
            return jsonify({"error": "Updated Care Log was not found"}), 500

        # Respond
        return (
            jsonify(
                {
                    "message": "Care Log updated successfully!",
                    "care_log": {
                        "id": updated_care_log.id,
                        "plant_id": updated_care_log.plant_id,
                        "care_type_id": updated_care_log.care_type_id,
                        "note": updated_care_log.note,
                        "care_date": (
                            updated_care_log.care_date.isoformat()
                            if updated_care_log.care_date
                            else None
                        ),  # type: ignore
                    },
                }
            ),
            200,
        )

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_care_bp.route("/<int:care_log_id>", methods=["DELETE"])
@jwt_required()
@require_user_id
def delete_care_log(user_id, care_log_id):
    """Deletes a Plant's Care Log by ID.

    Args:
        care_log_id (int): The ID of the Care Log to delete.
    """
    db = SessionLocal()
    plant_care_service = PlantCareService(db)
    plant_service = PlantService(db)

    try:
        # Verify Care Log exists and user owns it
        care_log = plant_care_service.get_care_log_by_id(care_log_id)

        if not care_log:
            return jsonify({"error": "Care Log not found"}), 404

        plant = plant_service.get_plant(care_log.plant_id)  # type: ignore

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized: plant does not belong to you"}), 403

        # Delete Care Log and verify delete worked
        deleted = plant_care_service.delete_care_log(care_log_id)

        if not deleted:
            return jsonify({"error": "Care Log was not deleted"}), 404

        # Respond
        return jsonify({"message": "Care Log deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
