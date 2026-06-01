def reward_from_event(event_type: str) -> float:
    return {
        "accepted_recommendation": 1.0,
        "task_completed": 1.2,
        "focus_completed": 1.0,
        "reflection_submitted": 0.8,
        "goal_progress_improved": 1.3,
        "dismissed_recommendation": -0.4,
        "ignored_recommendation": -0.2,
    }.get(event_type, 0.0)
