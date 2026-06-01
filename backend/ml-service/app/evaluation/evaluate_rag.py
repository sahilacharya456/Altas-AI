import json

from app.config import DATASET_DIR
from app.evaluation.metrics import pass_result
from app.rag.rag_pipeline import index_documents, query_rag


def evaluate() -> dict:
    docs = json.loads((DATASET_DIR / "rag_samples.json").read_text(encoding="utf-8"))
    index_documents(docs)
    hits = 0
    for doc in docs:
        result = query_rag(doc["expectedQuery"], 3)
        if doc["id"] in result["sourceIds"]:
            hits += 1
    recall = hits / max(1, len(docs))
    return pass_result("rag_retrieval", recall, 0.75, {"recallAt3": recall})
