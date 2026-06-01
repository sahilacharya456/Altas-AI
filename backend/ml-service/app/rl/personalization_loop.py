from typing import Any

from app.rl.policy_engine import choose_action
from app.rl.reward_tracker import record_reward


def personalize(user_id: str, state_vector: dict[str, Any], feedback: dict[str, Any] | None = None) -> dict[str, Any]:
    if feedback:
        record_reward(user_id, str(feedback["action"]), float(feedback["reward"]))
    return choose_action(user_id, state_vector)
