from typing import Any

from app.features.task_features import task_priority_score


def rank_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranked = []
    for task in tasks:
        score = task_priority_score(task)
        ranked.append({
            "id": task.get("id"),
            "title": task.get("title", "Untitled task"),
            "score": round(score, 2),
            "reason": "Priority, overdue status, carry debt, and estimated effort.",
        })
    return sorted(ranked, key=lambda item: item["score"], reverse=True)
