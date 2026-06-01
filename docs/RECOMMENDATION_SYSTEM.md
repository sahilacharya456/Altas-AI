# AltasAI Recommendation System

The recommendation system combines:

- task ranking
- user state vector
- risk scores
- contextual bandit action scores
- reward feedback

Implemented files:

- `backend/ml-service/app/recommendation/task_ranker.py`
- `backend/ml-service/app/recommendation/intervention_ranker.py`
- `backend/ml-service/app/recommendation/next_best_action.py`
- `backend/ml-service/app/rl/policy_engine.py`
- `backend/ml-service/app/rl/reward_tracker.py`

Endpoints:

```bash
POST /recommend/action
POST /recommend/reward
GET /recommend/rewards/{user_id}
GET /recommend/export/{user_id}
```

This is not fake reinforcement learning. It is honest contextual-bandit-style personalization with reward tracking.

## Backend Feedback Loop

AltasAI recommendations are no longer one-way suggestions only. The TypeScript backend records user feedback and converts it into reward signals for personalization.

Backend API:

```text
POST /api/recommendations/feedback
GET /api/recommendations/stats/:userId
GET /api/recommendations/export/:userId
```

Feedback is stored under:

```text
users/{uid}/recommendationFeedback
users/{uid}/recommendationStats/{recommendationId}
```

Direct client writes are denied in Firestore rules. The mobile app submits feedback through the authenticated backend. The backend also forwards reward signals to the Python ML service reward tracker.

Supported feedback actions:

- `shown`
- `accepted`
- `dismissed`
- `completed`
- `helpful`
- `not_helpful`

The export endpoint produces `altasai_recommendation_feedback_v1` rows for future retraining.
