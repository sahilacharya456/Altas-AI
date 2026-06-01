from typing import Any

from app.features.feature_builder import build_features
from app.recommendation.task_ranker import rank_tasks
from app.rl.policy_engine import choose_action


def next_best_action(user_id: str, context: dict[str, Any]) -> dict[str, Any]:
    features = build_features(context)
    policy = choose_action(user_id, features["userStateVector"])
    tasks = rank_tasks(context.get("tasks", []))
    if tasks and policy["topRecommendation"] in ["start_focus", "prioritize_urgent_task"]:
        policy["suggestedTask"] = tasks[0]
    return policy
