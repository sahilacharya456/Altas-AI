from app.classical_ml.train_intent_classifier import train
from app.nlp.intent_classifier import predict_intent


def test_intent_training_and_prediction():
    metrics = train()
    assert metrics["accuracy"] >= 0.85
    result = predict_intent("start focus for 25 minutes")
    assert result["label"] == "start_focus"
    assert len(result["top3"]) >= 3
