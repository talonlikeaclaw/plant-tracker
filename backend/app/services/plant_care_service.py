from app.models import PlantCare
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from datetime import date, timedelta


class PlantCareService:
    """Service class that handles business logic for PlantCare operations.

    Attributes:
        db (Session):
            - SQLAlchemy session used to interact with the database.
    """

    def __init__(self, db: Session):
        """Initializes the PlantCareService with a given SQLAlchemy session.

        Args:
            db (Session):
                - An active SQLAlchemy session.
        """
        self.db = db

    def create_care_log(self, data: dict) -> PlantCare:
        """Creates a new PlantCare record in the database.

        Args:
            data (dict): A dictionary containing the fields for the PlantCare:
                - 'plant_id' (int, required)
                - 'care_type_id' (int, required)
                - 'note' (str, optional)
                - 'care_date' (date, optional)

        Returns:
            PlantCare:
                - The PlantCare object with a populated ID and commited state.

        Raises:
            ValueError: If required field is missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("plant_id"):
            raise ValueError("plant_id is required")

        if not data.get("care_type_id"):
            raise ValueError("care_type_id is required")

        if not data.get("care_date"):
            data["care_date"] = date.today()

        care_log = PlantCare(**data)
        self.db.add(care_log)
        try:
            self.db.commit()
            self.db.refresh(care_log)
        except IntegrityError:
            self.db.rollback()
            raise
        return care_log

    def create_care_plan(self, data: dict) -> CarePlan:
        """Creates a new CarePlan record in the database.

        Args:
            data (dict): A dictionary containing the fields for the CarePlan:
                - 'user_id' (int, required)
                - 'plant_id' (int, required)
                - 'care_type_id' (int, required)
                - 'start_date' (date, optional (defaults to today))
                - 'frequency_days' (int, optional (defaults to 7))
                - 'note' (str, optional)
                - 'active' (bool, optional (defaults to true))

        Returns:
            CarePlan:
                - The CarePlan object with a populated ID and commited state.

        Raises:
            ValueError: If required field is missing.
            IntegrityError: If database constraints are violated.
        """
        if not data.get("user_id"):
            raise ValueError("user_id is required")

        if not data.get("plant_id"):
            raise ValueError("plant_id is required")

        if not data.get("care_type_id"):
            raise ValueError("care_type_id is required")

        if not data.get("start_date"):
            data["start_date"] = date.today()

        if not data.get("frequency_days"):
            data["frequency_days"] = 7

        if not data.get("active"):
            data["active"] = True

        care_plan = CarePlan(**data)
        self.db.add(care_plan)
        try:
            self.db.commit()
            self.db.refresh(care_plan)
        except IntegrityError:
            self.db.rollback()
            raise
        return care_plan

    def get_care_log_by_id(self, care_id: int) -> Optional[PlantCare]:
        """Fetches a single PlantCare by its ID.

        Args:
            care_id (int): The primary key of the PlantCare to retrieve.

        Returns:
            PlantCare or None: Found PlantCare or None if not found.
        """
        return self.db.query(PlantCare).filter_by(id=care_id).first()

    def get_plant_care_logs(self, plant_id: int) -> List[PlantCare]:
        """Fetches all PlantCare logs for a specified Plant.

        Args:
            plant_id (int):
                - The primary key of the plant to get the care logs for.

        Returns:
            List[PlantCare] or []:
                - All care logs for the plant, or an empty list.
        """
        return (
            self.db.query(PlantCare)
            .filter_by(plant_id=plant_id)
            .order_by(PlantCare.care_date.desc())
            .all()
        )

    def get_active_care_plans_for_user(self, user_id: int) -> List[CarePlan]:
        """Fetches all active CarePlans for a specified User.

        Args:
            user_id (int):
                - The primary key of the User to get the Care Plans for.

        Returns:
            List[CarePlan] or []:
                - All Care Plans for the User, or an empty list.
        """
        return self.db.query(CarePlan).filter_by(user_id=user_id, active=True).all()

    def get_all_care_plans_for_user(self, user_id: int) -> List[CarePlan]:
        """Fetches all CarePlans for a specified User.

        Args:
            user_id (int):
                - The primary key of the User to get the Care Plans for.

        Returns:
            List[CarePlan] or []:
                - All Care Plans for the User, or an empty list.
        """
        return self.db.query(CarePlan).filter_by(user_id=user_id).all()

    def get_upcoming_care_logs(self, user_id: int) -> List[dict]:
        """Fetches upcoming CarePlans and converts into upcoming logs.

        Args:
            user_id (int):
                - The primary key of the User to get the upcoming logs for.

        Returns:
            List[dict] or []:
                - All upcoming care logs/plans in a nicely formatted dictionary.

        """
        today = date.today()
        upcoming_logs = []

        care_plans = self.get_active_care_plans_for_user(user_id)
        for plan in care_plans:
            delta = (today - plan.start_date).days
            if delta >= 0:
                cycles = delta // plan.frequency_days
                next_due = plan.start_date + timedelta(
                    days=(cycles + 1) * plan.frequency_days
                )
            else:
                next_due = plan.start_date

            upcoming_logs.append(
                {
                    "plant_id": plan.plant_id,
                    "plant_nickname": plan.plant.nickname,
                    "care_type": plan.care_type.name,
                    "note": plan.note,
                    "due_date": next_due,
                    "days_until_due": (next_due - today).days,
                }
            )

    return sorted(upcoming_logs, key=lambda log: log["due_date"])

    def update_care_log(self, care_id: int, updates: dict) -> Optional[PlantCare]:
        """Updates fields of an existing care log.

        Args:
            care_id (int): ID of the care log to update.
            updates (dict): Fields to update.

        Returns:
            PlantCare or None: Updated care log or None if not found.
        """
        care_log = self.get_care_log_by_id(care_id)
        if not care_log:
            return None

        for key, value in updates.items():
            if hasattr(care_log, key):
                setattr(care_log, key, value)

        try:
            self.db.commit()
            self.db.refresh(care_log)
        except IntegrityError:
            self.db.rollback()
            raise
        return care_log

    def delete_care_log(self, care_id: int) -> bool:
        """Deletes a care log from the database.

        Args:
            care_id (int): ID of the care log to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        care_log = self.get_care_log_by_id(care_id)
        if not care_log:
            return False

        self.db.delete(care_log)
        self.db.commit()
        return True
