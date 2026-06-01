from sklearn.metrics import accuracy_score, f1_score

from app.core.config_loader import ensure_directories
from app.core.model_registry import save_model_metadata
from app.nlp.intent_classifier import load_intent_samples, save_intent_model, train_intent_pipeline


def train() -> dict:
    ensure_directories()
    samples = load_intent_samples()
    pipeline = train_intent_pipeline("logistic")
    texts = [sample["text"] for sample in samples]
    labels = [sample["label"] for sample in samples]
    predictions = pipeline.predict(texts)
    metrics = {
        "accuracy": float(accuracy_score(labels, predictions)),
        "macroF1": float(f1_score(labels, predictions, average="macro")),
        "sampleCount": len(samples),
        "modelType": "tfidf_logistic_regression",
    }
    save_intent_model(pipeline)
    save_model_metadata("intent_classifier", metrics)
    return metrics


if __name__ == "__main__":
    print(train())
