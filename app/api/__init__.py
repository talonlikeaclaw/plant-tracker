from .auth import auth_bp


def register_api_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
