import os

from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.datastructures import FileStorage

from app.decorators.auth import require_user_id
from app.models.database import SessionLocal
from app.models.plant import Plant
from app.models.plant_care import PlantCare
from app.services.photo_service import PhotoService
from app.services.plant_care_service import PlantCareService
from app.services.plant_service import PlantService

photo_bp = Blueprint("photo", __name__)


# --- OWNERSHIP HELPERS ---


def _verify_plant_ownership(plant_service: PlantService, user_id: int, plant_id: int):
    """Returns (plant, error_response). On success error_response is None.
    On failure plant is None and error_response is a (response, status) tuple.
    """
    plant = plant_service.get_plant(plant_id)
    if not plant:
        return None, (jsonify({"error": "Plant not found"}), 404)
    if plant.user_id != user_id:  # type: ignore[union-attr]
        return None, (jsonify({"error": "Unauthorized access to this plant."}), 403)
    return plant, None


def _verify_care_log_ownership(
    plant_service: PlantService,
    plant_care_service: PlantCareService,
    user_id: int,
    care_log_id: int,
):
    """Returns (care_log, error_response). Same semantics as above."""
    care_log = plant_care_service.get_care_log_by_id(care_log_id)
    if not care_log:
        return None, (jsonify({"error": "Care log not found"}), 404)
    plant = plant_service.get_plant(care_log.plant_id)  # type: ignore[arg-type]
    if not plant:
        return None, (jsonify({"error": "Plant not found"}), 404)
    if plant.user_id != user_id:  # type: ignore[union-attr]
        return None, (jsonify({"error": "Unauthorized access to this care log."}), 403)
    return care_log, None


# --- HELPERS ---


def _collect_uploaded_files() -> list[FileStorage]:
    """Returns uploaded files from either `file` (single) or `files` (list).
    Returns an empty list if neither is present.
    """
    files: list[FileStorage] = []
    if "files" in request.files:
        files = request.files.getlist("files")
    elif "file" in request.files:
        f = request.files.get("file")
        if f:
            files = [f]
    return [f for f in files if f and f.filename]


def _serialize_created(photo, owner_type: str) -> dict:
    """Serializes a freshly-created Photo row with the essentials the frontend
    needs immediately after upload.
    """
    return {
        "id": photo.id,
        "owner_type": owner_type,
        "owner_id": photo.plant_id if photo.plant_id is not None else photo.care_log_id,
        "filename": photo.filename,
        "original_filename": photo.original_filename,
        "width": photo.width,
        "height": photo.height,
        "position": photo.position,
        "created_at": photo.created_at.isoformat() if photo.created_at else None,  # type: ignore
    }


def _serialize_with_source(photo, source_type: str) -> dict:
    """Generic serializer for list endpoints; source field can be enriched by caller."""
    return {
        "id": photo.id,
        "owner_type": "plant" if photo.plant_id is not None else "care_log",
        "owner_id": photo.plant_id if photo.plant_id is not None else photo.care_log_id,
        "filename": photo.filename,
        "original_filename": photo.original_filename,
        "width": photo.width,
        "height": photo.height,
        "position": photo.position,
        "created_at": photo.created_at.isoformat() if photo.created_at else None,  # type: ignore
        "source": {"type": source_type},
    }
