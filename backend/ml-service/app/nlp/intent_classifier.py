import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

from app.config import DATASET_DIR, INTENT_MODEL_PATH, UNKNOWN_INTENT_THRESHOLD


def load_intent_samples() -> list[dict[str, str]]:
    return json.loads((DATASET_DIR / "intent_samples.json").read_text(encoding="utf-8"))


def train_intent_pipeline(model_type: str = "logistic") -> Pipeline:
    samples = load_intent_samples()
    classifier = LogisticRegression(max_iter=1000, class_weight="balanced") if model_type == "logistic" else MultinomialNB()
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("classifier", classifier),
    ])
    pipeline.fit([sample["text"] for sample in samples], [sample["label"] for sample in samples])
    return pipeline


def save_intent_model(pipeline: Pipeline) -> None:
    INTENT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, INTENT_MODEL_PATH)


def load_or_train_intent_model() -> Pipeline:
    if INTENT_MODEL_PATH.exists():
        return joblib.load(INTENT_MODEL_PATH)
    pipeline = train_intent_pipeline()
    save_intent_model(pipeline)
    return pipeline


def predict_intent(text: str) -> dict[str, Any]:
    pipeline = load_or_train_intent_model()
    probabilities = pipeline.predict_proba([text])[0]
    classes = list(pipeline.classes_)
    ranked_idx = np.argsort(probabilities)[::-1]
    top3 = [
        {"label": classes[index], "confidence": round(float(probabilities[index]), 4)}
        for index in ranked_idx[:3]
    ]
    top = top3[0] if top3 else {"label": "unknown", "confidence": 0.0}
    label = top["label"] if top["confidence"] >= UNKNOWN_INTENT_THRESHOLD else "unknown"
    return {
        "label": label,
        "confidence": top["confidence"],
        "top3": top3,
        "model": "tfidf_logistic_regression",
        "fallbackRecommended": label == "unknown",
    }
