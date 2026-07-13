from app.rag.rag_pipeline import index_documents, query_rag
from app.rag.vector_store import get_store_backend


def test_rag_indexes_and_retrieves_relevant_context():
    index_documents([{"id": "focus", "text": "Twenty five minute focus sessions work best for this user."}])
    result = query_rag("what focus duration works", 3)
    assert "focus" in result["sourceIds"]
    assert result["retrievedContext"]


def test_rag_backend_info_returns_valid_backend():
    backend = get_store_backend()
    assert backend in ("chroma", "tfidf"), f"Unknown backend: {backend}"


def test_rag_query_returns_has_results_field():
    index_documents([{"id": "goal-1", "text": "Portfolio launch blocked by missing E2E tests."}])
    result = query_rag("what blocks portfolio launch", 3)
    assert "hasResults" in result
    assert isinstance(result["hasResults"], bool)
