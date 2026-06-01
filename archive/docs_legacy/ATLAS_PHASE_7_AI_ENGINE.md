# Atlas AI Phase 7 AI Engine Report

Date: 2026-05-28

## Phase Goal

Build Atlas AI's server-side AI orchestration layer without training a custom LLM and without adding any mobile client-side model calls.

The new engine centralizes:

- Model routing.
- Prompt construction.
- Safety filtering.
- Memory retrieval.
- Agent orchestration.
- Structured response validation.
- Offline fallback behavior.

All provider calls remain inside Firebase Cloud Functions.

## AI Engine Architecture

Added the requested structure under `functions/src/ai/`:

- `gateway.ts`
- `modelRouter.ts`
- `promptEngine.ts`
- `safety.ts`
- `memory.ts`
- `schemas.ts`
- `agents/commandAgent.ts`
- `agents/mentorAgent.ts`
- `agents/plannerAgent.ts`
- `agents/reflectionAgent.ts`
- `agents/financeAgent.ts`
- `agents/securityAgent.ts`
- `agents/reportAgent.ts`
- `agents/interventionAgent.ts`

The gateway is now the standard internal path:

1. Accepts `userId`, agent type, and input.
2. Applies safety filtering.
3. Retrieves summarized user context.
4. Builds the agent prompt.
5. Routes to Gemini, OpenAI placeholder, or offline fallback.
6. Parses and validates structured output.
7. Logs minimal metadata only.

## Agents Created

Agents implemented:

- Command Agent
  - Daily Command Briefing.

- Mentor Agent
  - Mentor chat responses.

- Planner Agent
  - Goal breakdown.

- Reflection Agent
  - Reflection feedback.

- Finance Agent
  - Budget discipline interventions.

- Security Agent
  - Defensive security advice.

- Report Agent
  - Weekly report.

- Intervention Agent
  - Risk-based intervention suggestions.

## Prompt Strategy

Implemented in:

- `functions/src/ai/promptEngine.ts`

Prompt builders are centralized and agent-specific. They include:

- Task objective.
- Safe summarized memory.
- User input.
- Required JSON response shape.
- Shared safety system rules.

Prompt targets:

- Daily Command Briefing.
- Mentor Chat.
- Goal Breakdown.
- Reflection Feedback.
- Budget Discipline.
- Security Advice.
- Weekly Report.
- Intervention Generation.

## Memory Retrieval

Implemented in:

- `functions/src/ai/memory.ts`

Safe memory sources:

- Profile summary.
- Today's tasks.
- Active goals.
- Recent daily logs.
- Cortex risk state.
- Recent behavior events.
- Latest finance budget summary.
- Unresolved security summary.

Privacy/scope controls:

- Does not send entire collections.
- Limits document counts.
- Uses titles/statuses/scores/summaries instead of raw database dumps.
- Avoids secrets and credentials.

## Safety Rules

Implemented in:

- `functions/src/ai/safety.ts`

Safety coverage:

- Prompt injection warnings.
- Secret redaction patterns.
- No secret/system prompt disclosure.
- No medical diagnosis.
- No financial guarantees.
- No harmful cybersecurity instructions.
- Defensive security guidance only.
- Safe structured fallback if provider fails.

## Model Routing

Implemented in:

- `functions/src/ai/modelRouter.ts`

Providers:

- `gemini`
  - Uses the existing server-side Gemini helper.

- `openai`
  - Placeholder only.
  - Falls back offline when requested because no OpenAI provider is configured.

- `offline`
  - Returns deterministic fallback output.

The engine works when only Gemini is configured and still returns safe fallback output when no provider is available.

## Structured Responses

Implemented in:

- `functions/src/ai/schemas.ts`

Structured output types:

- `DailyBriefing`
- `MentorResponse`
- `GoalBreakdown`
- `ReflectionFeedback`
- `InterventionSuggestion`
- `WeeklyReport`

Validation:

- Gateway parses JSON through `safeParseJSON`.
- Output shape is checked per agent.
- Invalid/missing output falls back to deterministic safe defaults.

