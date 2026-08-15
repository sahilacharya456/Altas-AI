"""
Screenshot Intelligence Pipeline

Classifies images into 5 document types and extracts structured data:
  schedule    → list of tasks/events with times
  receipt     → merchant, amount, date, category
  task_list   → list of tasks with priority hints
  goal_plan   → goals with milestones
  report      → summary metrics and key figures

Each type has a structured extractor that returns actionable fields
ready for one-tap confirmation in the AltasAI UI.
"""
import re
from typing import Any

from app.nlp.entity_extractor import extract_entities
from app.vision.ocr_adapter import extract_text
from app.vision.document_vision_analyzer import (
    extract_schedule,
    extract_task_list,
    extract_goal_plan,
    extract_report_metrics,
)
from app.vision.receipt_parser import parse_receipt


# ── Document type classifier ──────────────────────────────────────────────────

_TYPE_SIGNALS: list[tuple[str, list[str]]] = [
    ("receipt",   ["total", "subtotal", "tax", "receipt", "invoice", "paid", "amount due", "merchant", "bill"]),
    ("schedule",  ["schedule", "timetable", "class", "meeting", "lecture", "session", "slot", "period", "am", "pm"]),
    ("task_list", ["todo", "to-do", "task", "checklist", "[ ]", "[ x]", "pending", "done", "backlog"]),
    ("goal_plan", ["goal", "milestone", "objective", "target", "kpi", "vision", "quarterly", "roadmap"]),
    ("report",    ["report", "summary", "progress", "completed", "percentage", "score", "metric", "kpi", "analytics"]),
]


def _classify_document_type(text: str) -> tuple[str, float]:
    """Returns (doc_type, confidence) based on keyword signal counting."""
    lower = text.lower()
    type_scores: dict[str, int] = {}
    for doc_type, signals in _TYPE_SIGNALS:
        type_scores[doc_type] = sum(1 for s in signals if s in lower)

    best_type = max(type_scores, key=lambda t: type_scores[t])
    best_score = type_scores[best_type]
    total_signals = sum(type_scores.values())

    if best_score == 0:
        return "unknown", 0.0

    confidence = min(0.95, best_score / max(3, total_signals))
    return best_type, round(confidence, 3)


def analyze_screenshot(payload: dict[str, Any]) -> dict[str, Any]:
    # Step 1: Extract text via OCR or Gemini Vision
    ocr = extract_text(payload)
    text = ocr["extractedText"]

    if not text:
        return {
            "extractedText": "",
            "detectedDocumentType": "unknown",
            "confidence": 0.0,
            "detectedEntities": [],
            "structuredData": {},
            "suggestedActions": [],
            "limitations": ocr["limitations"],
        }

    # Step 2: Classify document type
    doc_type, confidence = _classify_document_type(text)

    # Step 3: Extract structured data based on type
    structured: dict[str, Any] = {}
    suggested_actions: list[str] = []

    if doc_type == "schedule":
        structured = extract_schedule(text)
        n = len(structured.get("events", []))
        suggested_actions = [f"Create {n} tasks from this schedule" if n > 0 else "No events detected — check image quality"]

    elif doc_type == "receipt":
        structured = parse_receipt(text)
        amt = structured.get("totalAmount")
        merchant = structured.get("merchant", "Unknown")
        suggested_actions = [f"Log Rs.{amt} expense at {merchant}" if amt else "Log expense — amount unclear"]

    elif doc_type == "task_list":
        structured = extract_task_list(text)
        n = len(structured.get("tasks", []))
        suggested_actions = [f"Import {n} tasks to AltasAI" if n > 0 else "No tasks detected"]

    elif doc_type == "goal_plan":
        structured = extract_goal_plan(text)
        n = len(structured.get("goals", []))
        suggested_actions = [f"Import {n} goals to Goals module" if n > 0 else "No goals detected"]

    elif doc_type == "report":
        structured = extract_report_metrics(text)
        suggested_actions = ["Review extracted metrics and compare with AltasAI analytics"]

    else:
        entities = extract_entities(text)["entities"] if text else []
        suggested_actions = ["Image processed — no recognized document type"]
        structured = {"rawEntities": entities}

    # Step 4: Always extract named entities from text
    entity_result = extract_entities(text)

    return {
        "extractedText": text,
        "detectedDocumentType": doc_type,
        "confidence": confidence,
        "ocrProvider": ocr["provider"],
        "detectedEntities": entity_result["entities"],
        "structuredData": structured,
        "suggestedActions": suggested_actions,
        "limitations": ocr["limitations"],
    }

