import random


def epsilon_greedy(actions: list[str], scores: dict[str, float], epsilon: float = 0.08) -> str:
    if not actions:
        return "mentor_plan"
    if random.random() < epsilon:
        return random.choice(actions)
    return max(actions, key=lambda action: scores.get(action, 0.0))
