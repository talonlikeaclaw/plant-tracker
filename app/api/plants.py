from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.database import SessionLocal
from app.services.plant_service import PlantService

plant_bp = Blueprint("plant", __name__)


@plant_bp.route("", methods=["GET"])
@jwt_required()
def get_plants():
    """Gets all plants that belong to the user's JWT idenity."""
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Validate user identity
        user_id = get_jwt_identity()

        if user_id is None:
            return jsonify({"error": "Unauthorized: no identity in token"}), 401

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Unauthorized: invalid identity in token"}), 401

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
                    if plant.date_added
                    else None,
                    "last_watered": plant.last_watered.isoformat()
                    if plant.last_watered
                    else None,
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
def create_plant():
    """Creates a new plant for a user via their JWT identity."""
    db = SessionLocal()
    plant_service = PlantService(db)

    try:
        # Validate user identity
        user_id = get_jwt_identity()

        if user_id is None:
            return jsonify({"error": "Unauthorized: no identity in token"}), 401

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Unauthorized: invalid identity in token"}), 401

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
        return jsonify(
            {
                "message": "Plant created successfully!",
                "plant": {
                    "id": new_plant.id,
                    "nickname": new_plant.nickname,
                    "species_id": new_plant.species_id,
                    "location": new_plant.location,
                    "date_added": new_plant.date_added.isoformat()
                    if new_plant.date_added
                    else None,
                    "last_watered": new_plant.last_watered.isoformat()
                    if new_plant.last_watered
                    else None,
                },
            }
        ), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
