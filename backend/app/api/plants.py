from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.decorators.auth import require_user_id
from app.models.database import SessionLocal
from app.services.plant_service import PlantService

plant_bp = Blueprint("plant", __name__)


@plant_bp.route("", methods=["GET"])
@jwt_required()
@require_user_id
def get_plants(user_id):
    """Gets all plants that belong to the user's JWT identity."""
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Get Plants
        plants = plant_service.get_user_plants(user_id)

        # Convert Plants into List or Dictionaries
        plants_list = []
        for plant in plants:
            plants_list.append(
                {
                    "id": plant.id,
                    "nickname": plant.nickname,
                    "species_id": plant.species_id,
                    "location": plant.location,
                    "date_added": plant.date_added.isoformat()
                    if plant.date_added else None,  # type: ignore
                    "last_watered": plant.last_watered.isoformat()
                    if plant.last_watered else None,  # type: ignore
                }
            )

        # Respond
        return jsonify({"plants": plants_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_bp.route("", methods=["POST"])
@jwt_required()
@require_user_id
def create_plant(user_id):
    """Creates a new plant for a user via their JWT identity."""
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Get request data
        data = request.get_json()

        nickname = data.get("nickname")
        species_id = data.get("species_id")
        location = data.get("location")
        date_added = data.get("date_added")
        last_watered = data.get("last_watered")

        # Validate required fields
        if not nickname:
            return jsonify({"error": "The nickname field is required."}), 400

        # Prepare plant data
        plant_data = {
            "nickname": nickname,
            "user_id": user_id,
            "species_id": species_id,
            "date_added": date_added,
            "last_watered": last_watered,
            "location": location,
        }

        new_plant = plant_service.create_plant(plant_data)

        # Respond
        return jsonify({
            "message": "Plant created successfully!",
            "plant": {
                "id": new_plant.id,
                "nickname": new_plant.nickname,
                "species_id": new_plant.species_id,
                "location": new_plant.location,
                "date_added": new_plant.date_added.isoformat()
                if new_plant.date_added else None,  # type: ignore
                "last_watered": new_plant.last_watered.isoformat()
                if new_plant.last_watered else None  # type: ignore

            }
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_bp.route("/<int:plant_id>", methods=["GET"])
@jwt_required()
@require_user_id
def get_plant(user_id, plant_id):
    """Gets a Plant by its ID and returns its info.

    Args:
        plant_id (int): The ID of the Plant to retrieve.
    """
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Get Plant and validate it
        plant = plant_service.get_plant(plant_id)

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error":
                            "Unauthorized: Plant does not belong to you"}), 403

        # Respond
        return jsonify({
            "plant": {
                "id": plant.id,
                "nickname": plant.nickname,
                "species_id": plant.species_id,
                "location": plant.location,
                "date_added": plant.date_added.isoformat()
                if plant.date_added else None,  # type: ignore
                "last_watered": plant.last_watered.isoformat()
                if plant.last_watered else None  # type: ignore
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_bp.route("/<int:plant_id>", methods=["PATCH"])
@jwt_required()
@require_user_id
def update_plant(user_id, plant_id):
    """Updates a Plant's information.

    Args:
        plant_id (int): The ID of the Plant to update.
    """
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Validate Plant exists and user owns it
        plant = plant_service.get_plant(plant_id)

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized access to this plant"}), 403

        # Get request data and validate
        data = request.get_json()
        allowed_fields = ["nickname", "location", "species_id", "last_watered"]
        updates = {k: v for k, v in data.items() if k in allowed_fields}

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        # Update Plant
        updated_plant = plant_service.update_plant(plant_id, updates)

        if not updated_plant:
            return jsonify({"error": "Updated plant was not found"}), 500

        # Respond
        return jsonify({
            "message": "Plant updated successfully!",
            "plant": {
                "id": updated_plant.id,
                "nickname": updated_plant.nickname,
                "species_id": updated_plant.species_id,
                "location": updated_plant.location,
                "date_added": updated_plant.date_added.isoformat()
                if updated_plant.date_added else None,  # type: ignore
                "last_watered": updated_plant.last_watered.isoformat()
                if updated_plant.last_watered else None  # type: ignore
            }
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@plant_bp.route("/<int:plant_id>", methods=["DELETE"])
@jwt_required()
@require_user_id
def delete_plant(user_id, plant_id):
    """Deletes a User's plant.

    Args:
        plant_id (int): The ID of the Plant to delete.
    """
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Verify plant exists and user owns it
        plant = plant_service.get_plant(plant_id)

        if not plant:
            return jsonify({"error": "Plant not found"}), 404

        if plant.user_id != user_id:  # type: ignore
            return jsonify({"error": "Unauthorized access to this plant"}), 403

        # Delete plant and verify delete worked
        deleted = plant_service.delete_plant(plant_id)

        if not deleted:
            return jsonify({"error": "Plant was not deleted"}), 404

        # Respond
        return jsonify({"message": "Plant deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
