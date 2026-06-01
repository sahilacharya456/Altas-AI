from fastapi.testclient import TestClient

from app.main import app
from app.rl.reward_tracker import record_reward

client = TestClient(app)


def test_reward_export_endpoint():
    record_reward("test-user", "start_focus", 1.0)
    response = client.get("/recommend/export/test-user")
    assert response.status_code == 200
    payload = response.json()
    assert payload["format"] == "altasai_ml_reward_export_v1"
    assert payload["count"] >= 1
    assert any(row["recommendation"] == "start_focus" for row in payload["rows"])
