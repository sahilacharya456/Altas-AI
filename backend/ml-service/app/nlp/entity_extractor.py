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

# Required slots per intent + the clarification question to ask if missing
INTENT_SLOTS: dict[str, list[dict[str, str]]] = {
    "create_task": [
        {"slot": "taskTitle", "question": "What's the task? Give me a specific title."},
        {"slot": "deadline", "question": "When do you need this done — today, tomorrow, or a specific date?"},
    ],
    "log_expense": [
        {"slot": "amount", "question": "How much did you spend?"},
        {"slot": "deadline", "question": "When was this expense — today or another date?"},
    ],
    "set_goal": [
        {"slot": "goalName", "question": "What's the goal? Be specific about the outcome."},
    ],
    "start_focus": [
        {"slot": "duration", "question": "How long do you want to focus — 25 minutes, 45 minutes?"},
    ],
    "analyze_security": [
        {"slot": "securityConcern", "question": "What specifically are you concerned about — a link, a message, a login request?"},
    ],
    "log_health": [
        {"slot": "healthHabit", "question": "Which health habit are you logging — sleep, water, workout?"},
    ],
    "generate_report": [
        {"slot": "reportRange", "question": "Which report — daily, weekly, or monthly?"},
    ],
}


def fill_slots(intent_label: str, entities: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Given a predicted intent and extracted entities, identify missing required slots
    and return the first clarification question to ask.
    Returns empty dict if all slots are filled or intent has no slot requirements.
    """
    required_slots = INTENT_SLOTS.get(intent_label, [])
    if not required_slots:
        return {"allSlotsFilled": True, "missingSlots": [], "clarificationQuestion": None}

    filled_slot_types = {e["type"] for e in entities}
    missing = [s for s in required_slots if s["slot"] not in filled_slot_types]

    return {
        "allSlotsFilled": len(missing) == 0,
        "missingSlots": [s["slot"] for s in missing],
        "clarificationQuestion": missing[0]["question"] if missing else None,
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
    date_m = re.search(r"\b(today|tomorrow|next week)\b", text, re.I)
    if date_m:
        add("date", date_m.group(0).lower(), text, 0.72)

    missing_slots = []
    if any(e["type"] == "taskTitle" for e in entities) and not any(e["type"] in ["deadline", "date"] for e in entities):
        missing_slots.append("deadline")

    return {
        "entities": entities,
        "confidence": round(sum(e["confidence"] for e in entities) / max(1, len(entities)), 4),
        "missingFields": missing_slots,
        "clarificationNeeded": len(missing_slots) > 0,
        "slotFilling": fill_slots,  # callable — invoke with (intent_label, entities) at call site
    }

