class CareType:
    """Represents a Type of Plant Care"""

    def __init__(self, **kwargs):
        """Initializes a global/user Care Type"""
        self.id = kwargs.get("id")
        self.user_id = kwargs.get("user_id")
        self.name = kwargs.get("name")
        self.description = kwargs.get("description")
