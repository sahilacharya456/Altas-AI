from typing import Any


def analyze_chart(payload: dict[str, Any]) -> dict[str, Any]:
    text = str(payload.get("extractedText") or "")
    return {
        "chartDetected": any(word in text.lower() for word in ["chart", "graph", "axis", "trend"]),
        "extractedText": text,
        "confidence": 0.4 if text else 0.0,
        "limitations": ["Chart structure detection is text-based until OpenCV/chart parser is configured."],
    }
