from config import Config
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.api import register_api_blueprints

jwt = JWTManager()


def create_app():
    """Creates the Flask application"""
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object("config.Config")
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_UPLOAD_SIZE
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = Config.JWT_REFRESH_TOKEN_EXPIRES
    CORS(
        app,
        supports_credentials=True,
        origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "https://plants.talonlikeaclaw.com",
        ],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )
    register_api_blueprints(app)
    jwt.init_app(app)
    return app
