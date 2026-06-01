from typing import Any

from app.rl.exploration_strategy import epsilon_greedy
from app.rl.reward_tracker import load_rewards

ACTIONS = [
    "start_focus",
    "break_task",
    "reschedule_task",
    "write_reflection",
    "review_goal",
    "generate_report",
    "reduce_workload",
    "prioritize_urgent_task",
    "mentor_plan",
]


def score_actions(user_id: str, state_vector: dict[str, Any]) -> dict[str, float]:
    values = {key: float(value.get("value", 0)) if isinstance(value, dict) else float(value) for key, value in state_vector.items()}
    scores = {
        "start_focus": values.get("executionReadinessScore", 45),
        "break_task": values.get("planningNeedScore", 45) + values.get("workloadScore", 0) * 0.2,
        "reschedule_task": values.get("deadlineRiskScore", 0),
        "write_reflection": 45 + values.get("stressSignalScore", 0) * 0.25,
        "review_goal": 100 - values.get("goalProgressScore", 50),
        "generate_report": 40 + values.get("consistencyScore", 50) * 0.15,
        "reduce_workload": values.get("burnoutRiskScore", 0) + values.get("workloadScore", 0) * 0.3,
        "prioritize_urgent_task": values.get("deadlineRiskScore", 0) + values.get("workloadScore", 0) * 0.2,
        "mentor_plan": 55 + values.get("planningNeedScore", 0) * 0.15,
    }
    rewards = load_rewards().get(user_id, {})
    for action, stats in rewards.items():
        if action in scores:
            scores[action] += float(stats.get("averageReward", 0)) * 10
    return scores


def choose_action(user_id: str, state_vector: dict[str, Any]) -> dict[str, Any]:
    scores = score_actions(user_id, state_vector)
    action = epsilon_greedy(ACTIONS, scores)
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return {
        "topRecommendation": action,
        "top3Recommendations": [item[0] for item in ranked[:3]],
        "rankingScores": {key: round(value, 2) for key, value in ranked},
        "confidence": round(min(0.95, max(0.45, scores[action] / 100)), 4),
        "reason": "Contextual bandit score from user state vector plus stored rewards.",
        "expectedBenefit": "Personalizes the next action using recent context and reward feedback.",
        "nextAction": action,
    }
