import json
from typing import Any

from app.config import REWARD_STORE_PATH


def load_rewards() -> dict[str, Any]:
    if not REWARD_STORE_PATH.exists():
        return {}
    return json.loads(REWARD_STORE_PATH.read_text(encoding="utf-8"))


def save_rewards(rewards: dict[str, Any]) -> None:
    REWARD_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    REWARD_STORE_PATH.write_text(json.dumps(rewards, indent=2), encoding="utf-8")


def record_reward(user_id: str, action: str, reward: float) -> dict[str, Any]:
    data = load_rewards()
    user = data.setdefault(user_id, {})
    item = user.setdefault(action, {"count": 0, "totalReward": 0.0})
    item["count"] += 1
    item["totalReward"] += float(reward)
    item["averageReward"] = item["totalReward"] / max(1, item["count"])
    save_rewards(data)
    return item
