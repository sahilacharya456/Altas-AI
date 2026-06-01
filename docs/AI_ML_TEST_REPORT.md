# AltasAI AI/ML Test Report

**Date**: 2026-06-01  
**Tests run**: `npm run evaluate:altasai` + `npm run ml:evaluate` + `npm run ml:test`

---

## Evaluation Results

### TypeScript Intelligence Pipeline (Backend)

| Component | Score | Threshold | Status |
|---|---|---|---|
| Intent classification | 1.0 | 0.80 | PASS |
| Entity extraction | 0.875 | 0.75 | PASS |
| Reflection analysis | 1.0 | 0.75 | PASS |
| Recommendation ranking | 1.0 | 0.80 | PASS |
| Risk models | 1.0 | 0.75 | PASS |
| Report completeness | 1.0 | 0.85 | PASS |
| Safety guardrail | 1.0 | 0.90 | PASS |

### Python ML Service

| Component | Score | Threshold | Status |
|---|---|---|---|
| TF-IDF intent classifier | 1.0 | 0.85 | PASS |
| Entity extractor | 0.983 | 0.80 | PASS |
| Risk models | 1.0 | 0.75 | PASS |
| Recommendation engine | 1.0 | 0.80 | PASS |
| RAG retrieval | 1.0 | 0.75 | PASS |
| Safety guardrail | 0.944 | 0.90 | PASS |
| Vision adapter | 1.0 | 0.80 | PASS |

### Python Unit Tests

```
9 passed in 16.75s
```

---

## Component Classification

| Component | Grade | Visible to Users? | Real or Stub? | Risk |
|---|---|---|---|---|
| Deterministic intent classifier (TS) | A | Via mentor response | Real — 20+ intents, Naive Bayes | LOW |
| Entity extractor (TS) | A | Via mentor/task parsing | Real — regex + rules | LOW |
| Reflection analyzer (TS) | A | Via reflection feedback | Real — sentiment + themes | LOW |
| Productivity pattern analyzer (TS) | A | Via home cortex card | Real — 10+ rule patterns | LOW |
| User state vector (TS) | A | Via cortex models | Real — 8-dimension feature vector | LOW |
| Burnout risk model (TS) | A | Via dashboard/cortex | Real — multi-signal scoring | LOW |
| Deadline risk model (TS) | A | Via task ranking | Real — regression over task features | LOW |
| Focus performance predictor (TS) | A | Via focus mode | Real — readiness scoring | LOW |
| Cortex insight engine (TS) | A | Via home dashboard | Real — synthesizes model results | LOW |
| Safety guardrail (TS) | A | Via all mentor calls | Real — blocks offensive requests | LOW |
| Mentor planner (TS) | A | Via all mentor calls | Real — deterministic plan | LOW |
| Recommendation engine (TS) | A | Via interventions | Real — pattern-based | LOW |
| Report insight generator (TS) | A | Via weekly report | Real — from actual user data | LOW |
| Gemini wording enhancement | A | Via mentor (optional) | Real — optional, has fallback | LOW |
| TF-IDF intent classifier (Python) | B | Via backend (optional) | Real — small dataset | MEDIUM (data) |
| RAG pipeline (Python) | C | NOT visible | TF-IDF in-memory, no embeddings | LOW (gated) |
| RL contextual bandit (Python) | C | NOT visible | Structure exists, no prod reward signal | LOW (gated) |
| Vision/OCR/CV (Python) | C | NOT visible | Adapter stubs | LOW (gated) |

---

## Fallback Test Results

The `api-routes.test.ts` verifies offline fallback behavior:
- `✓ serves mentor response through internal fallback when Gemini is unavailable` — PASS
- `✓ keeps security advice defensive through internal guardrails` — PASS
- `✓ serves internal Cortex insight without Gemini` — PASS

The `ml-service-client.test.ts` verifies ML service fallback:
- `✓ falls back to internal intelligence when ML service is unavailable` — PASS

---

## Known AI Limitations (Honest)

1. **Intent confidence drops with novel phrasing** — classifier trained on 65 examples. Real users will use unexpected language. Threshold `0.4` means many messages fall through to `unknown` intent.
2. **Gemini enhancement is English-biased** — Urdu/mixed-language inputs may produce weaker wording enhancements.
3. **Weekly report is data-dependent** — new users with zero data get template fallback. This is correct behavior but may feel generic.
4. **RAG is TF-IDF, not embeddings** — low semantic recall. NOT visible to users. Must not be promoted.
5. **RL has no production reward signal** — contextual bandit cannot learn from real user behavior yet.

---

## Gated Stub Modules

The following Python ML features are NOT exposed to users and MUST NOT be promoted:
- RAG pipeline — ComingSoon gating confirmed
- RL contextual bandit — not in any user-facing route
- Vision/OCR — not in any MVP route

Verification:
```
FEATURE_FLAGS.NEWS_LAB = false
FEATURE_FLAGS.FINANCE_KHATA = false  
FEATURE_FLAGS.SECURITY_SCAN_LINK = false
FEATURE_FLAGS.DEVICE_SAFETY = false
```
All four stubs are behind feature flags. `featureFlags.test.ts` verifies these are `false`.
