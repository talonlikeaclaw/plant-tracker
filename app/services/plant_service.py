from app.models.database import get_connection
from app.models.plant import Plant
import psycopg2


def create_plant(**data):
    """Inserts a new plant and returns a Plant object with the new ID."""
    query = """
        INSERT INTO plants(
            user_id, species_id, nickname,
            date_added, last_watered, location
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
    """
    required_fields = ["user_id", "nickname"]
    for field in required_fields:
        if field not in data or not data[field]:
            raise ValueError(f"{field} is required")
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    query,
                    (
                        data.get("user_id"),
                        data.get("species_id"),
                        data.get("nickname"),
                        data.get("date_added"),
                        data.get("last_watered"),
                        data.get("location"),
                    ),
                )
                row = cursor.fetchone()
                if row:
                    new_id = row[0]
                    plant_data = {**data, "id": new_id}
                    conn.commit()
                    return Plant(**plant_data)
                else:
                    print(
                        "Insert succeeded but RETURNING id returned nothing."
                    )
                    return None
    except psycopg2.Error as e:
        print(f"Error inserting plant: {e}")
        return None
