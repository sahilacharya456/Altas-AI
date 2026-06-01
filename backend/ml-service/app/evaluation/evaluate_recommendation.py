from app.evaluation.metrics import pass_result
from app.recommendation.next_best_action import next_best_action


def evaluate() -> dict:
    context = {
        "tasks": [{"title": "Overdue report", "status": "pending", "priority": "critical", "overdue": True}],
        "reflections": [{"text": "I am stressed and delaying"}],
    }
    result = next_best_action("eval", context)
    top3 = result["top3Recommendations"]
    score = 1.0 if any(action in top3 for action in ["prioritize_urgent_task", "reschedule_task", "reduce_workload"]) else 0.0
    return pass_result("recommendation_engine", score, 0.8, {"top3": top3})
