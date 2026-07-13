from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.rag.rag_pipeline import (
    index_documents,
    index_documents_for_user,
    query_rag,
    query_rag_for_user,
)

router = APIRouter(prefix="/rag")


class RagIndexRequest(BaseModel):
    documents: list[dict[str, Any]] = Field(default_factory=list)


class RagIndexUserRequest(BaseModel):
    userId: str
    documents: list[dict[str, Any]] = Field(default_factory=list)


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    topK: int = 3


class RagQueryUserRequest(BaseModel):
    userId: str
    query: str = Field(min_length=1)
    topK: int = 3


@router.post("/index")
def index(request: RagIndexRequest) -> dict:
    return index_documents(request.documents)


@router.post("/index/user")
def index_user(request: RagIndexUserRequest) -> dict:
    return index_documents_for_user(request.userId, request.documents)


@router.post("/query")
def query(request: RagQueryRequest) -> dict:
    return query_rag(request.query, request.topK)


@router.post("/query/user")
def query_user(request: RagQueryUserRequest) -> dict:
    return query_rag_for_user(request.userId, request.query, request.topK)
