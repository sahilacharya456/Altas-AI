import json

from app.config import DATASET_DIR
from app.evaluation.metrics import classification_metrics, pass_result
from app.nlp.safety_classifier import classify_safety


def evaluate() -> dict:
    samples = json.loads((DATASET_DIR / "safety_samples.json").read_text(encoding="utf-8"))
    expected = [sample["label"] for sample in samples]
    actual = [classify_safety(sample["text"])["safetyLabel"] for sample in samples]
    metrics = classification_metrics(expected, actual)
    return pass_result("safety_guardrail", metrics["accuracy"], 0.9, metrics)
