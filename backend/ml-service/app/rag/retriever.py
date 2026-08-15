"""
Retrieval layer for the RAG pipeline.

retrieve_for_user() uses the Hybrid RRF retriever (BM25 + semantic) when the
user's vector store has chunks. Falls back to plain cosine query otherwise.
"""
from typing import Any

from app.rag.vector_store import VECTOR_STORE, query_for_user, get_user_store


def retrieve(query: str, top_k: int = 3) -> list[dict[str, Any]]:
    return VECTOR_STORE.query(query, top_k)


def retrieve_for_user(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """
    Retrieves relevant context chunks for the given user + query.
    Uses hybrid RRF (BM25 + semantic) when the user store has enough chunks.
    Falls back to plain cosine when corpus is too small for LSA.
    """
    try:
        from app.rag.hybrid_retriever import hybrid_retrieve
        store = get_user_store(user_id)
        if store.chunks and len(store.chunks) >= 3:
            return hybrid_retrieve(query, store.chunks, top_k=top_k)
    except Exception:
        pass

    # Fallback: original cosine query
    return query_for_user(user_id, query, top_k)

