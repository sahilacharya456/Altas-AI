# AltasAI 🧠⚡

> **Your Personal Discipline, Focus & Life Operating System**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_+_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Free_|_Pro_|_Team-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)

AltasAI is a full-stack, AI-powered personal operating system. It is **not a to-do list**. It is a closed-loop behavioral execution engine that converts user signals — tasks, focus blocks, reflections, expenses, health, screen time, and security events — into real-time cognitive insights, proactive interventions, and strict persona-driven mentor coaching.

The internal intelligence layer runs fully offline with no external AI dependency. Google Gemini is used optionally, only for language polish on top of already-computed internal decisions.

---

## 📑 Table of Contents

- [The Execution Loop](#-the-execution-loop)
- [Project Architecture](#️-project-architecture)
- [Monorepo Structure](#-monorepo-structure)
- [Mobile App (`apps/mobile`)](#-mobile-app-appsmobile)
- [Backend API Gateway (`backend/api`)](#️-backend-api-gateway-backendapi)
- [ML Microservice (`backend/ml-service`)](#-ml-microservice-backendml-service)
- [Shared Library (`packages/shared`)](#️-shared-library-packagesshared)
- [Firestore Data Model](#-firestore-data-model)
- [Subscription Tiers](#-subscription-tiers)
- [Security Architecture](#-security-architecture)
- [Developer Setup](#-developer-setup)
- [Testing & Evaluation](#-testing--evaluation)
- [API Reference](#-api-reference)
- [Deployment](#️-deployment)
- [Design System](#-design-system)

---

## 🔄 The Execution Loop

AltasAI enforces one principle: **execution over planning**. Every component is designed to close this loop:

```
Signals → Cortex → Insight → Intervention → Execution → Proof → Report → Repeat
```

```
┌─────────────────────┐    ┌───────────────────────────┐    ┌─────────────────────┐
│   USER SIGNALS      │───▶│   ALTASAI CORTEX ENGINE   │───▶│  PROACTIVE OUTPUT   │
│                     │    │                           │    │                     │
│ • Daily tasks       │    │  Feature Builder          │    │ Ghost Task Alerts   │
│ • Focus sessions    │    │  ↓ 10D State Vector       │    │ Burnout Warnings    │
│ • Reflections       │    │  ↓ 20+ AI Models          │    │ Daily Briefings     │
│ • Expenses (Khata)  │    │  ↓ Pattern Analyzer       │    │ Focus Recommendations│
│ • Health & bio logs │    │  ↓ RL Bandit Ranker       │    │ Intervention Alerts │
│ • Screen time       │    │  ↓ RAG Memory             │    │ Execution DNA Card  │
│ • Security events   │    │  ↓ Ghost Task Detector    │    │ Weekly Audit Report │
└─────────────────────┘    └───────────────────────────┘    └─────────────────────┘
         ▲                                                             │
         └─────────────── Proof-of-Work Feedback ◄───────────────────┘
```

### 🎭 Triple-Tier Mentor Personas

The `ATLAS` AI mentor adapts its voice based on the user's `disciplineLevel` profile field:

| Persona | Description | Prompt Instruction |
|---|---|---|
| **Mentor** | Supportive but firm. Effort is acknowledged before redirection. | `"Encouragement is earned by evidence."` |
| **Strict** | Direct, uncompromising. Excuses are interrogated. | `"No-nonsense. Results are expected."` |
| **Ruthless** | Zero comfort. Every word drives action. | `"Name the failure, name the fix, demand execution."` |

---

## 🏗️ Project Architecture

AltasAI uses a **decoupled, offline-first, three-tier architecture**:

```
                         ┌─────────────────────────┐
                         │  📱 Expo Mobile App      │
                         │  React Native + NativeWind│
                         └──────────┬──────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │ Firebase Client SDK                           │ Bearer Token REST API
            │ (user-scoped Firestore CRUD)                  │ (verified server-side)
            ▼                                               ▼
┌──────────────────────┐              ┌──────────────────────────────────┐
│  🔥 Firebase Cloud   │              │  ⚙️ Express API Gateway (Node.js) │
│  • Authentication    │◄────────────▶│  • Firebase Token Verification   │
│  • Firestore DB      │              │  • App Check Enforcement         │
│  • Security Rules    │              │  • AltasAI Intelligence Engine   │
└──────────────────────┘              │  • Quota (Firestore + In-Memory) │
                                      │  • Stripe Subscription & Webhooks│
                                      │  • Prometheus Metrics Exporter   │
                                      └──────────────┬───────────────────┘
                                                     │
                          ┌──────────────────────────┴──────────────────────────┐
                          ▼                                                      ▼
         ┌──────────────────────────────┐              ┌──────────────────────────────┐
         │  🧠 Python ML Service        │              │  ✨ Google Gemini (Optional)  │
         │  FastAPI + Uvicorn           │              │  gemini-2.0-flash             │
         │  • TF-IDF Intent Classifier  │              │  Language polish only         │
         │  • ChromaDB Vector RAG       │              │  Internal plan always runs    │
         │  • UCB1 Contextual Bandit    │              │  first — Gemini is additive   │
         │  • OCR / Vision Adapters     │              └──────────────────────────────┘
         │  • MLflow-style Registry     │
         └──────────────────────────────┘
```

**Key principle**: The internal AltasAI rule engine runs first on every request. Gemini is called only for language enhancement after the decision is already made. If Gemini is unavailable, the system returns the internal plan unchanged.

---

## 📦 Monorepo Structure

```
ALTAS_AI/
├── apps/
│   └── mobile/                        # Expo SDK 54 / React Native 0.81
│       ├── app/
│       │   ├── (auth)/                # Login, Register, Onboarding, Welcome
│       │   └── (main)/                # 29 screens across all feature domains
│       ├── src/
│       │   ├── components/            # Atomic UI: cards, charts, forms, layout, feedback
│       │   ├── features/              # 18 domain-scoped feature modules
│       │   ├── hooks/                 # Custom React hooks + network status
│       │   ├── services/
│       │   │   ├── ai/                # Backend client, mentor, reports, interventions
│       │   │   ├── analytics/         # Product event telemetry (buffered locally)
│       │   │   ├── firebase/          # Auth, Firestore, config, persistence
│       │   │   ├── notifications/     # Push notification handlers
│       │   │   └── security/          # Client-side link safety checks
│       │   ├── stores/                # Zustand: auth, tasks, goals, toast, subscription
│       │   ├── theme/                 # Design tokens: colors, typography, spacing, motion
│       │   └── types/                 # Firestore document types (506-line type spec)
│       └── e2e/                       # Detox E2E tests
│
├── backend/
│   ├── api/                           # Node.js + Express + TypeScript
│   │   └── src/
│   │       ├── altasai/               # Core intelligence layer
│   │       │   ├── core/              # Types + full orchestrator pipeline
│   │       │   ├── nlp/               # Intent classifier, entity extractor, reflection analyzer
│   │       │   ├── models/            # 10+ production-ready model files
│   │       │   ├── feature-store/     # Feature builder + user state vector
│   │       │   ├── recommendation/    # Pattern-to-intervention rule engine
│   │       │   ├── pipelines/         # Mentor planner + report insight generator
│   │       │   ├── rules/             # Pattern analyzer + intervention rules JSON
│   │       │   ├── datasets/          # Intervention rules dataset
│   │       │   ├── evaluation/        # Accuracy, F1, confusion matrix benchmarks
│   │       │   ├── ml/                # Naive Bayes intent model trainer
│   │       │   ├── regex/             # Regex utility library
│   │       │   └── clients/           # ML service HTTP client with fallback
│   │       ├── config/                # Environment validation
│   │       ├── controllers/           # Route handler utilities
│   │       ├── middleware/            # Auth, AppCheck, rate limiter, logging, tracing
│   │       ├── routes/
│   │       │   ├── ai.routes.ts       # Root auth router, mounts all features
│   │       │   ├── proofFeed.routes.ts# Public read endpoint
│   │       │   ├── recommendations.routes.ts
│   │       │   └── features/          # mentor, reports, goals, cortex, proof, etc.
│   │       ├── services/              # gemini, memory, mentorAgent, ghostTask, executionDNA, etc.
│   │       └── utils/                 # Logger, structured logging
│   │
│   └── ml-service/                    # Python FastAPI microservice
│       └── app/
│           ├── api/                   # 7 route modules (health, predict, rag, recommend, train, vision, evaluate)
│           ├── classical_ml/          # Trainable scikit-learn classifiers
│           ├── core/                  # Model registry, trace context middleware
│           ├── datasets/              # Synthetic sample generator
│           ├── evaluation/            # Evaluation runner
│           ├── features/              # Feature extraction helpers
│           ├── models/                # Trained weights + JSON registry
│           ├── nlp/                   # Entity extractor, emotion model
│           ├── rag/                   # ChromaDB store, TF-IDF vector store, reranker, citations
│           ├── rl/                    # UCB1 bandit, epsilon-greedy, policy engine, reward tracker
│           ├── recommendation/        # Task ranking + bandit recommendation
│           ├── tests/                 # Pytest test suite
│           └── vision/                # OCR adapter, screenshot analyzer, receipt parser, document analyzer
│
├── packages/
│   └── shared/                        # @altasai/shared — Zod schemas + TypeScript types
│
├── docs/                              # 60+ project documentation files
├── scripts/
│   ├── load/                          # k6 load test scripts
│   └── seed-demo-data.js              # Firestore seed script
├── firestore.rules                    # Production security rules (379 lines)
├── firestore.indexes.json             # Composite index definitions
└── package.json                       # Root npm workspaces orchestration
```

---

## 📱 Mobile App (`apps/mobile`)

**Stack:** Expo 54 · React Native 0.81 · NativeWind v4 · Zustand · TanStack React Query · Expo Router · React Hook Form + Zod · Lottie · Reanimated 4

### 🎨 Design System

The app uses a cinematic, black-first UI with emerald intelligence accents:

| Token | Value | Purpose |
|---|---|---|
| `background.primary` | `#020403` | Deep black base |
| `accent.primary` | `#35E8B4` | Emerald intelligence highlight |
| `accent.bright` | `#A6FFE7` | Labels, active states |
| `discipline.primary` | `#D14A61` | Failure / carry-over red |
| `success.primary` | `#2DBE85` | Completed / verified green |

The theme exports 9 token files: `colors`, `typography`, `spacing`, `radius`, `shadows`, `gradients`, `layout`, `motion`, and `index`.

### 📲 Screen & Feature Directory

| Screen Route | Feature Module | Description |
|---|---|---|
| `/(auth)/welcome` | auth | Entry screen with onboarding CTA |
| `/(auth)/login` | auth | Email + password Firebase authentication |
| `/(auth)/register` | auth | Account creation with Zod-validated form |
| `/(auth)/onboarding` | auth | Persona setup: discipline level, focus areas, life rhythm |
| `/(auth)/forgot-password` | auth | Firebase password reset |
| `/(main)/index` | home | Daily dashboard: streak, briefing, top priority, quick actions |
| `/(main)/tasks` | tasks | Priority task board with carry-debt counter and status tracking |
| `/(main)/task-detail` | tasks | Full task view with proof submission and progress editing |
| `/(main)/goals` | goals | Goal hierarchy with AI milestone breakdown and progress velocity |
| `/(main)/focus` | execute | Pomodoro execution cockpit with timer and verification gate |
| `/(main)/mentor` | mentor | Multi-turn AI mentor chat with persona injection and action cards |
| `/(main)/cortex` | cortex | 10D user state vector visualization and risk map |
| `/(main)/reflection` | reflection | Evening review: wins, struggles, excuses, tomorrow's priority |
| `/(main)/reports` | reports | Report hub linking to daily and weekly generated insights |
| `/(main)/daily-report` | reports | AI daily briefing: top priority, execution risk, avoid-today list |
| `/(main)/weekly-report` | reports | Weekly execution audit: wins, risks, next-week actions |
| `/(main)/analytics` | analytics | Historical analytics snapshot charts |
| `/(main)/behavior-timeline` | analytics | Chronological behavior event timeline |
| `/(main)/interventions` | – | Real-time AI intervention alert feed |
| `/(main)/khata` | khata | Borrowed/lent debt overview |
| `/(main)/ledger` | finance | Full debt ledger: partial settlements, contacts, due dates |
| `/(main)/add-expense` | finance | Expense logger with category selection (6 categories) |
| `/(main)/expense-history` | finance | Paginated expense history with category filters |
| `/(main)/budget-insights` | finance | Monthly budget tracking with AI discipline tips |
| `/(main)/health` | health | Sleep, water, workout, energy, stress, routine score logger |
| `/(main)/digital` | digital | Screen time + distraction score logger |
| `/(main)/security` | security | Security event feed and behavior alerts |
| `/(main)/scan-link` | security | URL safety scanner (phishing / suspicious verdict) |
| `/(main)/device-safety` | security | Device risk report viewer |
| `/(main)/news` | news | Curated tech + cybersecurity news feed |
| `/(main)/profile` | profile | Account settings: discipline level, life rhythm, scores |
| `/(main)/subscription` | – | Tier status, Stripe checkout portal, quota meters |

### 🔌 Client Services

| Service | File | Role |
|---|---|---|
| AI Backend Client | `src/services/ai/backendClient.ts` | Authenticated HTTP client with Firebase token injection |
| Mentor AI | `src/services/ai/mentor.ts` | Chat, goal breakdown, reflection feedback, reward recording |
| Reports AI | `src/services/ai/reports.ts` | Daily briefing, weekly report, report-to-Firestore persistence |
| Interventions AI | `src/services/ai/interventions.ts` | Fetch proactive alert interventions |
| Proof AI | `src/services/ai/proof.ts` | Submit task completion proof for AI review |
| Recommendation Feedback | `src/services/ai/recommendationFeedback.ts` | Record RL bandit reward signals |
| Firestore | `src/services/firebase/firestore.ts` | Typed CRUD helpers for all collections |
| Product Events | `src/services/analytics/productEvents.ts` | Buffered local telemetry (17 event types) |

### 🗃️ Zustand Stores

| Store | File | State |
|---|---|---|
| Auth | `authStore.ts` | User, profile, isAuthenticated, onboarding, discipline level |
| Tasks | `tasksStore.ts` | Tasks CRUD, carry counts, ghost task flags |
| Goals | `goalsStore.ts` | Goals with AI milestone arrays |
| Subscription | `subscriptionStore.ts` | Tier, limits, expiry |
| Analytics | `analyticsStore.ts` | Historical snapshot data |
| Toast | `toastStore.ts` | Global notification queue |

---

## ⚙️ Backend API Gateway (`backend/api`)

**Stack:** Node.js 20 · Express 4 · TypeScript 5 · Firebase Admin 13 · `@google/genai` 2.6 · Stripe 22 · Zod · Helmet · `express-rate-limit`

### 🔐 Middleware Pipeline (in order)

```
Request
  → requestId (unique trace ID per request)
  → traceContext (x-trace-id propagation to ML service)
  → requestLogger (structured JSON logging)
  → helmet (security headers)
  → express.raw() (Stripe webhook only — before json())
  → express.json() (256KB limit)
  → CORS (allowlist-based, configurable per environment)
  → rate limiter (40 req/min global; 10/min on proof-review)
  → requireAppCheck (blocks unregistered clients)
  → requireAuth (verifies Firebase ID token; decodes uid server-side)
  → enforceUserQuota (Firestore transaction + in-memory fallback)
  → feature handler
```

### 🧠 AltasAI Intelligence Engine (`src/altasai/`)

This is the core of AltasAI — a **fully deterministic internal intelligence layer** that requires zero external AI to function:

#### Orchestration (`core/orchestrator.ts`)

The `runMentorOrchestration` function is the main entry point. It follows this pipeline on every mentor request:

1. **`buildFeatures(memory, now)`** — Computes 25+ features from the user's live Firestore memory (task counts, overdue ratios, focus minutes, goal progress, burn signals, finance/health/security risk scores, etc.)
2. **`buildUserStateVector(features)`** — Normalizes features into a 10-dimensional user state vector: `productivityScore`, `focusScore`, `consistencyScore`, `stressSignal`, `workloadScore`, `goalProgressScore`, `taskRiskScore`, `reflectionMoodScore`, `burnoutRiskScore`, `executionReadinessScore`
3. **`rankTasks(tasks, now)`** — Scores and re-ranks today's tasks by urgency, deadline proximity, carry count, and priority
4. **All 10 models in parallel**: `classifyProductivityState`, `predictDeadlineRisk`, `predictFocusPerformance`, `assessBurnoutRisk`, `predictGoalProgress`, `scoreHabitConsistency`, `analyzeFinancePatterns`, `analyzeHealthHabits`, `assessSecurityAwareness`, `detectAnomalies`
5. **`generateCortexInsight(vector, modelResults)`** — Combines state vector + all model outputs into one `CortexInsight`: top insight, top risk, top opportunity, best next action
6. **`runSafetyGuardrail(message)`** — Classifies the input message into one of 6 safety labels: `allowed`, `privacy_sensitive`, `medical_boundary`, `offensive_cybersecurity`, `crisis_language`, `unsupported_claim`
7. **`buildMentorPlan(context, orchestration)`** — Constructs the full `MentorResponsePlan` with intent, entities, patterns, recommendations, user state summary, and structured response instructions
8. **`generateGeminiText(prompt)`** (optional) — If `enhanceWithGemini: true` and API key is configured: calls `gemini-2.0-flash` with a 18s timeout, 3 retries with exponential backoff, and Zod-validated JSON output. If Gemini fails → returns internal plan unchanged.
9. **`sanitizeOutput(text)`** — Strips leaked system prompt markers (`[INST]`, `<<SYS>>`, role tags) from AI output before Firestore write.

#### ML Service Integration (`runAltasAIOrchestratorWithML`)

When `useML: true`, the orchestrator additionally:
- Calls `mlServiceClient.predictIntent(message)` — Python TF-IDF + Logistic Regression classifier
- Calls `mlServiceClient.predictEntities(message)` — Python entity extraction
- Calls `mlServiceClient.recommendAction(userId, memory)` — Python bandit-ranked recommendation
- If ML intent differs from internal classification AND has non-`unknown` label → uses ML result
- All ML calls are `Promise.allSettled` — ML failure never crashes the mentor response

#### Key Services

**`services/memory.ts` — `retrieveSafeMemory()`**
Fetches 11 Firestore collections in parallel (tasks today, active goals, 7-day reflections, focus sessions, expenses, health logs, digital usage, security events, cortex risk, behavior events, profile). Each fetch has an independent `.catch()` — partial failure degrades gracefully. Simultaneously runs:
- ML reflection analysis
- Ghost task detection
- RAG indexing + query (personal memory retrieval from ChromaDB)

**`services/ghostTask.ts` — `detectGhostTasks()`**
Queries tasks with `isCarried == true` AND `carryCount >= 3` AND `status != completed`. Computes the dominant avoidance category (`ghostDomain`), average carry count, and a formatted `contextForMentor` string injected into every AI prompt. Tasks carried 3+ times without completion are flagged as **behavioral avoidance signals**.

**`services/executionDNA.ts` — `buildExecutionDNA()`**
Analyzes 30 days of task completion history to compute a personalized **Execution DNA** profile:
- Completion rates per category (career, health, fitness, study, personal, routine)
- Peak execution day-of-week and hour-of-day
- Ghost domain (most avoided category)
- **Archetype label**: one of 7 archetypes matched by heuristic conditions:
  - `Morning Executioner` — peak hour < 12 AND avg rate ≥ 65%
  - `Night Architect` — peak hour ≥ 20
  - `Sprint Avoider` — avg rate < 45%
  - `Domain Champion` — strong domain ≠ ghost domain
  - `Consistent Executor` — avg rate ≥ 75%
  - `Deadline Rusher` — peak day Thu/Fri/Sat
  - `Early Week Builder` — peak day Mon/Tue
  - `Adaptive Executor` — no match

**`services/mentorAgent.ts` — `runSecureMentorAgent()`**
An agentic layer on top of the mentor orchestration. Detects automation intent via regex patterns (`explicitAutomationPattern`, `planRequestPattern`) and can automatically:
- `create_task` — creates a Firestore task from the message content, NLP-inferred category, priority, and estimated minutes
- `create_behavior_event` — records the automation signal for Cortex trend analysis
- `recommend_next_action` — surfaces recommendations as planned actions
- Max 3 auto-actions per request. Only `risk: 'low'` actions execute automatically.

**`services/gemini.ts`**
- `generateGeminiText()` — 3-attempt retry with exponential backoff (1s, 2s, 4s) on 429/503/rate-limit errors. 18s timeout. Default: `temperature: 0.45`, `maxOutputTokens: 600`, `responseMimeType: 'application/json'`
- `parseJsonWithSchema()` — Zod-validated JSON parsing with raw-string fallback
- `sanitizeOutput()` — Strips system token leakage patterns

**`services/quota.ts`**
Dual-layer quota enforcement:
1. **Firestore transaction** — atomic counter per `userId_bucket_date` key
2. **In-memory fallback** — `Map<string, {count, resetAt}>` if Firestore is unavailable
Throws `ApiError(429, 'quota_exceeded')` when limit exceeded.

**`services/githubProof.ts`**
Verifies task completion proofs submitted as GitHub commit URLs. Parses `github.com/{owner}/{repo}/commit/{sha}` with regex, calls GitHub public API (`/repos/{owner}/{repo}/commits/{sha}`) with a 4s timeout, and extracts `filesChanged`, `additions`, `deletions`, `author`, and `message`.

**`services/security.ts`**
- `sanitizePrompt()` — Blocks 8 known prompt-injection phrases; collapses repeated characters (e.g., 20×`A` → 5×`A`) to prevent context overflow attacks
- `sanitizeOutput()` — Strips system/user/assistant role tokens, `[INST]`/`[/INST]` markers, truncates to 4000 chars

### 📡 API Routes

All `/api/*` routes require `Authorization: Bearer <firebase_id_token>`.

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Service health, ML connectivity, Stripe status, memory |
| `GET` | `/health/ml` | ML service availability (`200` / `503`) |
| `GET` | `/metrics` | Prometheus metrics *(Admin only)* |
| `GET` | `/admin/stats` | HTML admin dashboard *(Admin only)* |
| `GET` | `/admin/business-metrics.json` | Product event telemetry *(Admin only)* |
| `POST` | `/stripe/webhook` | Idempotency-key-verified Stripe event handler |
| `GET` | `/api/proof-feed` | Public execution proof social feed |
| `POST` | `/api/mentor` | Multi-turn AI mentor chat with agent actions |
| `POST` | `/api/reports/daily-briefing` | Morning execution briefing |
| `POST` | `/api/reports/weekly-report` | Weekly audit |
| `POST` | `/api/goals/goal-breakdown` | AI milestone decomposition |
| `POST` | `/api/reflection/reflection-feedback` | Evening reflection AI feedback |
| `POST` | `/api/cortex` | 10D state vector + CortexInsight |
| `POST` | `/api/interventions` | Proactive risk intervention feed |
| `POST` | `/api/proof-review` | Proof-of-work verification (text, screenshot, GitHub link) |
| `POST` | `/api/budget` | Finance pattern analysis and alerts |
| `POST` | `/api/security` | Phishing and security threat analysis |
| `POST` | `/api/reward` | RL bandit reward signal recording |
| `POST` | `/api/subscription/checkout` | Stripe checkout session creation |
| `POST` | `/api/subscription/portal` | Stripe customer portal session |
| `GET` | `/api/recommendations` | Personalized recommendations from ML bandit |
| `POST` | `/api/recommendations/feedback` | Recommendation acceptance/dismissal reward |

---

## 🧠 ML Microservice (`backend/ml-service`)

**Stack:** Python 3.10+ · FastAPI 0.115 · Scikit-learn 1.4 · Pandas · NumPy · Joblib · ChromaDB 0.5 · Sentence-Transformers 3.0 · Pytest · Uvicorn

### 📋 Full Model Catalog

#### Classical ML (Trainable)

| Model | File | Algorithm | Purpose |
|---|---|---|---|
| **Intent Classifier** | `classical_ml/train_intent_classifier.py` | TF-IDF + Logistic Regression | Classifies 20 intent types from user messages |
| **Recommendation Ranker** | `classical_ml/train_recommendation_ranker.py` | Gradient Boosting / custom | Task priority ranking from feature vectors |
| **Risk Models** | `classical_ml/train_risk_models.py` | Weighted scoring | Deadline risk and burnout risk regression |
| **Safety Classifier** | `classical_ml/train_safety_classifier.py` | Rule-based + LR | Defensive intent vs offensive request classification |

Intent classes trained: `create_task`, `update_task`, `delete_task`, `complete_task`, `start_focus`, `stop_focus`, `reflect_day`, `ask_mentor`, `ask_next_action`, `ask_motivation`, `ask_planning_help`, `analyze_goal`, `generate_report`, `finance_check`, `health_check`, `security_check`, `upload_document`, `analyze_screenshot`, `retrieve_memory`, `unknown`

#### ML Model Registry (`core/model_registry.py`)

MLflow-style versioning with **staged A/B rollout**:
- `save_model_metadata(name, metadata)` — versioned JSON storage with accuracy, F1, precision, recall
- `save_challenger(name, metadata)` — registers a new challenger model
- `choose_model(name, challenger_traffic_pct=0.20)` — routes 20% of traffic to challenger if its F1 > champion's F1
- `promote_challenger(name)` — promotes challenger to champion
- `list_models()` — returns all registered model versions sorted by `updatedAt`

#### NLP Engine

| Module | File | Purpose |
|---|---|---|
| **Entity Extractor** | `nlp/entity_extractor.py` | Extracts dates, durations, priorities, currency, mood ratings, action verbs |
| **Reflection Emotion Model** | `nlp/` | Sentiment lexicon scoring: stress, motivation, confidence, blockers, wins, themes |

#### RAG Pipeline (`rag/`)

Per-user vector memory with hybrid retrieval:

| Component | File | Role |
|---|---|---|
| **Vector Store** | `vector_store.py` | TF-IDF-based fallback vector store (always available) |
| **ChromaDB Store** | `chroma_store.py` | Optional semantic vector store (env: `USE_CHROMA=true`) |
| **Embeddings** | `embeddings.py` | Sentence-Transformers `all-MiniLM-L6-v2` |
| **Hybrid Retriever** | `hybrid_retriever.py` | BM25 + vector similarity combined retrieval |
| **Reranker** | `reranker.py` | Cross-encoder reranking of retrieved candidates |
| **Chunker** | `chunker.py` | Document splitting for long-form context indexing |
| **Citation Builder** | `citation_builder.py` | Source attribution for retrieved memory |
| **RAG Pipeline** | `rag_pipeline.py` | Unified `index_documents_for_user` + `query_rag_for_user` API |

Memory flow: on every mentor request, the Express backend indexes the user's reflections, goals, and behavior events into their personal ChromaDB namespace, then queries it for `"execution patterns goals productivity blockers"` to retrieve relevant past context injected into the AI prompt.

#### RL Personalization Engine (`rl/`)

| Component | File | Algorithm | Detail |
|---|---|---|---|
| **UCB1 Bandit** | `exploration_strategy.py` | UCB1 (Upper Confidence Bound) | Exploration bonus = `√(2·ln(total_trials) / n_action)`. Preferred over epsilon-greedy — exploration is targeted, not random. |
| **Epsilon-Greedy** | `exploration_strategy.py` | ε-greedy | Legacy fallback (ε=0.10), kept for backward compatibility |
| **Policy Engine** | `policy_engine.py` | Multi-armed contextual bandit | Selects actions from heuristic + reward history |
| **Reward Tracker** | `reward_tracker.py` | JSON persistence | Tracks per-action `count` + `averageReward` across users |
| **Personalization Loop** | `personalization_loop.py` | Closed-loop feedback | Updates weights from user `completed`/`dismissed` events |

#### Vision & OCR Pipeline (`vision/`)

| Component | File | Purpose |
|---|---|---|
| **Screenshot Analyzer** | `screenshot_analyzer.py` | 5-type document classifier: `schedule`, `receipt`, `task_list`, `goal_plan`, `report` |
| **Document Vision Analyzer** | `document_vision_analyzer.py` | Extracts structured data from each document type |
| **Receipt Parser** | `receipt_parser.py` | Extracts merchant, total amount, date, category from receipts |
| **OCR Adapter** | `ocr_adapter.py` | Provider-agnostic OCR interface (Gemini Vision / fallback) |
| **Image Validator** | `image_validator.py` | Input validation before OCR pipeline |
| **Chart Analyzer** | `chart_analyzer.py` | Chart/graph data extraction |

Screenshot analysis pipeline:
1. OCR text extraction via `extract_text(payload)`
2. Document type classification by keyword signal counting (confidence scored)
3. Type-specific structured extractor
4. NER entity extraction on full OCR text
5. Suggested one-tap actions for AltasAI UI (e.g., `"Import 5 tasks to AltasAI"`)

#### Dataset Generator (`datasets/generate_synthetic_samples.py`)

Deterministic (not random) template-based dataset generator producing labeled intent training samples. Combines 20 intent templates × 5 variable slots (tasks, durations, blockers, moods, currency amounts) to produce ~3,000+ labeled examples for classifier training.

### ⚙️ ML Service Configuration (`app/config.py`)

```python
UNKNOWN_INTENT_THRESHOLD = 0.045   # Logistic Regression confidence floor
CHROMA_HOST = "localhost"           # ChromaDB host (env override: CHROMA_HOST)
CHROMA_PORT = 8000                  # ChromaDB port (env override: CHROMA_PORT)
USE_CHROMA = False                  # Enable semantic RAG (env: USE_CHROMA=true)
```

---

## 🗄️ Shared Library (`packages/shared`)

All data boundaries are enforced with **Zod schemas** at `@altasai/shared`:

| Schema | Purpose |
|---|---|
| `TaskSchema` | Task creation/update validation |
| `GoalSchema` | Goal validation |
| `ReflectionSchema` | Daily reflection log |
| `ExpenseSchema` | Expense entry |
| `KhataEntrySchema` | Borrow/lend ledger entry |
| `HealthLogSchema` | Health and bio-rhythm log |
| `DigitalUsageSchema` | Screen time entry |
| `SecurityEventSchema` | Phishing / behavior security event |
| `InterventionSchema` | AI-generated proactive intervention |
| `BudgetSchema` | Monthly budget entry |
| `ProfileSchema` | User profile and discipline settings |
| `MentorRequestSchema` | Mentor chat payload with context |
| `ProofReviewSchema` | Task completion proof submission |
| `GoalBreakdownSchema` | Goal milestone generation request |
| `ReflectionFeedbackSchema` | Evening feedback trigger |
| `SecurityAdviceSchema` | Security input analysis |
| `RewardSchema` | RL bandit reward recording |
| `SubscriptionCheckoutSchema` | Stripe checkout session creation |
| `SubscriptionPortalSchema` | Stripe portal session |
| `RecommendationFeedbackSchema` | Recommendation acceptance/dismissal |

---

## 🗄️ Firestore Data Model

Key subcollections under `users/{userId}/`:

| Collection | Document Type | Access |
|---|---|---|
| `profile/data` | `UserProfile` | Client + Server |
| `tasks/{taskId}` | `Task` | Client + Server |
| `goals/{goalId}` | `Goal` | Client + Server |
| `dailyLogs/{date}` | `DailyLog` (Reflection) | Client + Server |
| `expenses/{id}` | `Expense` | Client + Server |
| `khataEntries/{id}` | `KhataEntry` | Client + Server |
| `healthLogs/{id}` | `HealthLog` | Client + Server |
| `digitalUsage/{id}` | `DigitalUsage` | Client + Server |
| `securityEvents/{id}` | `SecurityEvent` | Client + Server |
| `focusSessions/{id}` | `FocusSession` | Client + Server |
| `behaviorEvents/{id}` | `BehaviorEvent` | Server only (written by API) |
| `conversations/{id}` | `Conversation` | Server only |
| `aiFeedback/{id}` | `AIFeedback` | Server only |
| `cortex/riskState` | `CortexRiskState` | Server only |
| `interventions/{id}` | `Intervention` | Server only |
| `subscription/data` | `UserSubscription` | Server only |

`serverQuotas/{userId_bucket_date}` — Top-level collection for atomic quota enforcement.

**`BehaviorEvent`** is the universal telemetry shape used by all domain modules (tasks, finance, health, digital, security, focus, mentor) to emit comparable signals into the Cortex analysis loop. Source types: `tasks | goals | reflection | finance | health | digital | security | focus | mentor | system`.

---

## 💎 Subscription Tiers

Three tiers managed via Stripe + Firebase Admin SDK:

| Feature | Free | Pro | Team |
|---|---|---|---|
| Daily mentor messages | 20 | 60 | 120 |
| Proof reviews/day | 5 | 50 | 100 |
| Active task limit | 5 | 200 | 500 |
| Active goal limit | 2 | 20 | 50 |
| RAG memory | ✗ | ✓ | ✓ |
| Conversation history | ✗ | ✓ | ✓ |
| GitHub proof verification | ✗ | ✓ | ✓ |
| Voice input | ✗ | ✓ | ✓ |
| Analytics | ✗ | ✓ | ✓ |
| Report generation | ✗ | ✓ | ✓ |

Subscription documents expire via `expiresAt` timestamp — no active cancellation logic needed. The subscription cache TTL is 5 minutes (in-memory `Map`).

---

## 🔒 Security Architecture

### API-Level

- **Firebase ID token verification** — Every `/api/*` request; uid extracted server-side, never trusted from client body
- **Firebase App Check** — Blocks unregistered clients and dev-tool requests in production
- **Prompt injection sanitization** — 8 known jailbreak phrases blocked; repeated character normalization
- **Output sanitization** — Strips `[INST]`, `<<SYS>>`, role prefixes from AI output before Firestore write; 4000-char hard cap
- **Project scope enforcement** — All mentor routes check `isProjectScopedInput(message)` — off-topic queries return a fixed refusal without touching the AI pipeline
- **Rate limiting** — 40 req/min global; 10 req/min on proof-review; 30 req/min on health check
- **Stripe webhook idempotency** — Requires `Idempotency-Key` header (≥16 chars) to prevent replay attacks

### Firestore Rules (`firestore.rules` — 379 lines)

- **Client ownership** — All reads/writes enforce `request.auth.uid == userId`
- **Server-only collections** — `conversations`, `aiFeedback`, `cortex`, `behaviorEvents`, `interventions` are `allow write: if false` for clients
- **Payload validation at DB level** — Enum whitelisting, string length limits, array size caps, document size < 100KB enforced in rules functions (`validateTask`, `validateGoal`, `validateLog`, etc.)

### ML Service

- `x-trace-id` propagated via `TraceContextMiddleware` from Express → FastAPI for distributed tracing
- Safety classifier runs on every mentor input
- Safety labels: `allowed`, `privacy_sensitive`, `medical_boundary`, `offensive_cybersecurity`, `crisis_language`, `unsupported_claim`
- Allowed response types: `normal`, `bounded_guidance`, `supportive_redirect`, `refusal`

---

## 🚀 Developer Setup

### Prerequisites

| Tool | Version | Required For |
|---|---|---|
| Node.js | ≥ 20.0.0 | All JS/TS workspaces |
| Python | ≥ 3.10 | ML service |
| Firebase CLI | Latest | Emulators, deployment |
| Java JDK | ≥ 21 | Firestore emulator (rules testing only) |

### 1. Install

```bash
git clone https://github.com/sahilacharya456/Altas-AI.git
cd Altas-AI
npm install
```

### 2. Configure Environment

**`apps/mobile/.env`** (copy from `.env.example`):
```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**`backend/api/.env`** (copy from `.env.example`):
```env
PORT=3001
NODE_ENV=development
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
GEMINI_API_KEY=          # Optional — system works fully without it
GEMINI_MODEL=gemini-2.0-flash-001
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ML_SERVICE_URL=http://localhost:8001
ALLOWED_ORIGINS=http://localhost:8081
AI_DAILY_QUOTA=40
ADMIN_API_KEY=
```

### 3. Run Services

```bash
# Mobile app (Expo Metro Bundler)
npm run mobile

# Backend API (Port 3001, tsx watch mode)
npm run api

# ML service (Port 8001)
cd backend/ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Seed Firestore emulator with demo data
npm run emulator:seed

# Train the intent classifier (Python)
npm run ml:train
```

---

## 🧪 Testing & Evaluation

| Command | Scope | What it runs |
|---|---|---|
| `npm run lint` | Monorepo | ESLint across mobile and backend workspaces |
| `npm run typecheck` | Monorepo | `tsc --noEmit` on all TypeScript packages |
| `npm run test` | Monorepo | Jest unit + integration tests |
| `npm run evaluate:altasai` | Backend | Full AI evaluation: accuracy, precision, recall, F1, confusion matrix, top-k ranking, safety accuracy, report completeness |
| `npm run ml:train` | ML service | Trains TF-IDF + Logistic Regression intent classifier |
| `npm run ml:evaluate` | ML service | Python evaluation runner |
| `npm run ml:test` | ML service | Pytest test suite |
| `npm run load:backend` | API | k6 load test (multi-user concurrent traffic) |
| `npm run load:ml` | ML service | k6 ML endpoint latency and throughput test |
| `npm run emulator:seed` | Firestore | Seeds users, tasks, reflections, goals, khata entries |

---

## 🎨 Design System

The mobile design system is defined entirely in `src/theme/`:

- **Colors** (`colors.ts`): Cinematic black-first palette (`#020403` base) with emerald intelligence accents (`#35E8B4`). Includes `background`, `surface`, `accent`, `intelligence`, `glass`, `discipline`, `success`, `warning`, `error`, `info`, `text`, `border`, `primary`, `opacity` token groups.
- **Typography** (`typography.ts`): System and custom font scale with `size`, `weight`, and `leading` tokens
- **Spacing** (`spacing.ts`): `xs/sm/md/lg/xl/2xl` spacing scale
- **Radius** (`radius.ts`): Border radius tokens
- **Shadows** (`shadows.ts`): Layered shadow definitions
- **Gradients** (`gradients.ts`): `LinearGradient` preset configurations
- **Motion** (`motion.ts`): Reanimated animation spring and timing presets
- **Layout** (`layout.ts`): Screen-level layout constants

Component library: `cards/` (CommandCard, InsightCard, StatCard), `charts/` (MetricBarChart), `common/` (GradientButton, SectionHeader), `feedback/` (RiskBadge, LoadingState, OfflineBanner), `layout/` (AppHeader, ScreenContainer), `forms/`, `ui/`.

---

## ☁️ Deployment

| Service | Configuration | Platform |
|---|---|---|
| Mobile app | `eas.json` (development, preview, production profiles) | Expo Application Services (EAS) |
| Backend API | `Dockerfile` (multi-stage), `railway.json` | Railway |
| Firebase | `firebase.json`, `firestore.rules`, `firestore.indexes.json` | Google Firebase |
| ML service | `uvicorn app.main:app` | Railway / any Python host |
| CI | `.github/` | GitHub Actions |

---

## 📊 Current Status & Known Limitations

- Internal intelligence models are **deterministic/statistical baselines**, not deep production neural networks
- Evaluation datasets are small — need real anonymized user data to improve classifiers
- Firestore emulator rules tests require Java 21+ (may not work on all local machines)
- PDF export in `ReportDetailView` is a **placeholder** (`exportStatus: 'placeholder'`) — not implemented
- ChromaDB is **optional** — the system defaults to TF-IDF if `USE_CHROMA=false`
- Product event telemetry is buffered locally — not yet sent to authenticated backend
- RAG top-1 ranking accuracy still needs improvement with larger real datasets
- E2E Detox tests configured but require Android emulator setup to run

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>Plan → Focus → Execute → Prove → Reflect → Improve</b><br/>
  <sub>AltasAI — Built for relentless execution and personal discipline.</sub>
</p>
