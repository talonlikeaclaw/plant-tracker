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
