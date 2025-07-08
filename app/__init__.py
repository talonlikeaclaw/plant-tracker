from flask import Flask
from flask_jwt_extended import JWTManager
from app.api import register_api_blueprints

jwt = JWTManager()


def create_app():
    """Creates the Flask application"""
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object("config.Config")
    register_api_blueprints(app)
    jwt.init_app(app)
    return app
