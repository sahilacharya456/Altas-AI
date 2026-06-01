from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "datasets"
MODEL_DIR = BASE_DIR / "models" / "trained"
REGISTRY_DIR = BASE_DIR / "models" / "registry"
INTENT_MODEL_PATH = MODEL_DIR / "intent_classifier.joblib"
INTENT_METADATA_PATH = REGISTRY_DIR / "intent_classifier.json"
REWARD_STORE_PATH = REGISTRY_DIR / "bandit_rewards.json"

UNKNOWN_INTENT_THRESHOLD = 0.045
