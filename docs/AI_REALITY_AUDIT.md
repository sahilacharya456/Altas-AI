# AltasAI AI/ML Reality Audit

**Date**: 2026-06-01

This document classifies every AI/ML component by production-readiness.

**Classification:**
- **A**: Real and production-usable
- **B**: Useful but needs more data/tuning
- **C**: Scaffold with real structure, not production data
- **D**: Stub or placeholder — must be gated

---

## Backend TypeScript Intelligence (Grade: A)

These are deterministic rule-based + lightweight ML components that run on the Express backend. They do not require Gemini or the Python ML service.

| Component | Grade | Notes |
|---|---|---|
| Intent classifier (NLP) | A | 20+ labeled intents, Naive Bayes, local model |
| Entity extractor | A | Regex + rule-based, covers tasks/dates/money/priority |
| Reflection analyzer | A | Sentiment, blocker detection, theme classification |
| Productivity pattern analyzer | A | 10+ rule patterns with severity and reason |
| Feature builder | A | Builds user state vector from real Firestore data |
| User state vector | A | 8-dimension score vector |
| Productivity state classifier | A | 5-state classifier with explainability |
| Task priority ranker | A | Carry debt + deadline + priority weighting |
| Deadline risk regression | A | Regression model over task features |
| Focus performance predictor | A | Predicts session readiness |
| Burnout risk model | A | Multi-signal pattern detection |
| Goal progress predictor | A | Progress extrapolation |
| Habit consistency scorer | A | Pattern scoring with weak-point detection |
| Finance pattern model | A | Spending pattern classification |
| Health habit pattern model | A | Health signal classification |
| Security awareness model | A | Defensive/offensive request classification |
| Anomaly detection | A | Multi-signal anomaly detection |
| Cortex insight engine | A | Synthesizes model results into insight |
| Safety guardrail model | A | Blocks offensive requests, enables fallback |
| Mentor planner | A | Deterministic plan from patterns + recommendations |
| Recommendation engine | A | Pattern-based intervention recommendations |
| Report insight generator | A | Non-static report from real user data |

**Evaluation coverage**: All 21 components have automated tests in `altasai-intelligence.test.ts`. Model evaluation runner confirms passing scores.

---

## Gemini Integration (Grade: A with caveat)

| Component | Grade | Notes |
|---|---|---|
| Gemini wording enhancement | A | Optional only. Full fallback if unavailable. |
| JSON schema validation | A | Zod-validated output, fallback on parse failure |
| Timeout handling | A | 18-second timeout, offline fallback |
| Cost control | A | Daily per-user quota via Firestore transaction |

**Limitation**: Gemini is used only as a wording enhancer. If the API key is missing or the call fails, the internal plan is returned directly. AltasAI's value is NOT dependent on Gemini working.

---

## Python ML Service (Grade: B/C)

| Component | Grade | Notes |
|---|---|---|
| Intent classifier (TF-IDF + LR) | B | Real training pipeline, small dataset |
| Entity extractor | B | NLP pipeline, needs more examples |
| Recommendation ranker | B | Trained classifier, synthetic data |
| Safety classifier | B | Rule + ML hybrid |
| RAG pipeline | C | TF-IDF vector store, no embeddings — functional but shallow |
| RL contextual bandit | C | Correct structure, no real reward signal from prod |
| Vision/OCR adapter | C | Adapter pattern exists, no real OCR model |
| CV/document analyzer | C | Stub adapter |

**Status**: Python ML service is optional and gracefully falls back. Do NOT promote ML service features (RAG, RL, Vision) to end users until they have real production data and verified accuracy.

**Action required**: Gate vision and CV routes behind `FEATURE_FLAGS` or remove from the production service until ready.

---

## What AltasAI Honestly Claims

**Real**: Deterministic intelligence pipeline that produces specific next actions from user behavior data. Works 100% offline if Gemini and ML service are unavailable.

**In progress**: Python ML service with trained classifiers and RAG. Functional, but accuracy depends on data volume.

**Planned**: RL personalization, production vision features, cross-user insight aggregation.

**Not AI**: The Firestore data layer, analytics tracking, focus timer, and Khata module are pure data features.

---

## Hallucination & Cost Risk

| Risk | Status |
|---|---|
| Gemini hallucinating user data | LOW — Gemini only improves wording, does not see raw data. The internal plan is authoritative. |
| Gemini inventing recommendations | LOW — Output is schema-validated; fallback activates if schema fails. |
| Gemini cost runaway | LOW — Daily per-user quota enforced server-side. |
| ML service producing wrong classification | LOW IMPACT — Falls back to TS rules engine silently. |
| Offensive request bypassing safety | LOW — Safety guardrail runs on every message server-side. |
