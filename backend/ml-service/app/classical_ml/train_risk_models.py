from app.core.model_registry import save_model_metadata


def train() -> dict:
    metadata = {
        "modelType": "weighted_risk_baseline",
        "trained": False,
        "reason": "Risk models use explainable scoring until enough labeled user outcomes exist.",
    }
    save_model_metadata("risk_models", metadata)
    return metadata


if __name__ == "__main__":
    print(train())
