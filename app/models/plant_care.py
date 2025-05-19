class PlantCare:
    """Represents a log/action of PlantCare performed by a User"""

    def __init__(self, **kwargs):
        """Initializes an instance of PlantCare"""
        self.id = kwargs.get("id")
        self.plant_id = kwargs.get("plant_id")
        self.care_type_id = kwargs.get("care_type_id")
        self.note = kwargs.get("note")
        self.care_date = kwargs.get("care_date")
