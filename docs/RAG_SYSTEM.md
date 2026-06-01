# AltasAI RAG System

The Python ML service includes a local development RAG stack:

- chunking: `app/rag/chunker.py`
- TF-IDF embeddings: `app/rag/embeddings.py`
- in-memory vector store: `app/rag/vector_store.py`
- retrieval/reranking: `app/rag/retriever.py`, `app/rag/reranker.py`
- citations: `app/rag/citation_builder.py`
- pipeline: `app/rag/rag_pipeline.py`

Endpoints:

```bash
POST /rag/index
POST /rag/query
```

This is private-context retrieval for user memory and AltasAI knowledge. It does not hardcode a paid vector database. Production can swap in Qdrant, Weaviate, Pinecone, Supabase Vector, or Firestore vector search behind the same interface.
