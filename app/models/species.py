class Species:
    """Represents a particular Plant species"""

    def __init__(self, **kwargs):
        """Initializes a Plant Species"""
        self.id = kwargs.get("id")
        self.common_name = kwargs.get("common_name")
        self.scientific_name = kwargs.get("scientific_name")
        self.sunlight = kwargs.get("sunlight")
        self.water_requirements = kwargs.get("water")
        self.perenual_id = kwargs.get("perenual_id")
