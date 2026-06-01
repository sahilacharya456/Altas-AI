from typing import Any

POSITIVE = ["completed", "finished", "progress", "focused", "consistent", "proud", "won"]
NEGATIVE = ["wasted", "failed", "stressed", "tired", "avoided", "confused", "distracted", "overwhelmed", "regret"]
BLOCKERS = ["scrolling", "phone", "too many tasks", "confused", "fear", "no plan", "avoid", "delaying"]
WINS = ["completed", "finished", "studied", "focused", "workout", "planned"]


def analyze_reflection(text: str) -> dict[str, Any]:
    lower = text.lower()
    positive = sum(1 for word in POSITIVE if word in lower)
    negative = sum(1 for word in NEGATIVE if word in lower)
    stress = sum(1 for word in ["stress", "stressed", "overwhelmed", "panic", "pressure", "burnout"] if word in lower)
    motivation = sum(1 for word in ["motivated", "ready", "will", "committed", "focused"] if word in lower)
    blockers = [word for word in BLOCKERS if word in lower]
    wins = [word for word in WINS if word in lower]
    themes = []
    if "scroll" in lower or "phone" in lower:
        themes.append("digital_distraction")
    if "task" in lower or "work" in lower:
        themes.append("execution")
    if stress:
        themes.append("stress")
    if "avoid" in lower or "wasted" in lower:
        themes.append("procrastination")
    if "too many" in lower or "overwhelmed" in lower:
        themes.append("overload")

    sentiment_score = max(-1.0, min(1.0, (positive - negative) / max(1, positive + negative)))
    return {
        "sentimentScore": round(sentiment_score, 4),
        "emotionLabels": list(dict.fromkeys(themes or ["neutral"])),
        "stressScore": min(100, stress * 30 + len(blockers) * 8),
        "motivationScore": max(0, min(100, 45 + motivation * 18 + positive * 8 - negative * 7)),
        "confidenceScore": max(0, min(100, 45 + len(wins) * 12 - len(blockers) * 8)),
        "burnoutRiskSignal": min(100, stress * 24 + lower.count("exhausted") * 35 + lower.count("burnout") * 45),
        "blockers": blockers,
        "wins": wins,
        "themes": list(dict.fromkeys(themes)),
        "recommendedIntervention": "reduce_workload" if stress >= 2 else "start_small_focus",
    }
