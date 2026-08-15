"""
Exploration strategies for the AltasAI contextual bandit.

UCB1 (Upper Confidence Bound) replaces epsilon-greedy.

epsilon-greedy problem: explores 10% of the time randomly, regardless of how well
  we know each action's value. Wastes interactions on actions we already understand.

UCB1 solution: exploration bonus = sqrt(2 * ln(total_trials) / trials_for_action).
  Under-explored actions get a large bonus, pulling them into the top choice.
  As we observe more, the bonus shrinks — exploration becomes targeted.

This is the standard algorithm used by Netflix, Google, and Microsoft for A/B testing
and recommendation bandits.
"""
import math
import random
from typing import Any


def ucb1(actions: list[str], scores: dict[str, float], reward_stats: dict[str, Any]) -> str:
    """
    Select action using UCB1 algorithm.

    Args:
        actions: All possible actions.
        scores: Current heuristic scores per action (used as prior).
        reward_stats: Per-action dict with {"count": int, "averageReward": float}.

    Returns:
        Selected action name.
    """
    total_trials = sum(int(reward_stats.get(a, {}).get("count", 0)) for a in actions)
    if total_trials == 0:
        # Cold start: pick the highest-scoring action from heuristics
        return max(actions, key=lambda a: scores.get(a, 0))

    ucb_values: dict[str, float] = {}
    for action in actions:
        stats = reward_stats.get(action, {})
        n_a = max(1, int(stats.get("count", 0)))
        avg_reward = float(stats.get("averageReward", 0))
        # Heuristic score normalized to [0, 1] as exploitation term
        heuristic = scores.get(action, 50) / 100.0
        exploitation = avg_reward if n_a > 1 else heuristic
        # UCB1 exploration bonus
        exploration_bonus = math.sqrt(2.0 * math.log(total_trials) / n_a)
        ucb_values[action] = exploitation + exploration_bonus

    return max(ucb_values, key=lambda a: ucb_values[a])


def epsilon_greedy(actions: list[str], scores: dict[str, float], epsilon: float = 0.10) -> str:
    """
    Legacy epsilon-greedy kept for backward compatibility.
    UCB1 is preferred — use ucb1() directly when reward stats are available.
    """
    if random.random() < epsilon:
        return random.choice(actions)
    return max(actions, key=lambda a: scores.get(a, 0))
