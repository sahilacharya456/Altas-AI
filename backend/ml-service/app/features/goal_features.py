from typing import Any


def goal_risk_score(goal: dict[str, Any], linked_task_completion: float = 0.0) -> float:
    progress = float(goal.get("progress", 0) or 0)
    return max(0, min(100, 70 - progress * 0.6 - linked_task_completion * 20))
