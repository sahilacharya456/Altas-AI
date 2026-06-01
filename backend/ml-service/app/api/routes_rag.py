from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.rag_pipeline import index_documents, query_rag

router = APIRouter(prefix="/rag")


class RagIndexRequest(BaseModel):
    documents: list[dict[str, Any]] = Field(default_factory=list)


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    topK: int = 3


@router.post("/index")
def index(request: RagIndexRequest) -> dict:
    return index_documents(request.documents)


@router.post("/query")
def query(request: RagQueryRequest) -> dict:
    return query_rag(request.query, request.topK)
