from typing import Any

from app.features.user_state_features import build_user_state_vector


def build_features(context: dict[str, Any]) -> dict[str, Any]:
    return {
        "userStateVector": build_user_state_vector(context),
        "rawCounts": {
            "tasks": len(context.get("tasks", [])),
            "goals": len(context.get("goals", [])),
            "focusSessions": len(context.get("focusSessions", [])),
            "reflections": len(context.get("reflections", [])),
        },
    }
