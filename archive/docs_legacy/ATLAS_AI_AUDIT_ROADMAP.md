# Atlas AI Audit, Architecture, and Roadmap

## Product Direction

Atlas AI is strongest as a personal operating system for discipline, productivity, financial awareness, digital safety, and AI-guided self-improvement. The highest-value positioning is not "another todo app"; it should be an AI command center that converts daily behavior into decisions, interventions, and measurable improvement.

## Current Architecture

- Mobile app: Expo Router, React Native, Firebase Auth, Firestore, Zustand, TanStack Query, React Native Reanimated.
- Serverless backend: Firebase Cloud Functions with Gemini-powered callable functions for mentor chat, goal breakdowns, reflections, budget analysis, and cortex state rebuilds.
- Database: Firestore under per-user subcollections, guarded by user-scoped security rules.
- Legacy backend: Express, MongoDB/Mongoose, JWT auth, Gemini/OpenAI config, rate limiting, validation middleware, and domain modules for auth, tasks, mentor, reflection, analytics.
- AI layer: Gemini model calls should run only through trusted backend/serverless code. The mobile app should never ship model provider keys.

## Major Findings

- Security: the mobile AI service previously included a direct client-side Gemini fallback with a hardcoded API key. This has been removed.
- Security: generated Firebase/emulator logs contained secrets and auth payloads. Generated logs should stay ignored and should not be committed.
- UX: several screens had mojibake/corrupted icon text from encoding damage. The main dashboard and tab bar now use stable text badges.
- UX: the welcome screen core/ring layout could drift or clip on browser/mobile viewports. The layout was tightened.
- Quality: TypeScript builds currently pass for mobile, functions, and the legacy API, but meaningful automated UI/business tests are mostly missing.
- Architecture: two backend paths exist. Firebase is the active production path; the Express API is legacy and should either be retired or re-scoped as an admin/enterprise API.
- Product: many modules exist, but several are isolated feature pages rather than a unified intelligence workflow.

## Work Completed In This Upgrade Pass

- Removed the client-side direct Gemini API call and hardcoded key from the mobile AI mentor service.
- Kept resilient AI behavior through authenticated API, public development API, Firebase callable function, and deterministic offline fallback.
- Added a premium News Briefing screen with topic filters, search, featured story, story cards, and save toggles.
- Added News to the dashboard Quick Actions and hidden protected route layout.
- Rebuilt the dashboard action grid to use stable text badges instead of corrupted symbols.
- Reworked the tab bar labels/icons to avoid encoding issues.
- Fixed shared animated button idle glow behavior.
- Removed negative letter spacing from progress ring numbers.
- Cleaned the legacy API startup banner.
- Removed sensitive generated Firebase/emulator logs that were not locked by the running dev server.

## Recommended Product Modules

1. AI Command Briefing: daily synthesized plan from tasks, goals, reflection history, budget pressure, health score, and security status.
2. Intervention Engine: detects risk patterns such as missed-task spirals, overspending, low energy, unsafe links, and repeated excuses.
3. Weekly Executive Report: AI-generated PDF/exportable progress report for discipline, money, health, and digital safety.
4. Cortex Timeline: a unified activity feed of decisions, completions, misses, AI advice, security events, and score changes.
5. Smart Automation Rules: "if I miss 2 workouts, schedule recovery plan"; "if budget exceeds 80%, lock discretionary spending alerts."
6. Focus Mode: active session timer, distraction logging, post-session AI review.
7. Privacy Dashboard: explain what data is stored, what AI receives, and allow export/delete.

## Monetization

- Free: local task, reflection, health, and basic dashboard.
- Pro: AI mentor, AI weekly reports, smart recommendations, advanced analytics, unlimited history.
- Premium: automation rules, security scans, financial intelligence, exportable reports.
- Enterprise/Teams: role-based dashboards, coaching cohorts, admin reports, privacy controls, and audit logs.

## Technical Roadmap

### Near Term
- Add Jest tests for auth validation, stores, data services, and utility scoring.
- Add Playwright or Detox flows for welcome, auth, dashboard, tasks, mentor, and news.
- Centralize navigation route constants.
- Create a shared screen header/back button component to remove repeated styles.
- Replace remaining corrupted comments/text in non-critical files.
- Add a Firebase emulator seed script for demo users and evaluator testing.

### Mid Term
- Consolidate Firebase Functions and Express API responsibilities.
- Add structured AI response schemas for recommendations and reports.
- Add Firestore indexes for analytics, expenses, health logs, and security scans based on actual query patterns.
- Implement an audit log collection for AI actions and security decisions.
- Add crash/error reporting hooks.

### Long Term
- Add subscription/paywall architecture.
- Add workspace/team support.
- Add data export and deletion workflows.
- Add server-side scheduled daily/weekly report generation.
- Add model provider abstraction so Gemini/OpenAI/local models can be swapped safely.

## Deployment Notes

- Mobile web: `npm run web --workspace=apps/mobile`
- Mobile typecheck: `npm run typecheck --workspace=apps/mobile`
- Functions build: `npm run build --workspace=functions`
- Legacy API typecheck: `npm run typecheck --workspace=backend/api_legacy`
- Firebase emulators: `firebase emulators:start`
- Functions deploy: `firebase deploy --only functions`

## Security Requirements Before Production

- Rotate any API keys that appeared in local logs or previous client bundles.
- Keep `.env`, `google-services.json`, Firebase runtime config, and log files out of source control.
- Remove or protect public `/api/chat` before production, or require auth and rate limits.
- Use Firebase App Check for production clients.
- Add server-side abuse detection for AI calls.
- Add privacy/retention policy for AI conversation and behavior history.
