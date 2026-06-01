from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.features.feature_builder import build_features
from app.recommendation.next_best_action import next_best_action
from app.rl.reward_tracker import load_rewards, record_reward

router = APIRouter(prefix="/recommend")


class RecommendRequest(BaseModel):
    userId: str = "anonymous"
    context: dict[str, Any] = Field(default_factory=dict)


class RewardRequest(BaseModel):
    userId: str = "anonymous"
    action: str
    reward: float


@router.post("/action")
def recommend_action(request: RecommendRequest) -> dict:
    result = next_best_action(request.userId, request.context)
    result["userStateVector"] = build_features(request.context)["userStateVector"]
    return result


@router.post("/reward")
def reward(request: RewardRequest) -> dict:
    return {
        "userId": request.userId,
        "action": request.action,
        "rewardState": record_reward(request.userId, request.action, request.reward),
    }


@router.get("/rewards/{user_id}")
def rewards(user_id: str) -> dict:
    return {
        "userId": user_id,
        "rewards": load_rewards().get(user_id, {}),
    }


@router.get("/export/{user_id}")
def export_feedback(user_id: str) -> dict:
    rewards_for_user = load_rewards().get(user_id, {})
    rows = [
        {
            "userId": user_id,
            "recommendation": action,
            "count": stats.get("count", 0),
            "totalReward": stats.get("totalReward", 0.0),
            "averageReward": stats.get("averageReward", 0.0),
        }
        for action, stats in rewards_for_user.items()
    ]
    return {
        "format": "altasai_ml_reward_export_v1",
        "userId": user_id,
        "count": len(rows),
        "rows": rows,
    }
