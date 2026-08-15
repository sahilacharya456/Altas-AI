"""
3-model soft-voting ensemble intent classifier.
Models: TF-IDF + LogisticRegression, TF-IDF + MultinomialNB, char-ngram TF-IDF + LinearSVC.
Ensemble label = majority vote; ensemble confidence = mean of individual model probabilities.
"""
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from app.config import DATASET_DIR, INTENT_MODEL_PATH, UNKNOWN_INTENT_THRESHOLD

_ENSEMBLE_PATH = INTENT_MODEL_PATH.parent / "intent_ensemble.joblib"


def load_intent_samples() -> list[dict[str, str]]:
    return json.loads((DATASET_DIR / "intent_samples.json").read_text(encoding="utf-8"))


def _build_lr_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", C=1.5)),
    ])


def _build_nb_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", MultinomialNB(alpha=0.5)),
    ])


def _build_svm_pipeline() -> Pipeline:
    """LinearSVC wrapped in CalibratedClassifierCV to produce probabilities."""
    return Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), min_df=1, sublinear_tf=True)),
        ("clf", CalibratedClassifierCV(LinearSVC(max_iter=2000, C=1.0), cv=3)),
    ])


def train_ensemble(samples: list[dict[str, str]]) -> list[Pipeline]:
    texts = [s["text"] for s in samples]
    labels = [s["label"] for s in samples]
    pipelines = [_build_lr_pipeline(), _build_nb_pipeline(), _build_svm_pipeline()]
    for p in pipelines:
        p.fit(texts, labels)
    return pipelines


def save_intent_model(pipeline: Pipeline) -> None:
    """Legacy single-model save — kept for backward compat."""
    INTENT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, INTENT_MODEL_PATH)


def _save_ensemble(pipelines: list[Pipeline]) -> None:
    _ENSEMBLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipelines, _ENSEMBLE_PATH)


def _load_ensemble() -> list[Pipeline] | None:
    if _ENSEMBLE_PATH.exists():
        try:
            return joblib.load(_ENSEMBLE_PATH)
        except Exception:
            return None
    return None


def load_or_train_intent_model() -> Pipeline:
    """Returns the LR pipeline (legacy single-model API for callers that need it)."""
    if INTENT_MODEL_PATH.exists():
        return joblib.load(INTENT_MODEL_PATH)
    pipeline = _build_lr_pipeline()
    samples = load_intent_samples()
    pipeline.fit([s["text"] for s in samples], [s["label"] for s in samples])
    save_intent_model(pipeline)
    return pipeline


def train_intent_pipeline(model_type: str = "logistic") -> Pipeline:
    """Legacy entry-point used by training scripts."""
    samples = load_intent_samples()
    clf = LogisticRegression(max_iter=1000, class_weight="balanced") if model_type == "logistic" else MultinomialNB()
    pipeline = Pipeline([("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)), ("classifier", clf)])
    pipeline.fit([s["text"] for s in samples], [s["label"] for s in samples])
    return pipeline


def predict_intent(text: str) -> dict[str, Any]:
    """Soft-voting ensemble prediction. Falls back to single LR if ensemble not trained."""
    pipelines = _load_ensemble()

    if not pipelines:
        # Train ensemble on first call, then cache
        try:
            samples = load_intent_samples()
            pipelines = train_ensemble(samples)
            _save_ensemble(pipelines)
        except Exception:
            # Hard fallback: legacy single-model
            pipeline = load_or_train_intent_model()
            probs = pipeline.predict_proba([text])[0]
            classes = list(pipeline.classes_)
            ranked = np.argsort(probs)[::-1]
            top3 = [{"label": classes[i], "confidence": round(float(probs[i]), 4)} for i in ranked[:3]]
            top = top3[0] if top3 else {"label": "unknown", "confidence": 0.0}
            label = top["label"] if top["confidence"] >= UNKNOWN_INTENT_THRESHOLD else "unknown"
            return {"label": label, "confidence": top["confidence"], "top3": top3,
                    "model": "tfidf_logistic_fallback", "fallbackRecommended": label == "unknown", "ensemble": False}

    # Soft voting: average probability across all models
    all_classes: list[str] = list(pipelines[0].classes_)
    class_index = {c: i for i, c in enumerate(all_classes)}
    avg_probs = np.zeros(len(all_classes))

    for pipe in pipelines:
        probs = pipe.predict_proba([text])[0]
        # Align to shared class order (all models trained on same data so same classes)
        for i, cls in enumerate(pipe.classes_):
            avg_probs[class_index[cls]] += probs[i]

    avg_probs /= len(pipelines)

    ranked_idx = np.argsort(avg_probs)[::-1]
    top3 = [
        {"label": all_classes[i], "confidence": round(float(avg_probs[i]), 4)}
        for i in ranked_idx[:3]
    ]
    top = top3[0] if top3 else {"label": "unknown", "confidence": 0.0}
    label = top["label"] if top["confidence"] >= UNKNOWN_INTENT_THRESHOLD else "unknown"

    # Per-model agreement check
    individual_labels = [pipe.predict([text])[0] for pipe in pipelines]
    agreement = sum(1 for l in individual_labels if l == top["label"]) / len(pipelines)

    return {
        "label": label,
        "confidence": round(float(top["confidence"]), 4),
        "top3": top3,
        "model": "tfidf_ensemble_lr_nb_svm",
        "modelAgreement": round(agreement, 2),
        "individualPredictions": individual_labels,
        "ensemble": True,
        "fallbackRecommended": label == "unknown" or top["confidence"] < UNKNOWN_INTENT_THRESHOLD,
    }

