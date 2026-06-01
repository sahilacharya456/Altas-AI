import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import REGISTRY_DIR


def save_model_metadata(name: str, metadata: dict[str, Any]) -> Path:
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "name": name,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        **metadata,
    }
    path = REGISTRY_DIR / f"{name}.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def load_model_metadata(name: str) -> dict[str, Any] | None:
    path = REGISTRY_DIR / f"{name}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))
