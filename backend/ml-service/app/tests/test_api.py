from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_api_health_and_core_endpoints():
    assert client.get("/health").json()["ok"] is True
    assert client.post("/predict/intent", json={"text": "show my weekly report"}).status_code == 200
    assert client.post("/predict/entities", json={"text": "I spent 500 rupees today"}).json()["entities"]
    assert client.post("/recommend/action", json={"userId": "u1", "context": {"tasks": []}}).json()["topRecommendation"]
    assert client.post("/vision/analyze", json={"extractedText": "timetable at 9"}).json()["extractedText"]
