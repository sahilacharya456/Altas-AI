from typing import Any

from app.rl.policy_engine import choose_action


def recommend_intervention(user_id: str, state_vector: dict[str, Any]) -> dict[str, Any]:
    return choose_action(user_id, state_vector)
