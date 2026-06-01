from typing import Any


def chunk_documents(documents: list[dict[str, Any]], chunk_size: int = 700) -> list[dict[str, Any]]:
    chunks = []
    for document in documents:
        text = str(document.get("text", ""))
        for index in range(0, len(text), chunk_size):
            chunk = text[index:index + chunk_size]
            if chunk.strip():
                chunks.append({
                    "id": f"{document.get('id', 'doc')}-{index // chunk_size}",
                    "sourceId": document.get("id"),
                    "text": chunk,
                    "metadata": document.get("metadata", {}),
                })
    return chunks
