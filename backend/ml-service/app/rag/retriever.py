from typing import Any

from app.rag.vector_store import VECTOR_STORE


def retrieve(query: str, top_k: int = 3) -> list[dict[str, Any]]:
    return VECTOR_STORE.query(query, top_k)
