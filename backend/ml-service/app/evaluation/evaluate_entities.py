import json

from app.config import DATASET_DIR
from app.evaluation.metrics import pass_result
from app.nlp.entity_extractor import extract_entities


def evaluate() -> dict:
    samples = json.loads((DATASET_DIR / "entity_samples.json").read_text(encoding="utf-8"))
    scores = []
    for sample in samples:
        actual = {entity["type"] for entity in extract_entities(sample["text"])["entities"]}
        expected = set(sample["entities"])
        scores.append(len(actual & expected) / max(1, len(expected)))
    score = sum(scores) / max(1, len(scores))
    return pass_result("entity_extractor", score, 0.8, {"caseScores": scores})
