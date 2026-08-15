"""
Citation Quality Scorer for the RAG pipeline.

quality = relevance × specificity
  relevance  = RRF/cosine score from retrieval
  specificity = inverse document density — unique terms score higher

High-quality citations bubble to the top, ensuring the LLM gets
the most signal-dense snippets first in its context window.
"""
from __future__ import annotations

import math
from typing import Any


def _specificity(text: str, corpus_texts: list[str]) -> float:
    """Compute IDF-based uniqueness of this chunk's terms relative to the corpus."""
    if not corpus_texts:
        return 1.0
    tokens = text.lower().split()
    if not tokens:
        return 0.0
    n = len(corpus_texts)
    idf_sum = sum(
        math.log((n + 1) / (sum(1 for doc in corpus_texts if t in doc.lower()) + 1)) + 1.0
        for t in set(tokens)
    )
    return min(1.0, idf_sum / (len(set(tokens)) * (math.log(n + 2) + 1)))


def build_citations(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Original citation builder — kept for backward compatibility."""
    return [
        {
            "sourceId": item.get("sourceId"),
            "chunkId": item.get("id"),
            "relevanceScore": item.get("relevanceScore"),
            "snippet": str(item.get("text", ""))[:220],
        }
        for item in results
    ]


def score_citations(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Adds citationQuality = relevance × specificity to each chunk,
    then re-sorts by quality descending.
    """
    if not chunks:
        return chunks
    corpus = [str(c.get("text", "")) for c in chunks]
    scored = []
    for chunk in chunks:
        text = str(chunk.get("text", ""))
        relevance = float(chunk.get("relevanceScore", 0.0))
        others = [t for t in corpus if t != text]
        spec = _specificity(text, others)
        scored.append({**chunk, "specificity": round(spec, 4),
                       "citationQuality": round(relevance * spec, 6)})
    return sorted(scored, key=lambda c: c["citationQuality"], reverse=True)


def format_citations_for_prompt(chunks: list[dict[str, Any]], max_chars: int = 2000) -> str:
    """Formats top-quality citations into a compact context string for the AI prompt."""
    scored = score_citations(chunks)
    lines: list[str] = []
    total = 0
    for i, chunk in enumerate(scored, 1):
        text = str(chunk.get("text", "")).strip()
        meta = chunk.get("metadata", {})
        source = meta.get("type", "context") if isinstance(meta, dict) else "context"
        quality = chunk.get("citationQuality", 0)
        line = f"[{i}] ({source}, q={quality:.3f}) {text}"
        if total + len(line) > max_chars:
            break
        lines.append(line)
        total += len(line)
    return "\n".join(lines)

