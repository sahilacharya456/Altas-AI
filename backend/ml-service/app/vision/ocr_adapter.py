from typing import Any


def extract_text(payload: dict[str, Any]) -> dict[str, Any]:
    provided = payload.get("extractedText") or payload.get("ocrText")
    if provided:
        return {"extractedText": str(provided), "provider": "provided_ocr_text", "confidence": 0.85, "limitations": []}
    return {
        "extractedText": "",
        "provider": "not_configured",
        "confidence": 0.0,
        "limitations": ["Raw OCR provider is not configured. Install and wire an OCR backend before analyzing raw images."],
    }
