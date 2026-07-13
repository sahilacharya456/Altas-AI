import json
from pathlib import Path
from typing import Any

import joblib
from sklearn.metrics.pairwise import cosine_similarity

from app.rag.chunker import chunk_documents
from app.rag.embeddings import build_tfidf

# Persist user RAG stores under models/registry/rag/
from app.config import REGISTRY_DIR

RAG_DIR = REGISTRY_DIR / "rag"


def _user_index_path(user_id: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in user_id)
    return RAG_DIR / f"{safe}.joblib"


class InMemoryVectorStore:
    def __init__(self) -> None:
        self.chunks: list[dict[str, Any]] = []
        self.vectorizer = None
        self.matrix = None

    def index(self, documents: list[dict[str, Any]]) -> dict[str, Any]:
        self.chunks = chunk_documents(documents)
        if not self.chunks:
            self.vectorizer = None
            self.matrix = None
            return {"indexed": 0, "backend": "tfidf"}
        self.vectorizer, self.matrix = build_tfidf([chunk["text"] for chunk in self.chunks])
        return {"indexed": len(self.chunks), "backend": "tfidf"}

    def query(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        if self.vectorizer is None or self.matrix is None:
            return []
        query_vector = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self.matrix)[0]
        ranked = sorted(enumerate(scores), key=lambda item: item[1], reverse=True)[:top_k]
        return [
            {
                **self.chunks[index],
                "relevanceScore": round(float(score), 4),
            }
            for index, score in ranked
            if score > 0
        ]

    def is_empty(self) -> bool:
        return self.vectorizer is None

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"chunks": self.chunks, "vectorizer": self.vectorizer, "matrix": self.matrix}, path)

    @classmethod
    def load(cls, path: Path) -> "InMemoryVectorStore":
        store = cls()
        if not path.exists():
            return store
        try:
            data = joblib.load(path)
            store.chunks = data.get("chunks", [])
            store.vectorizer = data.get("vectorizer")
            store.matrix = data.get("matrix")
        except Exception:
            pass  # Corrupt file — return empty store, will be re-indexed
        return store


# ---------------------------------------------------------------------------
# Store selection helpers — prefer ChromaDB when available
# ---------------------------------------------------------------------------

def get_store_backend() -> str:
    """Return active backend name: 'chroma' or 'tfidf'."""
    from app.rag.chroma_store import is_chroma_available
    return "chroma" if is_chroma_available() else "tfidf"


# Global fallback store (used when no userId is provided)
VECTOR_STORE = InMemoryVectorStore()

# Per-user stores: userId -> InMemoryVectorStore (warm cache in memory)
_USER_STORES: dict[str, InMemoryVectorStore] = {}


def get_user_store(user_id: str) -> InMemoryVectorStore:
    if user_id not in _USER_STORES:
        # Try loading persisted store from disk first
        _USER_STORES[user_id] = InMemoryVectorStore.load(_user_index_path(user_id))
    return _USER_STORES[user_id]


def index_for_user(user_id: str, documents: list[dict[str, Any]]) -> dict[str, Any]:
    from app.rag.chroma_store import ChromaVectorStore, is_chroma_available
    if is_chroma_available():
        result = ChromaVectorStore(user_id).index(documents)
        result["userId"] = user_id
        return result

    store = get_user_store(user_id)
    result = store.index(documents)
    # Persist to disk so the store survives restarts
    store.save(_user_index_path(user_id))
    result["userId"] = user_id
    result["persisted"] = True
    return result


def query_for_user(user_id: str, query: str, top_k: int = 3) -> list[dict[str, Any]]:
    from app.rag.chroma_store import ChromaVectorStore, is_chroma_available
    if is_chroma_available():
        store = ChromaVectorStore(user_id)
        results = store.query(query, top_k)
        if results:
            return results
        # Fall through to TF-IDF if chroma collection is empty
    store_tfidf = get_user_store(user_id)
    if store_tfidf.is_empty():
        return VECTOR_STORE.query(query, top_k)
    return store_tfidf.query(query, top_k)

