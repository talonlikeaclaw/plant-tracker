from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.api import register_api_blueprints

jwt = JWTManager()


def create_app():
    """Creates the Flask application"""
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object("config.Config")
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:5173", "http://localhost:3000"],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    )
    register_api_blueprints(app)
    jwt.init_app(app)
    return app
