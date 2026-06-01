from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.features.feature_builder import build_features
from app.nlp.entity_extractor import extract_entities
from app.nlp.intent_classifier import predict_intent
from app.nlp.safety_classifier import classify_safety
from app.nlp.sentiment_emotion_model import analyze_reflection

router = APIRouter(prefix="/predict")


class TextRequest(BaseModel):
    text: str = Field(min_length=1)


class ContextRequest(BaseModel):
    context: dict[str, Any] = Field(default_factory=dict)


@router.post("/intent")
def intent(request: TextRequest) -> dict:
    return predict_intent(request.text)


@router.post("/entities")
def entities(request: TextRequest) -> dict:
    return extract_entities(request.text)


@router.post("/reflection")
def reflection(request: TextRequest) -> dict:
    return analyze_reflection(request.text)


@router.post("/risk")
def risk(request: ContextRequest) -> dict:
    features = build_features(request.context)
    vector = features["userStateVector"]

    def bucket(score: float) -> str:
        return "critical" if score >= 85 else "high" if score >= 65 else "medium" if score >= 35 else "low"

    risk_scores = {
        "DeadlineRiskModel": vector["deadlineRiskScore"],
        "BurnoutRiskModel": vector["burnoutRiskScore"],
        "FocusReadinessModel": vector["executionReadinessScore"],
        "GoalRiskModel": {"value": 100 - vector["goalProgressScore"]["value"], "confidence": 0.62, "evidence": vector["goalProgressScore"]["evidence"], "reason": "Inverse of goal progress score."},
        "WorkloadRiskModel": vector["workloadScore"],
    }
    return {
        "models": {
            name: {
                **score,
                "bucket": bucket(score["value"]),
                "recommendedAction": "Reduce scope and choose one next action." if score["value"] >= 65 else "Maintain one visible execution block.",
            }
            for name, score in risk_scores.items()
        },
        "features": features,
    }


@router.post("/safety")
def safety(request: TextRequest) -> dict:
    return classify_safety(request.text)
