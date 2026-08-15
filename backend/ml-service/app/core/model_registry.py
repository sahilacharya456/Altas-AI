"""
Model Registry — MLflow-style versioning with A/B staged rollout.

Each registered model stores:
  version, trainedAt, trainingSamples, accuracy, f1, precision, recall,
  champion (bool), challenger (bool)

Staged rollout: if a challenger with better F1 exists, it receives 20% of traffic.
This prevents blindly deploying unvalidated models to all users.
"""
import json
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import REGISTRY_DIR


def save_model_metadata(name: str, metadata: dict[str, Any]) -> Path:
    """Save a model version entry. Increments version automatically."""
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    existing = load_model_metadata(name) or {}
    version = int(existing.get("version", 0)) + 1
    payload = {
        "name": name,
        "version": version,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "trainedAt": metadata.get("trainedAt", datetime.now(timezone.utc).isoformat()),
        "trainingSamples": metadata.get("trainingSamples", 0),
        "accuracy": metadata.get("accuracy"),
        "f1": metadata.get("f1"),
        "precision": metadata.get("precision"),
        "recall": metadata.get("recall"),
        "champion": metadata.get("champion", True),
        "challenger": metadata.get("challenger", False),
        **{k: v for k, v in metadata.items()
           if k not in ("trainedAt", "trainingSamples", "accuracy", "f1",
                        "precision", "recall", "champion", "challenger")},
    }
    path = REGISTRY_DIR / f"{name}.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def save_challenger(name: str, metadata: dict[str, Any]) -> Path:
    """Register a challenger model alongside the champion. Stored as {name}_challenger.json."""
    return save_model_metadata(f"{name}_challenger", {**metadata, "champion": False, "challenger": True})


def load_model_metadata(name: str) -> dict[str, Any] | None:
    path = REGISTRY_DIR / f"{name}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def choose_model(name: str, challenger_traffic_pct: float = 0.20) -> dict[str, Any]:
    """
    Returns which model variant to use for this request.

    If a challenger exists with better F1 than the champion, it gets
    challenger_traffic_pct% of traffic (default 20%).

    Returns:
        {"variant": "champion"|"challenger", "metadata": {...}}
    """
    champion = load_model_metadata(name)
    challenger = load_model_metadata(f"{name}_challenger")

    if champion is None:
        return {"variant": "champion", "metadata": {}}

    if challenger is None:
        return {"variant": "champion", "metadata": champion}

    # Only route to challenger if it has better F1 than champion
    champion_f1 = float(champion.get("f1") or 0)
    challenger_f1 = float(challenger.get("f1") or 0)

    if challenger_f1 > champion_f1 and random.random() < challenger_traffic_pct:
        return {"variant": "challenger", "metadata": challenger}

    return {"variant": "champion", "metadata": champion}


def promote_challenger(name: str) -> bool:
    """Promote challenger to champion by overwriting the champion file."""
    challenger = load_model_metadata(f"{name}_challenger")
    if not challenger:
        return False
    champion_path = REGISTRY_DIR / f"{name}.json"
    promoted = {**challenger, "champion": True, "challenger": False,
                "promotedAt": datetime.now(timezone.utc).isoformat()}
    champion_path.write_text(json.dumps(promoted, indent=2), encoding="utf-8")
    # Remove old challenger entry
    challenger_path = REGISTRY_DIR / f"{name}_challenger.json"
    if challenger_path.exists():
        challenger_path.unlink()
    return True


def list_models() -> list[dict[str, Any]]:
    """List all registered models and their latest metadata."""
    models = []
    for path in REGISTRY_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            models.append(data)
        except Exception:
            pass
    return sorted(models, key=lambda m: m.get("updatedAt", ""), reverse=True)

