from typing import Any

from app.vision.screenshot_analyzer import analyze_screenshot


def analyze_document_image(payload: dict[str, Any]) -> dict[str, Any]:
    result = analyze_screenshot(payload)
    result["detectedDocumentType"] = "document" if result["extractedText"] else "unknown"
    return result
