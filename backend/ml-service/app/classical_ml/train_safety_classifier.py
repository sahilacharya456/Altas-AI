from app.core.model_registry import save_model_metadata


def train() -> dict:
    metadata = {
        "modelType": "regex_safety_classifier",
        "trained": False,
        "reason": "Safety classifier is deliberately conservative and rule-based until reviewed datasets exist.",
    }
    save_model_metadata("safety_classifier", metadata)
    return metadata


if __name__ == "__main__":
    print(train())
