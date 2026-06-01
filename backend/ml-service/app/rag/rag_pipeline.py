from typing import Any

from app.rag.citation_builder import build_citations
from app.rag.reranker import rerank
from app.rag.retriever import retrieve
from app.rag.vector_store import VECTOR_STORE


def index_documents(documents: list[dict[str, Any]]) -> dict[str, Any]:
    return VECTOR_STORE.index(documents)


def query_rag(query: str, top_k: int = 3) -> dict[str, Any]:
    results = rerank(query, retrieve(query, top_k))
    return {
        "retrievedContext": [item["text"] for item in results],
        "sourceIds": [item.get("sourceId") for item in results],
        "relevanceScores": [item.get("relevanceScore") for item in results],
        "evidenceSummary": " ".join(str(item.get("text", ""))[:120] for item in results),
        "contextForMentor": "\n".join(str(item.get("text", "")) for item in results),
        "citations": build_citations(results),
    }
