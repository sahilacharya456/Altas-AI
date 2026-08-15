"""
Document Vision Analyzer — per-document-type structured data extractors.

Each function takes extracted OCR text and returns a structured dict
with actionable fields ready for one-tap confirmation in the AltasAI UI.
"""
import re
from typing import Any

from app.vision.screenshot_analyzer import analyze_screenshot

# ── Time pattern helpers ──────────────────────────────────────────────────────

_TIME_RE = re.compile(r"\b(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b", re.I)
_PRIORITY_RE = re.compile(r"\b(high|medium|low|critical|urgent)\b", re.I)


def extract_schedule(text: str) -> dict[str, Any]:
    """
    Extracts events/classes/meetings from schedule or timetable text.
    Returns list of {time, title, duration?} objects.
    """
    events: list[dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or len(line) < 4:
            continue
        time_match = _TIME_RE.search(line)
        time_str = time_match.group(0).strip() if time_match else None
        # Title = line with time removed
        title = _TIME_RE.sub("", line).strip(" -|:").strip()
        if title and len(title) >= 3:
            events.append({
                "time": time_str,
                "title": title[:120],
                "suggestedCategory": _infer_category(title),
            })
    return {"events": events[:20], "totalFound": len(events)}


def extract_task_list(text: str) -> dict[str, Any]:
    """
    Extracts tasks from a checklist, todo list, or bulleted task document.
    """
    tasks: list[dict[str, Any]] = []
    checkbox_re = re.compile(r"^[\s\-\*\•\[\]xX✓✗○●→]*", re.M)
    for line in text.splitlines():
        line = checkbox_re.sub("", line).strip()
        if not line or len(line) < 3:
            continue
        completed = bool(re.search(r"\[x\]|✓|✗|done|completed", line, re.I))
        priority_m = _PRIORITY_RE.search(line)
        priority = priority_m.group(0).lower() if priority_m else "medium"
        tasks.append({
            "title": line[:120],
            "completed": completed,
            "priority": priority,
            "suggestedCategory": _infer_category(line),
        })
    return {"tasks": tasks[:30], "totalFound": len(tasks),
            "completedCount": sum(1 for t in tasks if t["completed"])}


def extract_goal_plan(text: str) -> dict[str, Any]:
    """
    Extracts goals and milestones from a goal plan or roadmap document.
    """
    goals: list[dict[str, Any]] = []
    goal_indicators = re.compile(r"\b(goal|objective|target|achieve|complete|reach|milestone)\b", re.I)
    for line in text.splitlines():
        line = line.strip()
        if not line or len(line) < 5:
            continue
        if goal_indicators.search(line):
            goals.append({
                "title": line[:150],
                "hasMilestone": bool(re.search(r"\b(milestone|phase|step|by)\b", line, re.I)),
                "suggestedCategory": _infer_category(line),
            })
    return {"goals": goals[:15], "totalFound": len(goals)}


def extract_report_metrics(text: str) -> dict[str, Any]:
    """
    Extracts numeric metrics and percentages from a report or analytics document.
    """
    metrics: list[dict[str, Any]] = []
    # Match "label: 85%" or "label = 42" or "label: 1,200"
    metric_re = re.compile(
        r"([A-Za-z][A-Za-z\s]{2,30})\s*[:=]\s*([\d,]+(?:\.\d+)?)\s*(%)?",
        re.M,
    )
    for match in metric_re.finditer(text):
        label = match.group(1).strip()
        value_str = match.group(2).replace(",", "")
        is_pct = bool(match.group(3))
        try:
            value = float(value_str)
        except ValueError:
            continue
        metrics.append({"label": label[:60], "value": value, "isPercentage": is_pct})
    return {"metrics": metrics[:20], "totalFound": len(metrics)}


def _infer_category(text: str) -> str:
    """Simple heuristic to infer the AltasAI task category from text."""
    lower = text.lower()
    if any(w in lower for w in ["study", "lecture", "exam", "class", "course", "assignment"]):
        return "education"
    if any(w in lower for w in ["workout", "gym", "run", "walk", "exercise", "health", "sleep", "water"]):
        return "health"
    if any(w in lower for w in ["meeting", "work", "project", "task", "deadline", "sprint", "call"]):
        return "career"
    if any(w in lower for w in ["pay", "bill", "budget", "expense", "invoice", "money", "fee"]):
        return "finance"
    if any(w in lower for w in ["read", "book", "learn", "skill", "podcast", "course"]):
        return "personal_development"
    return "personal"


def analyze_document_image(payload: dict[str, Any]) -> dict[str, Any]:
    result = analyze_screenshot(payload)
    result["detectedDocumentType"] = "document" if result["extractedText"] else "unknown"
    return result
