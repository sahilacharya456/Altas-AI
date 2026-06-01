# AltasAI Backend API Contract

Base URL: `http://localhost:3001` (dev) | `https://api.altasai.app` (production, TBD)

All `/api/*` routes require `Authorization: Bearer <firebase_id_token>`.

---

## Health

### `GET /health`
No auth required.

**Response**:
```json
{
  "ok": true,
  "service": "altasai-backend",
  "firebasePlan": "spark-compatible",
  "aiProviderConfigured": true,
  "internalIntelligence": true,
  "architecture": "express-api-firebase-auth-firestore",
  "uptimeSeconds": 120,
  "memory": {},
  "mlService": { "ok": true, "status": 200 }
}
```

### `GET /health/ml`
No auth required. Returns `200` if ML service is available, `503` otherwise.

---

## AI Mentor

### `POST /api/mentor`
**Body**:
```json
{
  "message": "What should I do next?",
  "conversationId": "optional-existing-id",
  "contextType": "general"
}
```
**Response**:
```json
{
  "response": "Read: ...\nMove: ...\nWhy: ...",
  "conversationId": "id",
  "offline": false,
  "provider": "internal",
  "intent": { "label": "ask_next_action", "confidence": 0.89 },
  "recommendations": [{ "id": "...", "action": "...", "priority": "high" }]
}
```

---

## Daily Briefing

### `POST /api/daily-briefing`
**Body**: `{ "input": "optional context" }`  
**Response**:
```json
{
  "output": {
    "topPriority": "Finish FYP report",
    "executionRisk": 72,
    "riskLevel": "high",
    "reason": "3 carried tasks + low reflection streak",
    "suggestedAction": "Block 60 min for FYP now",
    "avoidToday": ["Adding new tasks before completing carried ones"]
  },
  "offline": false,
  "internalInsight": {},
  "orchestration": {}
}
```

---

## Weekly Report

### `POST /api/weekly-report`
**Body**: `{ "input": "optional context" }`  
**Response**:
```json
{
  "output": {
    "summary": "Completed 4/7 tasks...",
    "wins": ["..."],
    "risks": ["..."],
    "nextWeekActions": ["..."]
  },
  "offline": false
}
```

---

## Goal Breakdown

### `POST /api/goal-breakdown`
**Body**: `{ "goalId": "id", "goalTitle": "title", "goalDescription": "optional" }`  
**Response**: `{ "milestones": ["step1", "step2", ...], "offline": false }`

---

## Reflection Feedback

### `POST /api/reflection-feedback`
**Body**: `{ "date": "2026-06-01" }` (must match a Firestore `dailyLogs` document ID)  
**Response**: `{ "feedback": "...", "pattern": "...", "tomorrowAction": "...", "offline": false }`

---

## Budget Discipline

### `POST /api/budget-discipline`
**Body**: `{}`  
**Response**: `{ "success": true, "insights": [{ "type": "warning", "message": "...", "action": "..." }], "offline": false }`

---

## Interventions

### `POST /api/interventions`
**Body**: `{ "input": "optional context" }`  
**Response**: `{ "output": [{ "title": "...", "message": "...", "priority": "high", "action": "..." }], "offline": false }`

---

## Security Advice

### `POST /api/security-advice`
**Body**: `{ "input": "text to analyze" }`  
**Response**: `{ "output": { "title": "...", "message": "...", "priority": "medium", "action": "..." }, "offline": false }`

---

## Cortex

### `POST /api/cortex`
**Body**: `{ "input": "optional context" }`  
**Response**: `{ "output": { cortexInsight }, "userStateVector": {}, "models": {}, "offline": true, "provider": "internal" }`

---

## Recommendations Feedback

### `POST /api/recommendations/feedback`
**Body**:
```json
{
  "recommendationId": "start_focus_block",
  "source": "intervention",
  "action": "completed",
  "rating": 5,
  "context": { "screen": "interventions" }
}
```
**Response**: `{ "ok": true, "reward": 1, "mlRewardSynced": true }`

---

## Error Responses

All errors follow:
```json
{
  "error": {
    "message": "Human readable message",
    "code": "machine_readable_code",
    "requestId": "req-xxx"
  }
}
```

Common codes:
- `unauthenticated` — Missing or invalid Firebase token (401)
- `quota_exceeded` — Daily AI quota reached (429)
- `not_found` — Resource not found (404)
- `validation_error` — Invalid request body (400)
- `internal_error` — Unhandled server error (500)

---

## Dead Endpoints (Do Not Call)

The following endpoint structures were in old code and do not exist:
- `/api/v1/*` — No versioned prefix exists
- `/auth/register`, `/auth/login` — Auth is handled by Firebase SDK client-side
- `/career/*`, `/health/*` (v1 style) — These are Firestore-direct, no backend routes
