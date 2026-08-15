"""
VADER-style sentiment analysis with negation handling, intensifier amplification,
and punctuation boosting. Replaces naive keyword counting that misread
"not motivated" as positive.

Negation window: a negator within 3 tokens of a sentiment word flips its polarity.
Intensifiers: "very", "extremely", "totally" amplify the following sentiment word by 1.5×.
"""
import re
from typing import Any

# Valence lexicon: word → score in [-1, 1]
_VALENCE: dict[str, float] = {
    # Positive
    "completed": 0.7, "finished": 0.65, "progress": 0.55, "focused": 0.6,
    "consistent": 0.65, "proud": 0.7, "won": 0.75, "achieved": 0.75,
    "motivated": 0.7, "ready": 0.55, "committed": 0.65, "disciplined": 0.7,
    "workout": 0.5, "studied": 0.55, "planned": 0.5, "executed": 0.7,
    "momentum": 0.6, "productive": 0.65, "crushed": 0.75, "nailed": 0.75,
    # Negative
    "wasted": -0.65, "failed": -0.7, "stressed": -0.65, "tired": -0.5,
    "avoided": -0.6, "confused": -0.5, "distracted": -0.55, "overwhelmed": -0.7,
    "regret": -0.65, "exhausted": -0.75, "burnout": -0.8, "panic": -0.7,
    "lazy": -0.55, "procrastinated": -0.7, "scrolling": -0.45, "delaying": -0.55,
    "missed": -0.6, "skipped": -0.5, "gave up": -0.75, "failed": -0.7,
}

_NEGATORS = {"not", "no", "never", "don't", "didn't", "can't", "couldn't",
             "won't", "wouldn't", "isn't", "wasn't", "hardly", "barely", "neither"}

_INTENSIFIERS = {"very": 1.5, "extremely": 1.8, "totally": 1.4, "absolutely": 1.6,
                 "completely": 1.5, "really": 1.3, "so": 1.2, "deeply": 1.4}

_BLOCKERS = ["scrolling", "phone", "too many tasks", "confused", "fear",
             "no plan", "avoid", "delaying", "procrastinating"]
_WINS = ["completed", "finished", "studied", "focused", "workout", "planned",
         "achieved", "executed", "committed", "consistent"]


def _score_text(text: str) -> tuple[float, list[str], list[str]]:
    """Returns (compound_score, detected_blockers, detected_wins)."""
    tokens = re.findall(r"[a-z']+", text.lower())
    scores: list[float] = []
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token not in _VALENCE:
            i += 1
            continue

        base_score = _VALENCE[token]
        # Look back up to 3 tokens for negation
        window = tokens[max(0, i - 3):i]
        negated = any(n in window for n in _NEGATORS)
        # Look back 1 token for intensifier
        amplifier = 1.0
        if i > 0 and tokens[i - 1] in _INTENSIFIERS:
            amplifier = _INTENSIFIERS[tokens[i - 1]]

        final = base_score * amplifier * (-1.0 if negated else 1.0)
        scores.append(final)
        i += 1

    # Punctuation boost: each "!" adds 0.05, all-caps words add 0.1
    exclaim_boost = min(0.3, text.count("!") * 0.05)
    caps_boost = min(0.2, sum(0.1 for w in text.split() if w.isupper() and len(w) > 2))

    if not scores:
        raw = 0.0
    else:
        raw = sum(scores) / (1 + abs(sum(scores))) * 100  # normalize to [-100, 100] range

    compound = max(-100.0, min(100.0, raw + exclaim_boost * 10 + caps_boost * 10))

    text_lower = text.lower()
    blockers = [b for b in _BLOCKERS if b in text_lower]
    wins = [w for w in _WINS if w in text_lower]
    return compound, blockers, wins


def analyze_reflection(text: str) -> dict[str, Any]:
    compound, blockers, wins = _score_text(text)
    lower = text.lower()

    # Stress signals (separate from sentiment — stress can coexist with motivation)
    stress_terms = ["stress", "stressed", "overwhelmed", "panic", "pressure", "burnout", "exhausted"]
    stress_count = sum(1 for t in stress_terms if t in lower)
    # Apply negation to stress too
    stress_negated = any(n + " " + t in lower for n in ["not", "no", "never"] for t in stress_terms)
    stress_score = min(100, stress_count * 28 + len(blockers) * 8) if not stress_negated else 0

    # Motivation: based on positive compound + explicit motivation words
    motivation_terms = ["motivated", "ready", "committed", "focused", "will", "going to"]
    motivation_raw = sum(1 for t in motivation_terms if t in lower)
    motivation_score = max(0, min(100, 45 + (compound * 0.4) + motivation_raw * 12))

    # Confidence: wins minus blockers, bounded
    confidence_score = max(0, min(100, 50 + len(wins) * 12 - len(blockers) * 10))

    # Burnout: heavy negative compound + high stress
    burnout_signal = min(100, max(0, -compound * 0.6 + stress_score * 0.5
                                   + lower.count("exhausted") * 30
                                   + lower.count("burnout") * 40))

    # Theme detection
    themes: list[str] = []
    if "scroll" in lower or "phone" in lower:
        themes.append("digital_distraction")
    if "task" in lower or "work" in lower or "project" in lower:
        themes.append("execution")
    if stress_count > 0:
        themes.append("stress")
    if "avoid" in lower or "procrastinat" in lower or "wasted" in lower:
        themes.append("procrastination")
    if "too many" in lower or "overwhelmed" in lower:
        themes.append("overload")
    if compound > 40:
        themes.append("positive_momentum")
    if compound < -40:
        themes.append("low_energy")

    return {
        "sentimentScore": round(compound / 100, 4),   # back to [-1, 1] for API consistency
        "sentimentCompound": round(compound, 2),        # raw [-100, 100] for display
        "emotionLabels": list(dict.fromkeys(themes or ["neutral"])),
        "stressScore": round(stress_score, 1),
        "motivationScore": round(motivation_score, 1),
        "confidenceScore": round(confidence_score, 1),
        "burnoutRiskSignal": round(burnout_signal, 1),
        "blockers": blockers,
        "wins": wins,
        "themes": list(dict.fromkeys(themes)),
        "negationAware": True,
        "model": "vader_style_valence_v2",
        "recommendedIntervention": (
            "reduce_workload" if burnout_signal > 60
            else "seek_support" if stress_score > 70
            else "start_small_focus" if compound < -20
            else "maintain_momentum"
        ),
    }

