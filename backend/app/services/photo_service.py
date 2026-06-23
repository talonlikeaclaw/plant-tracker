import io
import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import magic
from flask import current_app
from PIL import Image
from pillow_heif import register_heif_opener
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from werkzeug.datastructures import FileStorage

from app.models import Photo, PlantCare
from app.models.plant import Plant

register_heif_opener()


class PhotoService:
    """Service class that handles business logic for Photo operations"""

    THUMBNAIL_WIDTH = 400
    JPEG_QUALITY_ORIGINAL = 85
    JPEG_QUALITY_THUMBNAIL = 80
    OUTPUT_MIME = "image/jpeg"
    OUTPUT_EXT = ".jpg"

    def __init__(self, db: Session):
        """Initializes the PhotoService with a given SQLAlchemy session.

        Args:
            db (Session): An active SQLAlchemy session.
        """
        self.db = db
        self.upload_folder = current_app.config["UPLOAD_FOLDER"]

    # --- UPLOAD ---

    def upload_plant_photo(self, plant_id: int, file_storage: FileStorage) -> Photo:
        """Validates, processes, saves, and records a photo for a Plant.

        Args:
            plant_id (int): The owning Plant's ID.
            file_storage (FileStorage): The uploaded file from `request.files`.

        Returns:
            Photo: The created Photo object.

        Raises:
            ValueError: If MIME type is not allowed.
            IntegrityError: If DB commit fails.
        """
        target_dir = os.path.join(self.upload_folder, "plants", str(plant_id))
        meta = self._process_and_save(file_storage, target_dir)
        meta["plant_id"] = plant_id
        meta["position"] = self._next_position(plant_id=plant_id)
        return self._create_photo_row(meta)

    def upload_care_log_photo(
        self, care_log_id: int, file_storage: FileStorage
    ) -> Photo:
        """Validates, processes, saves, and records a photo for a PlantCare log.

        Args:
            care_log_id (int): The owning PlantCare log's ID.
            file_storage (FileStorage): The uploaded file from `request.files`.

        Returns:
            Photo: The created Photo object.

        Raises:
            ValueError: If MIME type is not allowed.
            IntegrityError: If DB commit fails.
        """
        target_dir = os.path.join(self.upload_folder, "care-logs", str(care_log_id))
        meta = self._process_and_save(file_storage, target_dir)
        meta["care_log_id"] = care_log_id
        meta["position"] = self._next_position(care_log_id=care_log_id)
        return self._create_photo_row(meta)

    # --- READ ---

    def get_photo(self, photo_id: int) -> Optional[Photo]:
        """Fetches a single Photo by its ID."""
        return self.db.query(Photo).filter_by(id=photo_id).first()

    def get_plant_photos(self, plant_id: int) -> List[Photo]:
        """Returns only the photos that belong directly to the Plant
        (NOT including photos from the plant's care logs), ordered by position.
        """
        return (
            self.db.query(Photo)
            .filter_by(plant_id=plant_id)
            .order_by(Photo.position.asc(), Photo.created_at.asc())
            .all()
        )

    def get_care_log_photos(self, care_log_id: int) -> List[Photo]:
        """Returns all photos for a single PlantCare log, ordered by position."""
        return (
            self.db.query(Photo)
            .filter_by(care_log_id=care_log_id)
            .order_by(Photo.position.asc(), Photo.created_at.asc())
            .all()
        )

    def get_cover_photo(self, plant_id: int) -> Optional[Photo]:
        """Returns the cover photo for a Plant (lowest position value).
        Used to show a thumbnail on the plants grid. Returns None if the
        plant has no direct photos.
        """
        return (
            self.db.query(Photo)
            .filter_by(plant_id=plant_id)
            .order_by(Photo.position.asc(), Photo.created_at.asc())
            .first()
        )

    def get_aggregated_plant_photos(self, plant_id: int) -> List[dict]:
        """Returns a unified gallery for a Plant: the Plant's own photos plus
        every photo attached to any of its care logs.).

        Returns:
            List[dict]: Photos sorted by creation date (newest first).
        """
        results: List[dict] = []

        # Plant's own photos
        for photo in self.get_plant_photos(plant_id):
            results.append(self._serialize_photo(photo, source_type="plant"))

        # Photos from each care log, with care metadata for context
        care_logs = (
            self.db.query(PlantCare)
            .filter_by(plant_id=plant_id)
            .order_by(PlantCare.care_date.desc())
            .all()
        )
        for log in care_logs:
            for photo in self.get_care_log_photos(log.id):  # type: ignore[arg-type]
                results.append(
                    self._serialize_photo(
                        photo,
                        source_type="care_log",
                        care_log_id=log.id,  # type: ignore[arg-type]
                        care_type=log.care_type.name if log.care_type else None,
                        care_date=log.care_date.isoformat() if log.care_date else None,  # type: ignore
                        note=log.note,  # type: ignore[arg-type]
                    )
                )

        # Newest first
        results.sort(key=lambda p: p["created_at"], reverse=True)
        return results

    # --- REORDER / DELETE ---

    def update_position(self, photo_id: int, new_position: int) -> Optional[Photo]:
        """Updates a photo's position (used for plant cover/reorder).

        Args:
            photo_id (int): ID of the photo to update.
            new_position (int): New position value.

        Returns:
            Photo or None: Updated photo, or None if not found.
        """
        photo = self.get_photo(photo_id)
        if not photo:
            return None
        setattr(photo, "position", new_position)
        try:
            self.db.commit()
            self.db.refresh(photo)
        except IntegrityError:
            self.db.rollback()
            raise
        return photo

    def delete_photo(self, photo_id: int) -> bool:
        """Deletes a Photo row and its on-disk files (original + thumbnail).

        Args:
            photo_id (int): ID of the photo to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        photo = self.get_photo(photo_id)
        if not photo:
            return False

        # Remove files first (cheaper than querying after delete)
        self._delete_photo_files(photo)

        self.db.delete(photo)
        self.db.commit()
        return True

    # Disk cleanup on parent delete

    def cleanup_plant_files(self, plant_id: int) -> None:
        """Removes all on-disk photo files for a Plant AND its care logs.

        MUST be called before the Plant row is deleted, because after the
        delete the care_log IDs are gone from the DB and their photo
        directories become orphans on disk.

        Args:
            plant_id (int): ID of the plant about to be deleted.
        """
        # Capture care_log IDs first while they still exist in the DB
        care_log_ids = [
            row[0]
            for row in self.db.query(PlantCare.id).filter_by(plant_id=plant_id).all()
        ]

        # Plant's own photo directory
        plant_dir = os.path.join(self.upload_folder, "plants", str(plant_id))
        if os.path.isdir(plant_dir):
            shutil.rmtree(plant_dir, ignore_errors=True)

        # Each care log's directory
        for cl_id in care_log_ids:
            self.cleanup_care_log_files(cl_id)

    def cleanup_care_log_files(self, care_log_id: int) -> None:
        """Removes all on-disk photo files for a PlantCare log.

        MUST be called before the PlantCare row is deleted.

        Args:
            care_log_id (int): ID of the care log about to be deleted.
        """
        cl_dir = os.path.join(self.upload_folder, "care-logs", str(care_log_id))
        if os.path.isdir(cl_dir):
            shutil.rmtree(cl_dir, ignore_errors=True)

    # --- FILE SERVING HELPERS ---

    def directory_for(self, photo: Photo) -> str:
        """Returns the absolute directory containing the photo's files."""
        if photo.plant_id is not None:
            return os.path.join(self.upload_folder, "plants", str(photo.plant_id))
        if photo.care_log_id is not None:
            return os.path.join(self.upload_folder, "care-logs", str(photo.care_log_id))
        raise ValueError(f"Photo {photo.id} has neither plant_id nor care_log_id")

    def file_name_for(self, photo: Photo, thumb: bool = False) -> str:
        """Returns the on-disk filename for the photo (original or thumbnail)."""
        filename: str = photo.filename  # type: ignore[assignment]
        if not thumb:
            return filename
        name, _ = os.path.splitext(filename)
        return f"{name}_thumb{self.OUTPUT_EXT}"

    def file_path_for(self, photo: Photo, thumb: bool = False) -> str:
        """Returns the absolute path to the photo file on disk."""
        return os.path.join(
            self.directory_for(photo), self.file_name_for(photo, thumb=thumb)
        )

    # --- OWNERSHIP CHECK ---

    def user_owns_photo(self, user_id: int, photo: Photo) -> bool:
        """Returns True if the given user owns the plant that owns this photo
        (directly via plant_id, or transitively via care_log_id -> plant).
        """
        if photo.plant_id is not None:
            plant = self.db.query(Plant).filter_by(id=photo.plant_id).first()
            return plant is not None and plant.user_id == user_id  # type: ignore[return-value]
        if photo.care_log_id is not None:
            care_log = self.db.query(PlantCare).filter_by(id=photo.care_log_id).first()
            if care_log is None:
                return False
            plant = self.db.query(Plant).filter_by(id=care_log.plant_id).first()
            return plant is not None and plant.user_id == user_id  # type: ignore[return-value]
        return False

    # --- INTERNALS ---

    def _process_and_save(self, file_storage: FileStorage, target_dir: str) -> dict:
        """Reads, validates, processes, and saves a single upload to disk.

        Always stores the result as JPEG (HEIC/HEIF/PNG/etc converted) for
        browser compatibility. Generates a 400px-wide thumbnail alongside.

        Args:
            file_storage (FileStorage): The uploaded file.
            target_dir (str): Absolute directory to write into (created if missing).

        Returns:
            dict: Metadata for the Photo row (filename, mime_type, size, dims).

        Raises:
            ValueError: If MIME type is not in `ALLOWED_MIME_TYPES`.
        """
        allowed = current_app.config["ALLOWED_MIME_TYPES"]

        # Read full content into memory
        file_storage.seek(0)
        raw = file_storage.read()

        # Sniff true MIME from content
        detected_mime = magic.from_buffer(raw, mime=True)
        if detected_mime not in allowed:
            raise ValueError(
                f"Unsupported file type: {detected_mime}. "
                f"Allowed: {', '.join(sorted(allowed))}"
            )

        # Open with Pillow
        img = Image.open(io.BytesIO(raw))

        # Capture original dimensions
        original_width, original_height = img.size

        # Normalize to RGB for JPEG output
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Generate thumbnail preserving aspect ratio
        thumb_ratio = self.THUMBNAIL_WIDTH / original_width
        thumb_height = max(1, int(original_height * thumb_ratio))
        thumb = img.resize(
            (self.THUMBNAIL_WIDTH, thumb_height),
            Image.Resampling.LANCZOS,
        )

        # Generate stable UUID-based filename
        filename = f"{uuid.uuid4().hex}{self.OUTPUT_EXT}"

        os.makedirs(target_dir, exist_ok=True)

        original_path = os.path.join(target_dir, filename)
        img.save(original_path, format="JPEG", quality=self.JPEG_QUALITY_ORIGINAL)

        thumb_filename = self._thumb_name(filename)
        thumb_path = os.path.join(target_dir, thumb_filename)
        thumb.save(thumb_path, format="JPEG", quality=self.JPEG_QUALITY_THUMBNAIL)

        size_on_disk = os.path.getsize(original_path)

        # Preserve user's original name for display only
        original_name = (file_storage.filename or "")[:255]

        return {
            "filename": filename,
            "original_filename": original_name,
            "mime_type": self.OUTPUT_MIME,
            "size_bytes": size_on_disk,
            "width": original_width,
            "height": original_height,
        }

    def _create_photo_row(self, meta: dict) -> Photo:
        """Inserts a Photo row from the metadata dict returned by _process_and_save."""
        photo = Photo(**meta)
        self.db.add(photo)
        try:
            self.db.commit()
            self.db.refresh(photo)
        except IntegrityError:
            self.db.rollback()
            raise
        return photo

    def _next_position(
        self, plant_id: Optional[int] = None, care_log_id: Optional[int] = None
    ) -> int:
        """Returns the next position value for a new photo under the given owner.
        Position 0 is the cover photo for plants.
        """
        q = self.db.query(func.max(Photo.position))
        if plant_id is not None:
            q = q.filter(Photo.plant_id == plant_id)
        elif care_log_id is not None:
            q = q.filter(Photo.care_log_id == care_log_id)
        else:
            return 0
        current_max = q.scalar()
        return (current_max or -1) + 1

    @staticmethod
    def _thumb_name(filename: str) -> str:
        """Returns the thumbnail variant's filename for a given original filename."""
        name, _ = os.path.splitext(filename)
        return f"{name}_thumb{PhotoService.OUTPUT_EXT}"

    def _delete_photo_files(self, photo: Photo) -> None:
        """Deletes the on-disk original and thumbnail for a photo (best-effort)."""
        for thumb in (False, True):
            path = self.file_path_for(photo, thumb=thumb)
            try:
                os.remove(path)
            except FileNotFoundError:
                pass

    @staticmethod
    def _serialize_photo(
        photo: Photo,
        source_type: str,
        care_log_id: Optional[int] = None,
        care_type: Optional[str] = None,
        care_date: Optional[str] = None,
        note: Optional[str] = None,
    ) -> dict:
        """Serializes a Photo row into a JSON-friendly dict with source metadata."""
        data = {
            "id": photo.id,
            "owner_type": "plant" if photo.plant_id is not None else "care_log",
            "owner_id": photo.plant_id
            if photo.plant_id is not None
            else photo.care_log_id,
            "filename": photo.filename,
            "original_filename": photo.original_filename,
            "width": photo.width,
            "height": photo.height,
            "position": photo.position,
            "created_at": photo.created_at.isoformat() if photo.created_at else None,  # type: ignore
            "source": {"type": source_type},
        }
        if source_type == "care_log":
            data["source"].update(
                {
                    "care_log_id": care_log_id,
                    "care_type": care_type,
                    "care_date": care_date,
                    "note": note,
                }
            )
        return data
