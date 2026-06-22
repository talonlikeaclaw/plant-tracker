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
