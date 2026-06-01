"""Generate deterministic AltasAI seed datasets.

This is intentionally template-based, not random noise. It expands the local
baseline with realistic productivity, security, finance, health, and mentor
phrasing while keeping labels inspectable.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def write_json(name: str, rows: list[dict]) -> None:
    (ROOT / name).write_text(json.dumps(rows, indent=2), encoding="utf-8")


def build_intents() -> list[dict[str, str]]:
    templates = {
        "create_task": ["add {task}", "remind me to {task}", "create a task to {task}"],
        "start_focus": ["start focus for {duration}", "begin deep work for {duration}", "put me in focus mode"],
        "reflect_day": ["I wasted time because {blocker}", "log that I felt {mood}", "reflect on today's {blocker}"],
        "ask_next_action": ["what should I do next", "give me the next best action", "choose my next move"],
        "finance_check": ["I spent {amount} today", "check my budget risk", "analyze my expenses"],
        "security_check": ["scan this suspicious link", "is this phishing", "help secure my password"],
    }
    tasks = ["finish report", "review thesis", "call supervisor"]
    durations = ["25 minutes", "50 minutes", "2 hours"]
    blockers = ["scrolling", "confusion", "too many tasks"]
    moods = ["stressed", "tired", "distracted"]
    amounts = ["500 rupees", "1200 pkr", "30 dollars"]
    rows: list[dict[str, str]] = []
    for label, patterns in templates.items():
        for pattern in patterns:
            for value in tasks + durations + blockers + moods + amounts:
                text = pattern.format(task=value, duration=value, blocker=value, mood=value, amount=value)
                rows.append({"text": text, "label": label})
    rows.extend([
        {"text": "blue table sings quietly", "label": "unknown"},
        {"text": "random words with no product intent", "label": "unknown"},
    ])
    return rows


if __name__ == "__main__":
    write_json("synthetic_intent_samples.json", build_intents())
    print("Generated synthetic_intent_samples.json")
