from app.api.routes_predict import ContextRequest, risk


def test_risk_prediction_buckets_overdue_work():
    result = risk(ContextRequest(context={
        "tasks": [{"status": "pending", "priority": "critical", "overdue": True, "carryCount": 2}],
        "reflections": [{"text": "I am stressed"}],
    }))
    assert result["models"]["DeadlineRiskModel"]["bucket"] in ["high", "critical"]
