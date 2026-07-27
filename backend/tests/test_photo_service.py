from datetime import datetime
import unittest

from app.services.photo_service import PhotoService


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
