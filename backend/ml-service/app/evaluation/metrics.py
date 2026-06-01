from collections import defaultdict
from typing import Any


def classification_metrics(expected: list[str], actual: list[str]) -> dict[str, Any]:
    labels = sorted(set(expected) | set(actual))
    correct = sum(1 for exp, pred in zip(expected, actual) if exp == pred)
    matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for exp, pred in zip(expected, actual):
        matrix[exp][pred] += 1

    per_label = []
    for label in labels:
        tp = sum(1 for exp, pred in zip(expected, actual) if exp == label and pred == label)
        fp = sum(1 for exp, pred in zip(expected, actual) if exp != label and pred == label)
        fn = sum(1 for exp, pred in zip(expected, actual) if exp == label and pred != label)
        precision = tp / max(1, tp + fp)
        recall = tp / max(1, tp + fn)
        f1 = 2 * precision * recall / max(0.0001, precision + recall)
        per_label.append((precision, recall, f1))

    return {
        "accuracy": round(correct / max(1, len(expected)), 4),
        "precision": round(sum(x[0] for x in per_label) / max(1, len(per_label)), 4),
        "recall": round(sum(x[1] for x in per_label) / max(1, len(per_label)), 4),
        "f1": round(sum(x[2] for x in per_label) / max(1, len(per_label)), 4),
        "confusionMatrix": {key: dict(value) for key, value in matrix.items()},
    }


def pass_result(name: str, score: float, threshold: float, details: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": name,
        "score": round(score, 4),
        "threshold": threshold,
        "passed": score >= threshold,
        "details": details,
    }
