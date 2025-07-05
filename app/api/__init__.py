from .auth import auth_bp
from .users import user_bp
from .plants import plant_bp


def register_api_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(plant_bp, url_prefix="/api/plants")
