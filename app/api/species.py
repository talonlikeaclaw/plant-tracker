from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.database import SessionLocal
from app.services.species_service import SpeciesService

species_bp = Blueprint("species", __name__)


@species_bp.route("", methods=["GET"])
@jwt_required()
def get_species():
    """Gets all species in the database."""
    db = SessionLocal()
    species_service = SpeciesService(db)

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

        # Get all species
        species = species_service.get_all_species()

        # Convert Species into List of Dictionaries
        species_list = []
        for current_species in species:
            species_list.append(
                {
                    "id": current_species.id,
                    "common_name": current_species.common_name,
                    "scientific_name": current_species.scientific_name,
                    "sunlight": current_species.sunlight,
                    "water_requirements": current_species.water_requirements,
                }
            )

        # Respond
        return jsonify({"species": species_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@species_bp.route("", methods=["POST"])
@jwt_required()
def create_species():
    """Creates a new species."""
    db = SessionLocal()
    species_service = SpeciesService(db)

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

        common_name = data.get("common_name")
        scientific_name = data.get("scientific_name")
        sunlight = data.get("sunlight")
        water_requirements = data.get("water_requirements")

        # Validate required fields
        if not common_name:
            return jsonify({"error": "The common_name field is required."}), 400

        # Prepare species data
        species_data = {
            "common_name": common_name,
            "scientific_name": scientific_name,
            "sunlight": sunlight,
            "water_requirements": water_requirements
        }

        new_species = species_service.create_species(species_data)

        # Respond
        return jsonify({
            "message": "Species created successfully!",
            "species": {
                "id": new_species.id,
                "common_name": new_species.common_name,
                "scientific_name": new_species.scientific_name,
                "sunlight": new_species.sunlight,
                "water_requirements": new_species.water_requirements
            }
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()


@species_bp.route("/<int:species_id>", methods=["GET"])
@jwt_required()
def get_a_species(species_id):
    """Gets a Species by its ID and returns its info.

    Args:
        species_id (int): The ID of the Species to retrieve.
    """
    db = SessionLocal()
    species_service = SpeciesService(db)

    current_user_id = get_jwt_identity()

    if current_user_id is None:
        return jsonify({"error": "Unauthorized: no identity in token"}), 401

    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        return jsonify({"error":
                        "Unauthorized: invalid identity in token"}), 401

    try:
        species = species_service.get_species(species_id)

        if not species:
            return jsonify({"error": "Species not found"}), 404

        # Respond
        return jsonify({
            "species": {
                "id": species.id,
                "common_name": species.common_name,
                "scientific_name": species.scientific_name,
                "sunlight": species.sunlight,
                "water_requirements": species.water_requirements
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        db.close()
