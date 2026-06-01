from app.nlp.intent_classifier import load_intent_samples, predict_intent
from app.evaluation.metrics import classification_metrics, pass_result


def evaluate() -> dict:
    samples = load_intent_samples()
    expected = [sample["label"] for sample in samples]
    actual = [predict_intent(sample["text"])["label"] for sample in samples]
    metrics = classification_metrics(expected, actual)
    return pass_result("intent_classifier", metrics["accuracy"], 0.85, metrics)
