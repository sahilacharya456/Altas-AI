from typing import Any

from sklearn.metrics.pairwise import cosine_similarity

from app.rag.chunker import chunk_documents
from app.rag.embeddings import build_tfidf


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
            return {"indexed": 0}
        self.vectorizer, self.matrix = build_tfidf([chunk["text"] for chunk in self.chunks])
        return {"indexed": len(self.chunks)}

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


VECTOR_STORE = InMemoryVectorStore()
