from typing import Any


def validate_image_payload(payload: dict[str, Any]) -> dict[str, Any]:
    has_text = bool(payload.get("extractedText") or payload.get("ocrText"))
    has_image = bool(payload.get("imageBase64") or payload.get("imageUrl"))
    return {"hasText": has_text, "hasImage": has_image, "valid": has_text or has_image}
