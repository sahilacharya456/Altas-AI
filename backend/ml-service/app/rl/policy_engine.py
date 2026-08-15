"""
Policy Engine — contextual bandit action selection.

Upgrades vs. original:
  1. Min-max feature normalization: all state_vector values scaled to [0, 1]
     before scoring (raw values like executionReadinessScore=45 and burnoutRiskScore=80
     were on different scales — mixing them without normalization gives wrong rankings).
  2. 3 derived features: momentum, avoidance_index, consistency_streak.
  3. UCB1 exploration (replaces epsilon-greedy) for more efficient exploration.
"""
from typing import Any

from app.rl.exploration_strategy import ucb1, epsilon_greedy
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

# Known score range for each state feature [min, max]
_FEATURE_RANGES: dict[str, tuple[float, float]] = {
    "executionReadinessScore": (0, 100),
    "planningNeedScore": (0, 100),
    "deadlineRiskScore": (0, 100),
    "stressSignalScore": (0, 100),
    "goalProgressScore": (0, 100),
    "consistencyScore": (0, 100),
    "burnoutRiskScore": (0, 100),
    "workloadScore": (0, 100),
    # Derived features
    "momentum": (0, 1),
    "avoidance_index": (0, 1),
    "consistency_streak": (0, 30),
}


def _normalize(key: str, value: float) -> float:
    """Min-max normalize a feature value to [0, 1]."""
    lo, hi = _FEATURE_RANGES.get(key, (0, 100))
    if hi == lo:
        return 0.5
    return max(0.0, min(1.0, (value - lo) / (hi - lo)))


def _derive_features(state_vector: dict[str, Any]) -> dict[str, float]:
    """
    Compute 3 derived features that the bandit can't see directly from raw scores.
    These are inferred from combinations of existing signals.
    """
    execution = float(state_vector.get("executionReadinessScore", 50) if not isinstance(state_vector.get("executionReadinessScore"), dict) else state_vector["executionReadinessScore"].get("value", 50))
    consistency = float(state_vector.get("consistencyScore", 50) if not isinstance(state_vector.get("consistencyScore"), dict) else state_vector["consistencyScore"].get("value", 50))
    deadline = float(state_vector.get("deadlineRiskScore", 0) if not isinstance(state_vector.get("deadlineRiskScore"), dict) else state_vector["deadlineRiskScore"].get("value", 0))
    burnout = float(state_vector.get("burnoutRiskScore", 0) if not isinstance(state_vector.get("burnoutRiskScore"), dict) else state_vector["burnoutRiskScore"].get("value", 0))

    # momentum: high execution + high consistency = positive momentum
    momentum = (execution / 100) * 0.6 + (consistency / 100) * 0.4

    # avoidance_index: deadline risk but low execution = avoidance pattern
    avoidance_index = max(0.0, (deadline / 100) - (execution / 100)) * 0.8

    # consistency_streak: inferred from consistency score as a 0–30 day estimate
    consistency_streak = max(0, min(30, int(consistency / 100 * 25)))

    return {
        "momentum": round(momentum, 3),
        "avoidance_index": round(avoidance_index, 3),
        "consistency_streak": float(consistency_streak),
    }


def score_actions(user_id: str, state_vector: dict[str, Any]) -> dict[str, float]:
    """Compute heuristic scores for all actions using normalized state features + derived features."""
    raw = {
        key: float(value.get("value", 0)) if isinstance(value, dict) else float(value)
        for key, value in state_vector.items()
    }
    derived = _derive_features(state_vector)
    raw.update(derived)

    # Normalize all features to [0, 1]
    norm = {key: _normalize(key, val) for key, val in raw.items()}

    scores = {
        "start_focus":           norm.get("executionReadinessScore", 0.45) * 100,
        "break_task":            norm.get("planningNeedScore", 0.45) * 80 + norm.get("workloadScore", 0) * 20,
        "reschedule_task":       norm.get("deadlineRiskScore", 0) * 100,
        "write_reflection":      45 + norm.get("stressSignalScore", 0) * 25,
        "review_goal":           (1 - norm.get("goalProgressScore", 0.5)) * 100,
        "generate_report":       40 + norm.get("consistencyScore", 0.5) * 15,
        "reduce_workload":       norm.get("burnoutRiskScore", 0) * 70 + norm.get("workloadScore", 0) * 30,
        "prioritize_urgent_task": norm.get("deadlineRiskScore", 0) * 80 + norm.get("workloadScore", 0) * 20,
        "mentor_plan":           55 + norm.get("momentum", 0) * 15 + norm.get("planningNeedScore", 0) * 15,
    }

    # Avoidance index boost for reschedule when avoidance is high
    scores["reschedule_task"] += norm.get("avoidance_index", 0) * 20

    return scores


def choose_action(user_id: str, state_vector: dict[str, Any]) -> dict[str, Any]:
    scores = score_actions(user_id, state_vector)
    rewards = load_rewards(user_id)

    # Use UCB1 when we have reward history; fall back to epsilon-greedy on cold start
    if rewards:
        action = ucb1(ACTIONS, scores, rewards)
        strategy = "ucb1"
    else:
        action = epsilon_greedy(ACTIONS, scores)
        strategy = "epsilon_greedy_cold_start"

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return {
        "topRecommendation": action,
        "top3Recommendations": [item[0] for item in ranked[:3]],
        "rankingScores": {key: round(value, 2) for key, value in ranked},
        "confidence": round(min(0.95, max(0.45, scores[action] / 100)), 4),
        "explorationStrategy": strategy,
        "reason": f"UCB1 contextual bandit with normalized state features and {len(rewards)} reward observations.",
        "expectedBenefit": "Personalizes next action using recent context, reward feedback, and targeted exploration.",
        "nextAction": action,
    }

