from typing import Any

from app.rag.vector_store import VECTOR_STORE, query_for_user


def retrieve(query: str, top_k: int = 3) -> list[dict[str, Any]]:
    return VECTOR_STORE.query(query, top_k)


def retrieve_for_user(user_id: str, query: str, top_k: int = 3) -> list[dict[str, Any]]:
    return query_for_user(user_id, query, top_k)
