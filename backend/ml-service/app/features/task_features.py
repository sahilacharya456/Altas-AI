from typing import Any


def task_priority_score(task: dict[str, Any]) -> float:
    priority = {"low": 15, "medium": 35, "high": 65, "critical": 85}.get(str(task.get("priority", "medium")), 35)
    overdue = 18 if task.get("overdue") or task.get("isOverdue") else 0
    carry = min(20, int(task.get("carryCount", 0) or 0) * 7)
    effort_penalty = min(15, float(task.get("estimatedMinutes", 30) or 30) / 20)
    return max(0, min(100, priority + overdue + carry - effort_penalty))
