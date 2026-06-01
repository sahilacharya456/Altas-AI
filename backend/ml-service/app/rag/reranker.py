from typing import Any


def rerank(query: str, results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    query_terms = set(query.lower().split())
    def score(item: dict[str, Any]) -> float:
        text_terms = set(str(item.get("text", "")).lower().split())
        overlap = len(query_terms & text_terms)
        return float(item.get("relevanceScore", 0)) + overlap * 0.03
    return sorted(results, key=score, reverse=True)
