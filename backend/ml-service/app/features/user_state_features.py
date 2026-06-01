from typing import Any


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def build_user_state_vector(context: dict[str, Any]) -> dict[str, dict[str, Any]]:
    tasks = context.get("tasks", [])
    goals = context.get("goals", [])
    focus_sessions = context.get("focusSessions", [])
    reflections = context.get("reflections", [])

    total_tasks = len(tasks)
    completed = len([t for t in tasks if str(t.get("status")) == "completed"])
    open_tasks = len([t for t in tasks if str(t.get("status", "pending")) in ["pending", "in_progress", "carried"]])
    overdue = len([t for t in tasks if t.get("overdue") or t.get("isOverdue")])
    carried = len([t for t in tasks if t.get("isCarried") or int(t.get("carryCount", 0) or 0) > 0])
    focus_completed = len([s for s in focus_sessions if str(s.get("status", "completed")) == "completed"])
    avg_goal = sum(float(g.get("progress", 0) or 0) for g in goals) / max(1, len(goals))
    reflection_text = " ".join(str(r) for r in reflections).lower()
    stress_hits = sum(reflection_text.count(word) for word in ["stress", "stressed", "overwhelmed", "exhausted", "burnout"])
    distraction_hits = sum(reflection_text.count(word) for word in ["scroll", "distracted", "phone", "avoid", "wasted"])

    completion_rate = completed / max(1, total_tasks)
    overdue_ratio = overdue / max(1, open_tasks)
    focus_score = clamp(35 + focus_completed * 12)
    workload = clamp(open_tasks * 10 + overdue * 15 + carried * 12)
    stress = clamp(stress_hits * 22 + workload * 0.25)
    burnout = clamp(stress * 0.55 + workload * 0.35 + max(0, 30 - focus_score) * 0.4)
    execution = clamp(completion_rate * 70 + focus_score * 0.2 - overdue_ratio * 35 - carried * 5)

    def scored(value: float, confidence: float, evidence: list[str], reason: str) -> dict[str, Any]:
        return {
            "value": round(clamp(value), 2),
            "confidence": confidence,
            "evidence": evidence,
            "reason": reason,
        }

    return {
        "productivityScore": scored(execution, 0.74, [f"completed={completed}", f"totalTasks={total_tasks}"], "Task completion and focus adjusted by overdue work."),
        "focusScore": scored(focus_score, 0.68, [f"completedFocusSessions={focus_completed}"], "Recent completed focus sessions increase focus score."),
        "taskCompletionRate": scored(completion_rate * 100, 0.78, [f"completionRate={completion_rate:.2f}"], "Completed tasks divided by total tasks."),
        "overdueRatio": scored(overdue_ratio * 100, 0.8, [f"overdue={overdue}", f"openTasks={open_tasks}"], "Overdue tasks divided by open tasks."),
        "goalProgressScore": scored(avg_goal or 40, 0.63, [f"goals={len(goals)}"], "Average active goal progress."),
        "consistencyScore": scored(45 + completion_rate * 35 + focus_completed * 4 - carried * 8, 0.66, ["tasks", "focus", "carryDebt"], "Behavioral consistency from completion, focus, and carry debt."),
        "workloadScore": scored(workload, 0.72, [f"openTasks={open_tasks}", f"carried={carried}"], "Open, overdue, and carried work estimate load."),
        "reflectionMoodScore": scored(55 - stress_hits * 10 + completed * 4, 0.58, [f"stressHits={stress_hits}"], "Reflection language proxy for mood."),
        "stressSignalScore": scored(stress, 0.7, [f"stressHits={stress_hits}", f"workload={workload}"], "Stress words plus workload pressure."),
        "burnoutRiskScore": scored(burnout, 0.61, ["wellbeing-risk-not-diagnosis"], "Productivity/wellbeing risk signal only."),
        "deadlineRiskScore": scored(overdue_ratio * 80 + carried * 20 + workload * 0.35, 0.75, ["overdueRatio", "carryDebt", "workload"], "Deadline risk weighted score."),
        "executionReadinessScore": scored(execution + focus_score * 0.2 - burnout * 0.25, 0.67, ["execution", "focus", "burnoutRisk"], "Ability to execute now."),
        "planningNeedScore": scored(100 - execution + open_tasks * 3, 0.62, ["execution", "openTasks"], "Low execution and high load increase planning need."),
        "distractionRiskScore": scored(distraction_hits * 20 + carried * 8, 0.68, [f"distractionHits={distraction_hits}"], "Avoidance and distraction language."),
    }
