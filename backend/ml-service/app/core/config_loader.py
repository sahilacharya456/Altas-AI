from app.config import DATASET_DIR, MODEL_DIR, REGISTRY_DIR


def ensure_directories() -> None:
    for path in (DATASET_DIR, MODEL_DIR, REGISTRY_DIR):
        path.mkdir(parents=True, exist_ok=True)
