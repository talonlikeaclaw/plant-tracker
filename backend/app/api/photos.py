import os
from datetime import datetime

from flask import Blueprint, jsonify, request, send_file, send_from_directory
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


# --- PLANT PHOTO ENDPOINTS ---


@photo_bp.route("/preview", methods=["POST"])
@jwt_required()
@require_user_id
def preview_photo(user_id):
    """Returns an in-memory JPEG preview for a prospective upload."""
    db = SessionLocal()
    try:
        file = request.files.get("file")
        if not file or not file.filename:
            return jsonify({"error": "No file provided."}), 400
        preview = PhotoService(db).create_preview(file)
        return send_file(preview, mimetype="image/jpeg", max_age=0)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        return jsonify({"error": "Could not create a preview for this image."}), 400
    finally:
        db.close()


@photo_bp.route("/plant/<int:plant_id>", methods=["GET"])
@jwt_required()
@require_user_id
def get_plant_photos(user_id, plant_id):
    """Returns the aggregated gallery for a Plant: its own photos plus all
    photos attached to any of its care logs, in chronological order after cover.
    """
    db = SessionLocal()
    try:
        plant_service = PlantService(db)
        photo_service = PhotoService(db)

        plant, err = _verify_plant_ownership(plant_service, user_id, plant_id)
        if err:
            return err

        photos = photo_service.get_aggregated_plant_photos(plant_id)
        return jsonify({"photos": photos}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@photo_bp.route("/plant/<int:plant_id>", methods=["POST"])
@jwt_required()
@require_user_id
def upload_plant_photos(user_id, plant_id):
    """Uploads one or more photos to a Plant. Accepts multipart/form-data
    with field name `file` (single) or `files` (multiple). Pass
    `featured_index=<index>` to make a selected uploaded photo the plant's cover photo.
    """
    db = SessionLocal()
    try:
        plant_service = PlantService(db)
        photo_service = PhotoService(db)

        plant, err = _verify_plant_ownership(plant_service, user_id, plant_id)
        if err:
            return err

        files = _collect_uploaded_files()
        if not files:
            return jsonify(
                {"error": "No files provided. Use field 'file' or 'files'."}
            ), 400

        taken_at_values = request.form.getlist("taken_at")
        if taken_at_values and len(taken_at_values) != len(files):
            return jsonify({"error": "Each uploaded photo needs its own date field."}), 400

        taken_ats = [_parse_taken_at(value) for value in taken_at_values] or [None] * len(files)
        created, errors, created_by_index = [], [], {}
        for index, (f, taken_at) in enumerate(zip(files, taken_ats)):
            try:
                photo = photo_service.upload_plant_photo(plant_id, f, taken_at)
                created.append(_serialize_created(photo, owner_type="plant"))
                created_by_index[index] = photo.id
            except ValueError as ve:
                errors.append({"index": index, "filename": f.filename, "error": str(ve)})
            except Exception as e:
                errors.append({"index": index, "filename": f.filename, "error": str(e)})

        featured_index = _parse_featured_index(request.form.get("featured_index"), len(files))
        if featured_index is not None and featured_index in created_by_index:
            photo_service.make_featured(created_by_index[featured_index])
            created = [
                _serialize_created(
                    photo_service.get_photo(photo["id"]), owner_type="plant"
                )
                for photo in created
            ]

        return (
            jsonify(
                {
                    "message": f"Uploaded {len(created)} photo(s).",
                    "photos": created,
                    "errors": errors,
                }
            ),
            201 if created else 400,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


# --- CARE LOG PHOTO ENDPOINTS ---


@photo_bp.route("/care-log/<int:care_log_id>", methods=["GET"])
@jwt_required()
@require_user_id
def get_care_log_photos(user_id, care_log_id):
    """Returns all photos for a single care log."""
    db = SessionLocal()
    try:
        plant_service = PlantService(db)
        plant_care_service = PlantCareService(db)
        photo_service = PhotoService(db)

        care_log, err = _verify_care_log_ownership(
            plant_service, plant_care_service, user_id, care_log_id
        )
        if err:
            return err

        photos = photo_service.get_care_log_photos(care_log_id)
        return (
            jsonify(
                {
                    "photos": [
                        _serialize_with_source(p, source_type="care_log")
                        for p in photos
                    ]
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@photo_bp.route("/care-log/<int:care_log_id>", methods=["POST"])
@jwt_required()
@require_user_id
def upload_care_log_photos(user_id, care_log_id):
    """Uploads one or more photos to a PlantCare log."""
    db = SessionLocal()
    try:
        plant_service = PlantService(db)
        plant_care_service = PlantCareService(db)
        photo_service = PhotoService(db)

        care_log, err = _verify_care_log_ownership(
            plant_service, plant_care_service, user_id, care_log_id
        )
        if err:
            return err

        files = _collect_uploaded_files()
        if not files:
            return jsonify(
                {"error": "No files provided. Use field 'file' or 'files'."}
            ), 400

        created, errors = [], []
        for index, f in enumerate(files):
            try:
                photo = photo_service.upload_care_log_photo(care_log_id, f)
                created.append(_serialize_created(photo, owner_type="care_log"))
            except ValueError as ve:
                errors.append({"index": index, "filename": f.filename, "error": str(ve)})
            except Exception as e:
                errors.append({"index": index, "filename": f.filename, "error": str(e)})

        return (
            jsonify(
                {
                    "message": f"Uploaded {len(created)} photo(s).",
                    "photos": created,
                    "errors": errors,
                }
            ),
            201 if created else 400,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


# --- SINGLE-PHOTO ENDPOINTS (MUTATE / SERVE / DELETE) ---


@photo_bp.route("/<int:photo_id>", methods=["PATCH"])
@jwt_required()
@require_user_id
def update_photo(user_id, photo_id):
    """Updates a photo's featured state, position, or timeline date.
    Body: {"featured": true}, {"taken_at": "YYYY-MM-DD"}, or {"position": <int>}
    """
    db = SessionLocal()
    try:
        photo_service = PhotoService(db)

        photo = photo_service.get_photo(photo_id)
        if not photo:
            return jsonify({"error": "Photo not found"}), 404

        if not photo_service.user_owns_photo(user_id, photo):
            return jsonify({"error": "Unauthorized access to this photo."}), 403

        data = request.get_json(silent=True) or {}
        if data.get("featured") is True:
            updated = photo_service.make_featured(photo_id)
        elif "taken_at" in data:
            try:
                taken_at = _parse_taken_at(data["taken_at"])
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            if not taken_at:
                return jsonify({"error": "Field 'taken_at' is required."}), 400
            updated = photo_service.update_taken_at(photo_id, taken_at)
        else:
            position = data.get("position")
            if position is None or not isinstance(position, int):
                return jsonify(
                    {"error": "Field 'position' (int) is required."}
                ), 400
            updated = photo_service.update_position(photo_id, position)
        if not updated:
            return jsonify({"error": "Photo was not updated."}), 500

        return (
            jsonify(
                {
                    "message": "Photo updated.",
                    "photo": {
                        "id": updated.id,
                        "position": updated.position,
                        "taken_at": updated.taken_at.isoformat(),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@photo_bp.route("/<int:photo_id>", methods=["DELETE"])
@jwt_required()
@require_user_id
def delete_photo(user_id, photo_id):
    """Deletes a photo (DB row + on-disk files)."""
    db = SessionLocal()
    try:
        photo_service = PhotoService(db)

        photo = photo_service.get_photo(photo_id)
        if not photo:
            return jsonify({"error": "Photo not found"}), 404

        if not photo_service.user_owns_photo(user_id, photo):
            return jsonify({"error": "Unauthorized access to this photo."}), 403

        deleted = photo_service.delete_photo(photo_id)
        if not deleted:
            return jsonify({"error": "Photo was not deleted."}), 500

        return jsonify({"message": "Photo deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


@photo_bp.route("/<int:photo_id>/file", methods=["GET"])
@jwt_required()
@require_user_id
def serve_photo_file(user_id, photo_id):
    """Serves the photo's original file. Pass `?thumb=1` for the thumbnail."""
    db = SessionLocal()
    try:
        photo_service = PhotoService(db)

        photo = photo_service.get_photo(photo_id)
        if not photo:
            return jsonify({"error": "Photo not found"}), 404

        if not photo_service.user_owns_photo(user_id, photo):
            return jsonify({"error": "Unauthorized access to this photo."}), 403

        thumb = request.args.get("thumb") == "1"
        directory = photo_service.directory_for(photo)
        filename = photo_service.file_name_for(photo, thumb=thumb)

        if not os.path.isfile(os.path.join(directory, filename)):
            return jsonify({"error": "File missing on disk."}), 404

        # Cache privately for a long time (filenames are immutable UUIDs)
        response = send_from_directory(
            directory,
            filename,
            mimetype="image/jpeg",
        )
        response.headers.set("Cache-Control", "private, max-age=31536000, immutable")
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()


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


def _parse_taken_at(value: str | None) -> datetime | None:
    """Parses the optional date selected by the user for an upload batch."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError as error:
        raise ValueError("Field 'taken_at' must use YYYY-MM-DD format.") from error


def _parse_featured_index(value: str | None, file_count: int) -> int | None:
    """Parses the optional zero-based index of the uploaded cover photo."""
    if value is None or value == "":
        return None
    try:
        index = int(value)
    except ValueError as error:
        raise ValueError("Field 'featured_index' must be a valid photo index.") from error
    if not 0 <= index < file_count:
        raise ValueError("Field 'featured_index' must refer to an uploaded photo.")
    return index


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
        "taken_at": photo.taken_at.isoformat() if photo.taken_at else None,
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
        "taken_at": photo.taken_at.isoformat() if photo.taken_at else None,
        "created_at": photo.created_at.isoformat() if photo.created_at else None,  # type: ignore
        "source": {"type": source_type},
    }
