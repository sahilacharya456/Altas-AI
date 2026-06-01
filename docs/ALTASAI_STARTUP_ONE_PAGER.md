# AltasAI Startup One-Pager

## Positioning

AltasAI is a personal execution intelligence system that converts life signals into specific next actions.

## Problem

Ambitious users collect tasks, goals, notes, habits, and reflections across many tools, but they still struggle to decide what to do next and why they keep losing execution momentum.

## Solution

AltasAI combines tasks, focus sessions, reflections, goals, and behavior signals into a daily intelligence loop:

```text
Signals -> Cortex -> Insight -> Intervention -> Execution -> Report
```

The product gives the user a concrete next action, tracks whether it helped, and improves recommendations over time.

## Core Loop

1. Morning: AltasAI analyzes context and generates a prioritized execution plan.
2. During the day: Focus mode and mentor interventions guide execution.
3. Evening: Reflection captures blockers, wins, mood, and energy.
4. Weekly: Reports expose patterns, risks, and next actions.
5. Continuous: Recommendation feedback improves future interventions.

## Target User

Ambitious 20-35 year olds who feel overloaded by goals, tasks, and daily decisions but want a serious system for discipline, execution, and self-improvement.

## Differentiation

AltasAI is not only a generic AI chat layer. Internal models run first:

- intent classification
- entity extraction
- productivity state scoring
- deadline risk scoring
- focus readiness prediction
- burnout/overload risk signals
- recommendation ranking
- user state vector
- cortex insight engine
- report insight generation
- safety guardrails

Gemini is optional wording enhancement. AltasAI still works through internal models when external AI is unavailable.

## Business Model

Freemium:

- free: tasks, focus, reflection, basic mentor, basic reports
- Pro: advanced Cortex insights, weekly/monthly reports, personalized recommendation learning, deeper pattern detection
- target Pro price: $9.99/month after product-market validation

## Current Status

AltasAI is a serious portfolio-grade MVP foundation:

- Expo mobile app
- Firebase Auth and Firestore rules
- Express backend
- Python ML service
- internal AI model catalog
- model evaluation harness
- CI
- mobile smoke tests
- backend tests
- recommendation feedback foundation
- load-test scripts
- production readiness docs

## Current Gaps

AltasAI still needs:

- real device E2E tests
- Java 21 Firestore emulator verification
- App Check enforcement
- Sentry/crash reporting credentials
- real production deployment
- larger anonymized datasets
- load-test results from deployed infrastructure
- frontend cleanup for remaining oversized screens

## Ask

Seeking technical review, product feedback, beta users, and mentorship around launch readiness, retention metrics, and narrowing the first market wedge.
