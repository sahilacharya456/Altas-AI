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
        "create_task": [
            "add {task}",
            "remind me to {task}",
            "create a task to {task}",
            "schedule {task} for today",
            "new task: {task}",
        ],
        "update_task": [
            "update the deadline for {task}",
            "change priority of {task} to high",
            "reschedule {task} for tomorrow",
            "rename {task} to final version",
        ],
        "delete_task": [
            "delete the {task} reminder",
            "remove {task} from my tasks",
            "cancel the {task} task",
        ],
        "complete_task": [
            "mark {task} as done",
            "I finished {task}",
            "completed {task} today",
        ],
        "start_focus": [
            "start focus for {duration}",
            "begin deep work for {duration}",
            "lock in for {duration}",
            "start a {duration} focus sprint",
        ],
        "stop_focus": [
            "stop the focus timer",
            "end my focus session",
            "exit focus mode",
        ],
        "reflect_day": [
            "I wasted time because {blocker}",
            "log that I felt {mood} today",
            "reflect on today: struggled with {blocker}",
            "my day was affected by {blocker}",
        ],
        "ask_mentor": [
            "mentor me strictly",
            "give me honest feedback about {blocker}",
            "coach me on {task}",
        ],
        "ask_next_action": [
            "what should I do next",
            "tell me the next best action",
            "what is my highest leverage task now",
        ],
        "ask_motivation": [
            "motivate me to start {task}",
            "I need a push to {task}",
            "inspire me to stop {blocker}",
        ],
        "ask_planning_help": [
            "plan my day around {task}",
            "build a schedule for {duration}",
            "organize my {task} work",
        ],
        "analyze_goal": [
            "analyze my goal to {task}",
            "check progress on {task} goal",
            "is my {task} goal on track",
        ],
        "generate_report": [
            "show my weekly progress report",
            "generate productivity report for {duration}",
            "give me a summary of my tasks this week",
        ],
        "finance_check": [
            "I spent {amount} today",
            "check my budget risk",
            "analyze my expenses this week",
            "review my {amount} spending",
        ],
        "health_check": [
            "log {duration} workout today",
            "track my sleep and energy",
            "I skipped gym because {blocker}",
        ],
        "security_check": [
            "scan this suspicious link",
            "is this {task} phishing",
            "help me secure my account",
        ],
        "upload_document": [
            "upload this {task} pdf",
            "process my {task} document",
            "read this {task} file",
        ],
        "analyze_screenshot": [
            "analyze this screenshot of my {task}",
            "extract tasks from this {task} image",
        ],
        "retrieve_memory": [
            "retrieve my reflection memory",
            "what patterns did I have with {blocker}",
            "remember what I said about {task}",
        ],
    }
    tasks = ["finish report", "review thesis", "call supervisor", "update CV", "prepare slides"]
    durations = ["25 minutes", "50 minutes", "2 hours", "1 hour"]
    blockers = ["scrolling", "confusion", "anxiety", "too many tasks"]
    moods = ["stressed", "tired", "distracted", "burnt out"]
    amounts = ["500 rupees", "1200 pkr", "30 dollars", "2000 rupees"]
    rows: list[dict[str, str]] = []
    for label, patterns in templates.items():
        for pattern in patterns:
            for value in tasks + durations + blockers + moods + amounts:
                text = pattern.format(
                    task=value, duration=value, blocker=value, mood=value, amount=value
                )
                rows.append({"text": text, "label": label})
    rows.extend([
        {"text": "blue table sings quietly", "label": "unknown"},
        {"text": "random words with no product intent", "label": "unknown"},
        {"text": "what is the weather today", "label": "unknown"},
        {"text": "tell me a joke", "label": "unknown"},
    ])
    return rows



if __name__ == "__main__":
    write_json("synthetic_intent_samples.json", build_intents())
    print("Generated synthetic_intent_samples.json")
