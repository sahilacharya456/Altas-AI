from app.evaluation.evaluate_entities import evaluate as evaluate_entities
from app.evaluation.evaluate_intent import evaluate as evaluate_intent
from app.evaluation.evaluate_rag import evaluate as evaluate_rag
from app.evaluation.evaluate_recommendation import evaluate as evaluate_recommendation
from app.evaluation.evaluate_risk import evaluate as evaluate_risk
from app.evaluation.evaluate_safety import evaluate as evaluate_safety
from app.evaluation.evaluate_vision import evaluate as evaluate_vision


def run_evaluation() -> dict:
    results = [
        evaluate_intent(),
        evaluate_entities(),
        evaluate_risk(),
        evaluate_recommendation(),
        evaluate_rag(),
        evaluate_safety(),
        evaluate_vision(),
    ]
    return {
        "passed": all(result["passed"] for result in results),
        "results": results,
    }


if __name__ == "__main__":
    result = run_evaluation()
    for item in result["results"]:
        status = "PASS" if item["passed"] else "FAIL"
        print(f"{status} {item['name']}: score={item['score']} threshold={item['threshold']}")
    if not result["passed"]:
        raise SystemExit(1)
