# AltasAI Model Catalog

AltasAI uses internal deterministic and statistical baseline models before any external AI wording enhancement. Gemini is optional and must not be the decision maker.

## Shared Output Standard

Core models return `label`, `score`, `confidence`, `reasons`, `evidence`, `recommendation`, and `nextAction`.

## Models

1. Intent Classification: `backend/api/src/altasai/nlp/intentClassifier.ts`
   Regex rules, keyword scoring, and local sample overlap.

2. Entity Extraction / NER: `backend/api/src/altasai/nlp/entityExtractor.ts`
   Regex/date/time/priority/money/mood/security/health/action extraction.

3. Reflection Sentiment and Emotion: `backend/api/src/altasai/nlp/reflectionAnalyzer.ts`
   Sentiment lexicon, blockers, wins, themes, stress, motivation, confidence.

4. Productivity State Classifier: `backend/api/src/altasai/models/productivityStateClassifier.ts`
   Workload, procrastination, burnout, productivity, and readiness scoring.

5. Task Priority Ranking: `backend/api/src/altasai/models/taskPriorityRanking.ts`
   Urgency, deadline distance, priority, carry debt, and effort.

6. Deadline Risk Regression: `backend/api/src/altasai/models/deadlineRiskRegression.ts`
   Explainable regression-style score from overdue ratio, carry debt, critical workload, procrastination, and consistency.

7. Focus Performance Prediction: `backend/api/src/altasai/models/focusPerformancePrediction.ts`
   Time of day, focus consistency, execution score, burnout, and procrastination.

8. Burnout / Overload Risk: `backend/api/src/altasai/models/burnoutRiskModel.ts`
   Stress, workload, and health habit score. This is not a medical diagnosis.

9. Goal Progress Prediction: `backend/api/src/altasai/models/goalProgressPrediction.ts`
   Goal progress, execution score, focus consistency, and delay signals.

10. Habit Consistency: `backend/api/src/altasai/models/habitConsistencyModel.ts`
    Task completion, focus completion, reflection frequency, and carry debt.

11. Personal Intervention Recommendation: `backend/api/src/altasai/recommendation/recommendationEngine.ts`
    Pattern rules plus risk/focus/burnout model triggers.

12. Mentor Response Planner: `backend/api/src/altasai/pipelines/mentorPlanner.ts`
    Intent, entities, patterns, recommendations, state vector, Cortex insight, and safety.

13. Report Insight Generator: `backend/api/src/altasai/pipelines/reportInsightGenerator.ts`
    Real task, goal, reflection, focus, and user-state signals.

14. Finance Pattern Model: `backend/api/src/altasai/models/financePatternModel.ts`
    User-entered expenses only. No bank integration.

15. Health Habit Pattern Model: `backend/api/src/altasai/models/healthHabitPatternModel.ts`
    User-entered routine and energy logs only. No diagnosis.

16. Security Awareness Model: `backend/api/src/altasai/models/securityAwarenessModel.ts`
    Defensive security intent detection and offensive request blocking.

17. Anomaly Detection: `backend/api/src/altasai/models/anomalyDetectionModel.ts`
    Threshold and moving-baseline style checks for productivity drop, overdue spike, focus decline, stress, and inactivity.

18. User State Vector: `backend/api/src/altasai/feature-store/featureBuilder.ts`
    Unified productivity, focus, consistency, stress, workload, goal, task risk, mood, burnout, and readiness vector.

19. Cortex Insight Engine: `backend/api/src/altasai/models/cortexInsightEngine.ts`
    Combines user state vector and model outputs into top insight, risk, opportunity, and next action.

20. AI Safety and Guardrail: `backend/api/src/altasai/models/safetyGuardrailModel.ts`
    Harmful request, medical boundary, offensive cybersecurity, privacy-sensitive input, and crisis-like language handling.

## Current Limitations

- These are deterministic/statistical baselines plus a small local Naive Bayes intent classifier, not deep production ML models.
- No persisted feature-store collection exists yet; features are computed at request time.
- Evaluation datasets are small and must expand with anonymized real examples.
- Recommendation top-3 passes the harness, but top-1 ranking still needs improvement.
- Firestore emulator rules tests exist, but local execution requires Java 21+.

## Evaluation

Run:

```bash
npm run evaluate:altasai --workspace=@altasai/backend
```

Metrics include accuracy, precision, recall, F1, confusion matrix, entity coverage, recommendation top-k, risk bucket accuracy, safety accuracy, and report completeness. Passing this harness catches regressions; it is not proof of broad production intelligence.

## Python Service Models

Additional Python models live in `backend/ml-service/app`:

- trainable intent classifier: TF-IDF + Logistic Regression
- entity extractor: regex/rule hybrid
- reflection emotion model: lexicon and theme scoring
- risk models: weighted scoring with buckets
- recommendation engine: task ranking plus contextual bandit
- RAG: TF-IDF vector store, retriever, reranker, citations
- safety classifier: defensive rule classifier
- CV adapter: OCR-provider interface with honest not-configured fallback
