from flask import Flask
from flask_jwt_extended import JWTManager

jwt = JWTManager()


def create_app():
    """Creates the Flask application"""
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object("config.Config")
    jwt.init_app(app)
    return app
