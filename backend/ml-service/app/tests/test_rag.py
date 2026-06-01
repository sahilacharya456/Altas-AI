from app.rag.rag_pipeline import index_documents, query_rag


def test_rag_indexes_and_retrieves_relevant_context():
    index_documents([{"id": "focus", "text": "Twenty five minute focus sessions work best for this user."}])
    result = query_rag("what focus duration works", 3)
    assert "focus" in result["sourceIds"]
    assert result["retrievedContext"]
