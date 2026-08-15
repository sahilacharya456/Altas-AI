"""
Hybrid Retriever using Reciprocal Rank Fusion (RRF).

Combines:
  - BM25 lexical ranking (high precision for exact terms)
  - Semantic LSA/embedding cosine ranking (high recall for synonyms)

RRF formula: score(d) = sum_i( 1 / (k + rank_i(d)) )  where k=60 (standard)

This is the algorithm powering hybrid search in Elasticsearch, Vespa, and Weaviate.
Zero new dependencies — uses BM25 from reranker.py and semantic embeddings from embeddings.py.
"""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.rag.reranker import rerank as bm25_rerank
from app.rag.embeddings import build_semantic

_RRF_K = 60  # standard constant; higher = less sensitive to top-rank position


def _rrf_score(rank: int, k: int = _RRF_K) -> float:
    return 1.0 / (k + rank + 1)


def hybrid_retrieve(
    query: str,
    chunks: list[dict[str, Any]],
    top_k: int = 5,
    bm25_weight: float = 0.5,
    semantic_weight: float = 0.5,
) -> list[dict[str, Any]]:
    """
    Retrieves top_k results by fusing BM25 and semantic rankings via RRF.

    Returns chunks sorted by fused score with added 'rrf_score' and 'retrievalMethod' fields.
    """
    if not chunks:
        return []

    # Ensure each chunk has an id
    indexed = [{**c, "id": c.get("id", str(i))} for i, c in enumerate(chunks)]

    # ── BM25 ranking ─────────────────────────────────────────────────────────
    chunks_for_bm25 = [{**c, "relevanceScore": c.get("relevanceScore", 0.0)} for c in indexed]
    bm25_ranked = bm25_rerank(query, chunks_for_bm25)
    bm25_rank: dict[str, int] = {c["id"]: i for i, c in enumerate(bm25_ranked)}

    # ── Semantic ranking ──────────────────────────────────────────────────────
    texts = [str(c.get("text", "")) for c in indexed]
    semantic_rank: dict[str, int] = {}
    try:
        encoder, matrix = build_semantic(texts)
        q_vec = np.array(encoder.transform([query]))
        if q_vec.ndim == 1:
            q_vec = q_vec.reshape(1, -1)
        if hasattr(matrix, "toarray"):
            matrix = matrix.toarray()
        scores = cosine_similarity(q_vec, matrix)[0]
        for rank, idx in enumerate(np.argsort(scores)[::-1]):
            semantic_rank[indexed[idx]["id"]] = rank
    except Exception:
        semantic_rank = bm25_rank.copy()

    # ── Reciprocal Rank Fusion ────────────────────────────────────────────────
    chunk_map = {c["id"]: c for c in indexed}
    fused: dict[str, float] = {}
    for chunk_id in chunk_map:
        b_r = bm25_rank.get(chunk_id, len(chunks))
        s_r = semantic_rank.get(chunk_id, len(chunks))
        fused[chunk_id] = (bm25_weight * _rrf_score(b_r) +
                           semantic_weight * _rrf_score(s_r))

    top_ids = sorted(fused, key=lambda cid: fused[cid], reverse=True)[:top_k]

    return [
        {
            **chunk_map[cid],
            "relevanceScore": round(fused[cid], 6),
            "rrf_score": round(fused[cid], 6),
            "retrievalMethod": "hybrid_rrf",
        }
        for cid in top_ids
    ]
