from flask import Flask


def create_app():
    """Creates the Flask application"""
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object("config.Config")

    return app
