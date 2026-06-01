import re
from typing import Any


PATTERNS = {
    "duration": re.compile(r"\b(\d{1,3})\s*(minutes?|mins?|hours?|hrs?)\b", re.I),
    "amount": re.compile(r"\b(?:rs\.?|pkr|usd|\$)?\s?(\d+(?:\.\d+)?)\s?(rupees|pkr|usd|dollars|\$)?\b", re.I),
    "time": re.compile(r"\b(?:at|by|before|after)\s+(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b", re.I),
    "deadline": re.compile(r"\b(today|tomorrow|next week|tonight|this week)\b", re.I),
    "priority": re.compile(r"\b(low|medium|high|critical)\s+priority\b|\b(priority\s+(low|medium|high|critical))\b", re.I),
    "documentType": re.compile(r"\b(pdf|document|docx|report|file)\b", re.I),
    "screenshotType": re.compile(r"\b(screenshot|timetable|schedule|screen)\b", re.I),
    "securityConcern": re.compile(r"\b(phishing|suspicious link|scam|password|otp|login link)\b", re.I),
    "healthHabit": re.compile(r"\b(sleep|water|workout|walk|exercise|diet)\b", re.I),
    "reportRange": re.compile(r"\b(daily|weekly|monthly|week|month)\s+(report|progress|summary)\b", re.I),
}


def extract_entities(text: str) -> dict[str, Any]:
    entities: list[dict[str, Any]] = []

    def add(entity_type: str, value: Any, raw: str, confidence: float) -> None:
        entities.append({"type": entity_type, "value": value, "raw": raw, "confidence": confidence})

    for entity_type, pattern in PATTERNS.items():
        match = pattern.search(text)
        if not match:
            continue
        raw = match.group(0)
        if entity_type == "duration":
            unit = match.group(2).lower()
            value = int(match.group(1)) * (60 if unit.startswith("hour") or unit.startswith("hr") else 1)
        elif entity_type == "amount":
            value = float(match.group(1))
            add("currency", (match.group(2) or "unknown").lower(), raw, 0.66)
        else:
            value = raw
        add(entity_type, value, raw, 0.75)

    task_match = re.search(r"\b(?:remind me to|add|create|schedule|finish|complete)\s+(.+?)(?:\s+(?:today|tomorrow|next week|at|by|with high|with medium|with low)|$)", text, re.I)
    if task_match:
        add("taskTitle", task_match.group(1).strip(), task_match.group(1).strip(), 0.74)

    goal_match = re.search(r"\bgoal\s+(?:to|for)?\s*(.+)$|\banalyze my goal\s+(?:to|for)?\s*(.+)$", text, re.I)
    if goal_match:
        add("goalName", (goal_match.group(1) or goal_match.group(2)).strip(), goal_match.group(0), 0.7)

    mood_match = re.search(r"\b(stressed|anxious|tired|motivated|confident|distracted|overwhelmed|low energy)\b", text, re.I)
    if mood_match:
        add("mood", mood_match.group(1).lower(), mood_match.group(0), 0.78)
    if re.search(r"\b(stress|stressed|overwhelmed|panic|pressure)\b", text, re.I):
        add("stressLevel", "elevated", text, 0.68)
    blocker_match = re.search(r"\b(scrolling|phone|confused|too many tasks|delaying|avoiding|blocked)\b", text, re.I)
    if blocker_match:
        add("blocker", blocker_match.group(0).lower(), blocker_match.group(0), 0.74)
    if re.search(r"\b(what should i do|help me|plan|recommend|next)\b", text, re.I):
        add("actionRequest", "next_action", text, 0.7)
    if re.search(r"\b(today|tomorrow|next week)\b", text, re.I):
        add("date", re.search(r"\b(today|tomorrow|next week)\b", text, re.I).group(0).lower(), text, 0.72)

    missing = []
    if any(e["type"] == "taskTitle" for e in entities) and not any(e["type"] in ["deadline", "date"] for e in entities):
        missing.append("deadline")

    return {
        "entities": entities,
        "confidence": round(sum(e["confidence"] for e in entities) / max(1, len(entities)), 4),
        "missingFields": missing,
        "clarificationNeeded": len(missing) > 0,
    }
