from app.services import plant_care_service
from .auth import auth_bp
from .users import user_bp
from .plants import plant_bp
from .species import species_bp
from .plant_care import plant_care_bp


def register_api_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(plant_bp, url_prefix="/api/plants")
    app.register_blueprint(species_bp, url_prefix="/api/species")
    app.register_blueprint(plant_care_service, url_prefix="/api/plant_care")
