"""
Seed script to populate default care types.
Run once: python seed_defaults.py
"""
from app.models.database import SessionLocal
from app.models import CareType

def seed_default_care_types():
    """Insert system default care types with user_id=None"""
    db = SessionLocal()

    default_types = [
        {
            "name": "Watering",
            "description": "Regular watering schedule for plant hydration",
            "user_id": None
        },
        {
            "name": "Fertilizing",
            "description": "Nutrient supplementation for healthy growth",
            "user_id": None
        },
        {
            "name": "Repotting",
            "description": "Transferring plant to a larger container",
            "user_id": None
        },
        {
            "name": "Pruning",
            "description": "Trimming dead or overgrown foliage",
            "user_id": None
        },
        {
            "name": "Pest Control",
            "description": "Treatment for insects and diseases",
            "user_id": None
        },
        {
            "name": "Misting",
            "description": "Spraying leaves for humidity-loving plants",
            "user_id": None
        },
    ]

    try:
        # Check if defaults already exist
        existing = db.query(CareType).filter_by(user_id=None).count()

        if existing > 0:
            print(f"Default care types already exist ({existing} found). Skipping seed.")
            return

        # Insert defaults
        for type_data in default_types:
            care_type = CareType(**type_data)
            db.add(care_type)

        db.commit()
        print(f"✓ Successfully seeded {len(default_types)} default care types!")

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding care types: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_default_care_types()
