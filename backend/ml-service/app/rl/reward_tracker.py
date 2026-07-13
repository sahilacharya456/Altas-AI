"""
Reward tracker — dual-backend storage.

Primary: Firestore (production, multi-instance safe)
Fallback: local JSON file (dev / Firestore unavailable)

Firestore path: altasai_rl_rewards/{userId}/actions/{action}
  Fields: count, totalReward, averageReward, updatedAt
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.config import REWARD_STORE_PATH

logger = logging.getLogger(__name__)

# ── Firestore client (optional) ───────────────────────────────────────────────
_firestore_client = None


def _get_firestore():
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client
    try:
        import firebase_admin
        from firebase_admin import firestore as fs
        if not firebase_admin._apps:
            return None
        _firestore_client = fs.client()
        return _firestore_client
    except Exception:
        return None


def _load_from_firestore(user_id: str) -> dict[str, Any]:
    db = _get_firestore()
    if db is None:
        return {}
    try:
        docs = db.collection("altasai_rl_rewards").document(user_id).collection("actions").stream()
        return {doc.id: doc.to_dict() for doc in docs}
    except Exception as exc:
        logger.warning("reward_tracker.firestore_load_failed user=%s error=%s", user_id, exc)
        return {}


def _save_to_firestore(user_id: str, action: str, item: dict[str, Any]) -> None:
    db = _get_firestore()
    if db is None:
        return
    try:
        db.collection("altasai_rl_rewards").document(user_id).collection("actions").document(action).set(
            {**item, "updatedAt": datetime.now(timezone.utc)},
            merge=True,
        )
    except Exception as exc:
        logger.warning("reward_tracker.firestore_save_failed user=%s action=%s error=%s", user_id, action, exc)


# ── JSON fallback ops ─────────────────────────────────────────────────────────

def _load_json() -> dict[str, Any]:
    if not REWARD_STORE_PATH.exists():
        return {}
    try:
        return json.loads(REWARD_STORE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_json(data: dict[str, Any]) -> None:
    try:
        REWARD_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        REWARD_STORE_PATH.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
    except Exception as exc:
        logger.warning("reward_tracker.json_save_failed error=%s", exc)


# ── Public API ────────────────────────────────────────────────────────────────

def load_rewards(user_id: str | None = None) -> dict[str, Any]:
    """Load rewards. With user_id: Firestore-first then JSON fallback. Without: JSON only."""
    if user_id:
        fs_data = _load_from_firestore(user_id)
        if fs_data:
            return fs_data
        all_data = _load_json()
        return all_data.get(user_id, {})
    return _load_json()


def save_rewards(rewards: dict[str, Any]) -> None:
    """Bulk-save (JSON only — used by legacy callers and export)."""
    _save_json(rewards)


def record_reward(user_id: str, action: str, reward: float) -> dict[str, Any]:
    """Record a reward signal. Writes to Firestore (primary) + JSON (fallback)."""
    existing = load_rewards(user_id)
    item: dict[str, Any] = existing.get(action, {"count": 0, "totalReward": 0.0})

    item["count"] = int(item.get("count", 0)) + 1
    item["totalReward"] = float(item.get("totalReward", 0.0)) + float(reward)
    item["averageReward"] = item["totalReward"] / max(1, item["count"])

    _save_to_firestore(user_id, action, item)

    # Maintain JSON as fallback
    all_data = _load_json()
    all_data.setdefault(user_id, {})[action] = item
    _save_json(all_data)

    return item
