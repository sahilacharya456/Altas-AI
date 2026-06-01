from fastapi import APIRouter

from app.classical_ml.train_intent_classifier import train as train_intent
from app.classical_ml.train_recommendation_ranker import train as train_recommendation
from app.classical_ml.train_risk_models import train as train_risk
from app.classical_ml.train_safety_classifier import train as train_safety

router = APIRouter(prefix="/train")


@router.post("/intent")
def intent() -> dict:
    return train_intent()


@router.post("/all")
def all_models() -> dict:
    return {
        "intent": train_intent(),
        "risk": train_risk(),
        "recommendation": train_recommendation(),
        "safety": train_safety(),
    }
