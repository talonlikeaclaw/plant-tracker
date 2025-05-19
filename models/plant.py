class Plant:
    """Represents a User's owned Plant"""

    def __init__(self, **kwargs):
        """Initializes a User's Plant"""
        self.id = kwargs.get("plant_id")
        self.user_id = kwargs.get("user_id")
        self.species_id = kwargs.get("species_id")
        self.nickname = kwargs.get("nickname")
        self.date_added = kwargs.get("date_added")
        self.last_watered = kwargs.get("last_watered")
        self.location = kwargs.get("location")
