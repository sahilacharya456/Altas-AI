"""
BM25 reranker — replaces naive word-overlap scoring.
BM25 is the industry-standard probabilistic retrieval model (used by Elasticsearch).
Zero new dependencies: pure Python + math.
"""
import math
from collections import Counter
from typing import Any


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def _idf(term: str, corpus: list[list[str]], n_docs: int) -> float:
    df = sum(1 for doc in corpus if term in doc)
    return math.log((n_docs - df + 0.5) / (df + 0.5) + 1)


def _bm25_score(
    query_terms: list[str],
    doc_terms: list[str],
    idfs: dict[str, float],
    avgdl: float,
    k1: float = 1.5,
    b: float = 0.75,
) -> float:
    tf = Counter(doc_terms)
    dl = len(doc_terms)
    score = 0.0
    for term in query_terms:
        if term not in tf:
            continue
        freq = tf[term]
        idf = idfs.get(term, 0.0)
        numerator = freq * (k1 + 1)
        denominator = freq + k1 * (1 - b + b * dl / (avgdl or 1))
        score += idf * (numerator / denominator)
    return score


def rerank(query: str, results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not results:
        return results

    query_terms = _tokenize(query)
    corpus = [_tokenize(str(item.get("text", ""))) for item in results]
    n_docs = len(corpus)
    avgdl = sum(len(doc) for doc in corpus) / n_docs if n_docs else 1

    idfs = {term: _idf(term, corpus, n_docs) for term in set(query_terms)}

    scored = []
    for item, doc_terms in zip(results, corpus):
        bm25 = _bm25_score(query_terms, doc_terms, idfs, avgdl)
        # Blend BM25 with the vector store's cosine relevance score for best results
        cosine = float(item.get("relevanceScore", 0))
        combined = bm25 * 0.6 + cosine * 0.4
        scored.append({**item, "relevanceScore": round(combined, 4)})

    return sorted(scored, key=lambda x: x["relevanceScore"], reverse=True)
