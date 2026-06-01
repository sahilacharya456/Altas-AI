from typing import Any


def build_citations(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "sourceId": item.get("sourceId"),
            "chunkId": item.get("id"),
            "relevanceScore": item.get("relevanceScore"),
            "snippet": str(item.get("text", ""))[:220],
        }
        for item in results
    ]
