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

