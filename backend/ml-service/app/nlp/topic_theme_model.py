from app.features.text_preprocessing import tokenize


def extract_themes(text: str) -> list[str]:
    tokens = set(tokenize(text))
    themes = []
    if {"scrolling", "phone", "distracted"} & tokens:
        themes.append("digital_distraction")
    if {"deadline", "late", "overdue"} & tokens:
        themes.append("deadline_pressure")
    if {"goal", "progress", "milestone"} & tokens:
        themes.append("goal_progress")
    return themes or ["general_productivity"]
