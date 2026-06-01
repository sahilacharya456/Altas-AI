from app.api.routes_predict import risk, ContextRequest
from app.evaluation.metrics import pass_result


def evaluate() -> dict:
    context = {
        "tasks": [
            {"title": "Submit report", "status": "pending", "priority": "critical", "overdue": True, "carryCount": 2},
            {"title": "Record demo", "status": "pending", "priority": "high"},
        ],
        "goals": [{"title": "Launch", "progress": 10}],
        "reflections": [{"text": "I am stressed and avoiding work."}],
        "focusSessions": [],
    }
    result = risk(ContextRequest(context=context))
    bucket = result["models"]["DeadlineRiskModel"]["bucket"]
    score = 1.0 if bucket in ["high", "critical"] else 0.0
    return pass_result("risk_models", score, 0.75, {"deadlineBucket": bucket})