## Callable Cloud Functions

Added:

- `generateDailyBriefing`
- `generateWeeklyReport`
- `generateInterventions`
- `generateSecurityAdvice`

Improved to use gateway-backed agents:

- `chatWithMentor`
- `generateGoalBreakdown`
- `generateReflectionFeedback`
- `analyzeBudgetDiscipline`

Existing function names remain stable for mobile compatibility.

## Mobile Integration

Added mobile Firebase callable wrappers only:

- `apps/mobile/src/services/ai/command.ts`
- `apps/mobile/src/services/ai/reports.ts`
- `apps/mobile/src/services/ai/interventions.ts`
- `apps/mobile/src/services/ai/security.ts`

Updated:

- `apps/mobile/src/services/ai/index.ts`

Existing:

- `apps/mobile/src/services/ai/mentor.ts`

Important:

- No Gemini/OpenAI client SDK usage was added to mobile.
- No provider keys were added to mobile.
- Mobile calls Firebase Cloud Functions only.
- Mobile wrappers include clear offline fallback behavior when callable functions fail.

## Environment Variables Needed

Server-side only:

- `GEMINI_API_KEY`

Legacy Firebase config fallback still exists:

- `functions.config().google.api_key`

OpenAI:

- Not configured in this phase.
- The router has an OpenAI placeholder but intentionally falls back offline.

Do not add AI provider secrets to:

- `apps/mobile/.env`
- Expo public config.
- React Native source files.

## Files Changed

Functions:

- `functions/src/ai/gateway.ts`
- `functions/src/ai/modelRouter.ts`
- `functions/src/ai/promptEngine.ts`
- `functions/src/ai/safety.ts`
- `functions/src/ai/memory.ts`
- `functions/src/ai/schemas.ts`
- `functions/src/ai/index.ts`
- `functions/src/ai/agents/commandAgent.ts`
- `functions/src/ai/agents/mentorAgent.ts`
- `functions/src/ai/agents/plannerAgent.ts`
- `functions/src/ai/agents/reflectionAgent.ts`
- `functions/src/ai/agents/financeAgent.ts`
- `functions/src/ai/agents/securityAgent.ts`
- `functions/src/ai/agents/reportAgent.ts`
- `functions/src/ai/agents/interventionAgent.ts`
- `functions/src/aiCallables.ts`
- `functions/src/index.ts`
- `functions/src/chat.ts`
- `functions/src/goals.ts`
- `functions/src/reflections.ts`
- `functions/src/budget.ts`

Mobile:

- `apps/mobile/src/services/ai/command.ts`
- `apps/mobile/src/services/ai/reports.ts`
- `apps/mobile/src/services/ai/interventions.ts`
- `apps/mobile/src/services/ai/security.ts`
- `apps/mobile/src/services/ai/index.ts`

Documentation:

- `docs/ATLAS_PHASE_7_AI_ENGINE.md`

## Remaining Work

High priority:

- Add tests for each agent fallback and malformed JSON handling.
- Add stricter schema validation, preferably with a shared runtime validator.
- Add OpenAI provider implementation only if server-side credentials and policy are ready.
- Store structured AI reports/interventions in stable Firestore collections with security rules.
- Add usage accounting and stronger rate limits per agent.

Medium priority:

- Replace legacy direct prompt helper code completely after confidence in gateway behavior.
- Add UI integration for daily briefing and weekly report.
- Add admin observability for gateway metadata without logging raw prompts.
- Add evaluation fixtures for prompt quality.

Low priority:

- Add agent-specific model preferences.
- Add user-controlled memory scopes.
- Add cached memory snapshots for lower latency.

## Commands Run And Results

Passed:

```powershell
npm run build --workspace=functions
```

Result:

- Passed. Cloud Functions TypeScript build completed successfully.

Passed:

```powershell
npm run typecheck --workspace=apps/mobile
```

Result:

- Passed. Mobile TypeScript check completed successfully.

Passed:

```powershell
npm run typecheck --workspaces --if-present
```

Result:

- Passed. Mobile and legacy API TypeScript checks completed successfully.
