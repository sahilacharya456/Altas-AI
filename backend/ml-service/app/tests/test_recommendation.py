from app.recommendation.next_best_action import next_best_action
from app.rl.reward_tracker import record_reward


def test_recommendation_and_reward_tracking():
    context = {"tasks": [{"title": "Report", "status": "pending", "priority": "critical", "overdue": True}]}
    result = next_best_action("test-user", context)
    assert result["topRecommendation"]
    reward = record_reward("test-user", result["topRecommendation"], 1.0)
    assert reward["count"] >= 1
