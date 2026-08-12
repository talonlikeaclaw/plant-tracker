from datetime import datetime, timedelta, timezone
from io import BytesIO
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from flask import Flask
from PIL import Image
from werkzeug.datastructures import FileStorage

from app.services.photo_service import PhotoService
from app.api.photos import _parse_taken_at


class FakeExif(dict):
    def __init__(self, exif_ifd=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.exif_ifd = exif_ifd or {}

    def get_ifd(self, tag):
        return self.exif_ifd if tag == 0x8769 else {}


class FakeImage:
    def __init__(self, exif):
        self.exif = exif

    def getexif(self):
        return self.exif


class PhotoMetadataTests(unittest.TestCase):
    def test_uses_original_capture_date(self):
        image = FakeImage(FakeExif({0x9003: "2024:03:15 10:30:00"}))

        self.assertEqual(
            PhotoService._exif_taken_at(image),
            datetime(2024, 3, 15, 10, 30),
        )

    def test_rejects_file_modification_date_as_capture_date(self):
        image = FakeImage(FakeExif({}, {0x0132: "2026:07:27 10:30:00"}))

        self.assertIsNone(PhotoService._exif_taken_at(image))

    def test_uses_upload_time_without_capture_date(self):
        image = BytesIO()
        Image.new("RGB", (1, 1)).save(image, format="JPEG")
        image.seek(0)

        with TemporaryDirectory() as upload_folder:
            app = Flask(__name__)
            app.config["UPLOAD_FOLDER"] = upload_folder
            app.config["ALLOWED_MIME_TYPES"] = {"image/jpeg"}
            with app.app_context(), patch(
                "app.services.photo_service.magic.from_buffer",
                return_value="image/jpeg",
            ):
                before = datetime.now(timezone.utc).replace(tzinfo=None)
                metadata = PhotoService(None)._process_and_save(
                    FileStorage(image, filename="undated.jpg"), upload_folder
                )
                self.assertGreaterEqual(metadata["taken_at"], before)

    def test_rejects_future_photo_dates(self):
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date().isoformat()

        with self.assertRaisesRegex(ValueError, "cannot be in the future"):
            _parse_taken_at(tomorrow)
