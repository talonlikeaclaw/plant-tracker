from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity


def require_user_id(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()

        if user_id is None:
            return jsonify(
                {"error": "Unauthorized: no identity in token"}
            ), 401

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Unauthorized: invalid identity"}), 401

        return fn(user_id=user_id, *args, **kwargs)

    return wrapper
