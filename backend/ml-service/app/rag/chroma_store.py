"""ChromaDB-backed vector store for AltasAI RAG pipeline.

Falls back gracefully to the in-memory TF-IDF store if ChromaDB is not running.
Uses sentence-transformers all-MiniLM-L6-v2 for embeddings (80 MB, no API key).
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import CHROMA_HOST, CHROMA_PORT, USE_CHROMA
from app.rag.chunker import chunk_documents

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Availability probe — lazy, attempted once per process
# ---------------------------------------------------------------------------
_CHROMA_AVAILABLE: bool | None = None
_chroma_client: Any = None
_embedding_fn: Any = None


def _check_availability() -> bool:
    global _CHROMA_AVAILABLE, _chroma_client, _embedding_fn
    if _CHROMA_AVAILABLE is not None:
        return _CHROMA_AVAILABLE

    if not USE_CHROMA:
        _CHROMA_AVAILABLE = False
        return False

    try:
        import chromadb
        from chromadb.utils import embedding_functions

        client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        client.heartbeat()  # raises if server is unreachable

        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )

        _chroma_client = client
        _embedding_fn = ef
        _CHROMA_AVAILABLE = True
        logger.info("chroma.available host=%s port=%s", CHROMA_HOST, CHROMA_PORT)
    except Exception as exc:
        _CHROMA_AVAILABLE = False
        logger.warning("chroma.unavailable reason=%s — falling back to TF-IDF", exc)

    return _CHROMA_AVAILABLE


def is_chroma_available() -> bool:
    return _check_availability()


# ---------------------------------------------------------------------------
# Safe collection name
# ---------------------------------------------------------------------------
def _safe_collection(user_id: str) -> str:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in user_id)
    return f"altasai_user_{safe}"


# ---------------------------------------------------------------------------
# ChromaVectorStore
# ---------------------------------------------------------------------------
class ChromaVectorStore:
    """Per-user ChromaDB collection wrapper."""

    def __init__(self, user_id: str) -> None:
        self._user_id = user_id
        self._collection_name = _safe_collection(user_id)
        self._col: Any = None  # lazy

    def _get_collection(self) -> Any:
        if self._col is None:
            self._col = _chroma_client.get_or_create_collection(
                name=self._collection_name,
                embedding_function=_embedding_fn,
                metadata={"hnsw:space": "cosine"},
            )
        return self._col

    def index(self, documents: list[dict[str, Any]]) -> dict[str, Any]:
        chunks = chunk_documents(documents)
        if not chunks:
            return {"indexed": 0, "backend": "chroma"}

        col = self._get_collection()
        ids = [chunk.get("sourceId") or f"chunk-{i}" for i, chunk in enumerate(chunks)]
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [{"sourceId": chunk.get("sourceId", ""), "userId": self._user_id} for chunk in chunks]

        # Upsert so re-indexing is idempotent
        col.upsert(ids=ids, documents=texts, metadatas=metadatas)
        return {"indexed": len(chunks), "backend": "chroma"}

    def query(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        col = self._get_collection()
        try:
            results = col.query(
                query_texts=[query],
                n_results=min(top_k, max(1, col.count())),
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            return []

        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]

        output = []
        for text, meta, dist in zip(docs, metas, dists):
            relevance = round(max(0.0, 1.0 - dist), 4)  # cosine distance -> similarity
            output.append({
                "text": text,
                "sourceId": meta.get("sourceId"),
                "relevanceScore": relevance,
            })
        return output

    def is_empty(self) -> bool:
        try:
            return self._get_collection().count() == 0
        except Exception:
            return True


# ---------------------------------------------------------------------------
# Global fallback store (shared, no userId)
# ---------------------------------------------------------------------------
class ChromaGlobalStore:
    """Global ChromaDB collection for non-user-scoped documents."""

    COLLECTION_NAME = "altasai_global"

    def __init__(self) -> None:
        self._col: Any = None

    def _get_collection(self) -> Any:
        if self._col is None:
            self._col = _chroma_client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                embedding_function=_embedding_fn,
                metadata={"hnsw:space": "cosine"},
            )
        return self._col

    def index(self, documents: list[dict[str, Any]]) -> dict[str, Any]:
        chunks = chunk_documents(documents)
        if not chunks:
            return {"indexed": 0, "backend": "chroma"}
        col = self._get_collection()
        ids = [chunk.get("sourceId") or f"global-{i}" for i, chunk in enumerate(chunks)]
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [{"sourceId": chunk.get("sourceId", "")} for chunk in chunks]
        col.upsert(ids=ids, documents=texts, metadatas=metadatas)
        return {"indexed": len(chunks), "backend": "chroma"}

    def query(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        col = self._get_collection()
        try:
            count = col.count()
            if count == 0:
                return []
            results = col.query(
                query_texts=[query],
                n_results=min(top_k, count),
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            return []
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]
        return [
            {"text": t, "sourceId": m.get("sourceId"), "relevanceScore": round(max(0.0, 1.0 - d), 4)}
            for t, m, d in zip(docs, metas, dists)
        ]

    def is_empty(self) -> bool:
        try:
            return self._get_collection().count() == 0
        except Exception:
            return True
