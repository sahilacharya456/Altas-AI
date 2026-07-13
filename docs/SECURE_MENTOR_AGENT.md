# Secure Mentor Agent

AltasAI Mentor is a project-scoped agent that can chat, analyze user context, and perform bounded automation for the authenticated user.

## Runtime Flow

1. Mobile calls `POST /api/mentor` with a Firebase ID token.
2. Backend verifies auth, CORS, App Check settings, and quota.
3. `projectScope` blocks unrelated prompts with: `sorry this is out of context for me`.
4. `retrieveSafeMemory` loads compact task, goal, reflection, focus, finance, health, digital, security, and behavior signals.
5. Internal AltasAI orchestration creates intent, risk, recommendations, and fallback response.
6. Gemini may improve wording only. It is not allowed to change labels, scores, safety constraints, or action policy.
7. `runSecureMentorAgent` builds allowlisted actions and executes only low-risk actions.

## Allowed Automatic Actions

- `create_task`: creates a task inside `users/{uid}/tasks`.
- `create_behavior_event`: records an internal mentor automation signal.
- `recommend_next_action`: returns advice only; no write.

## Blocked By Design

- No cross-user reads or writes.
- No deletion or cancellation automation.
- No external web/API actions from the mentor.
- No secrets in mobile code.
- No offensive cybersecurity help.
- No medical diagnosis or financial guarantees.
- No off-project answers.

## Current Security Posture

The agent is intentionally narrow. It can create useful execution tasks automatically, but higher-risk operations should remain explicit user actions until the app has approval UI, audit logs, and rollback controls.
