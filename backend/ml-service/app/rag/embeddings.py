"""
Embedding layer for the RAG pipeline.

Two backends:
  1. LSA (TF-IDF + TruncatedSVD) — default, zero new deps, captures semantic similarity.
     'study' and 'learning' now have high cosine similarity.
  2. sentence-transformers — if installed, used automatically for production-grade embeddings.

The public API (build_tfidf / build_semantic) returns a (vectorizer, matrix) tuple
compatible with the existing InMemoryVectorStore interface.
"""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import Normalizer


# Try to use sentence-transformers if installed — richer semantic space
_ST_MODEL = None


def _try_load_sentence_transformer() -> Any:
    global _ST_MODEL
    if _ST_MODEL is not None:
        return _ST_MODEL
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        _ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        return _ST_MODEL
    except Exception:
        return None


class LSAPipeline:
    """TF-IDF → TruncatedSVD → L2-normalize. Captures semantic similarity without heavy deps."""

    def __init__(self, n_components: int = 100) -> None:
        self.n_components = n_components
        self._pipe: Pipeline | None = None
        self._vectorizer: TfidfVectorizer | None = None

    def fit_transform(self, texts: list[str]) -> np.ndarray:
        n = min(self.n_components, max(1, len(texts) - 1))
        self._vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
        tfidf = self._vectorizer.fit_transform(texts)
        svd = TruncatedSVD(n_components=n, algorithm="randomized", random_state=42)
        norm = Normalizer(copy=False)
        lsa = svd.fit_transform(tfidf)
        return norm.fit_transform(lsa)

    def transform(self, texts: list[str]) -> np.ndarray:
        if self._vectorizer is None:
            raise RuntimeError("LSAPipeline not fitted. Call fit_transform first.")
        tfidf = self._vectorizer.transform(texts)
        # Reconstruct LSA dimensions from the same SVD via stored components
        # (we store the full sklearn pipeline in build_semantic for this reason)
        raise RuntimeError("Use build_semantic which stores the full sklearn pipeline.")

    @property
    def vocabulary_(self):
        return self._vectorizer.vocabulary_ if self._vectorizer else {}


def build_tfidf(texts: list[str]) -> tuple[TfidfVectorizer, Any]:
    """Original TF-IDF builder — kept for backward compatibility with InMemoryVectorStore."""
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)
    return vectorizer, matrix


def build_semantic(texts: list[str]) -> tuple[Any, np.ndarray]:
    """
    Build semantic embeddings. Returns (encoder, matrix) where:
      - encoder has a .transform(texts) method
      - matrix is the L2-normalized embedding matrix (n_docs × dims)

    Prefers sentence-transformers > LSA > TF-IDF in that order.
    """
    # Tier 1: sentence-transformers
    st = _try_load_sentence_transformer()
    if st is not None:
        matrix = st.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return st, np.array(matrix, dtype=np.float32)

    # Tier 2: LSA
    if len(texts) >= 3:
        n = min(100, len(texts) - 1)
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
        tfidf = vectorizer.fit_transform(texts)
        svd = TruncatedSVD(n_components=n, algorithm="randomized", random_state=42)
        norm = Normalizer(copy=False)

        # Build full sklearn pipeline so .transform() works later
        from sklearn.pipeline import make_pipeline
        lsa_pipe = make_pipeline(vectorizer, svd, norm)
        # The pipeline can't fit+transform in one step with pre-fitted vectorizer,
        # so we compose manually and store components
        matrix = norm.fit_transform(svd.fit_transform(tfidf))

        class _LSAEncoder:
            def __init__(self, vec, sv, nr):
                self.vec, self.sv, self.nr = vec, sv, nr

            def encode(self, txts, **_):
                return self.nr.transform(self.sv.transform(self.vec.transform(txts)))

            def transform(self, txts):
                return self.encode(txts)

        return _LSAEncoder(vectorizer, svd, norm), matrix.astype(np.float32)

    # Tier 3: plain TF-IDF cosine (original behaviour)
    vectorizer, matrix = build_tfidf(texts)

    class _TFIDFEncoder:
        def __init__(self, vec, mat):
            self.vec = vec

        def encode(self, txts, **_):
            return self.vec.transform(txts).toarray()

        def transform(self, txts):
            return self.encode(txts)

    return _TFIDFEncoder(vectorizer, matrix), matrix.toarray().astype(np.float32)
