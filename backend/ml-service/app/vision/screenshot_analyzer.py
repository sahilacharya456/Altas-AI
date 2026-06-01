from typing import Any

from app.nlp.entity_extractor import extract_entities
from app.vision.ocr_adapter import extract_text


def analyze_screenshot(payload: dict[str, Any]) -> dict[str, Any]:
    ocr = extract_text(payload)
    text = ocr["extractedText"]
    entities = extract_entities(text)["entities"] if text else []
    screenshot_type = "schedule" if any(word in text.lower() for word in ["schedule", "timetable", "class", "meeting"]) else "unknown"
    return {
        "extractedText": text,
        "detectedDocumentType": screenshot_type,
        "detectedEntities": entities,
        "confidence": ocr["confidence"],
        "limitations": ocr["limitations"],
        "suggestedAction": "Create tasks from extracted schedule text." if text else "Configure OCR provider or pass extractedText.",
    }
