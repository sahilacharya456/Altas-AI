# AltasAI Monitoring

## Backend

- Structured JSON logs already include service, timestamp, request ID, method, path, status, and duration.
- `GET /health` returns service status, uptime, memory usage, architecture flags, and ML service reachability.
- `GET /health/ml` checks the Python ML service and returns `503` when unavailable.
- `GET /metrics` exposes Prometheus-style backend metrics.
- `GET /admin/stats` exposes a lightweight HTML runtime dashboard.
- `GET /admin/stats.json` exposes the same dashboard data as JSON.
- `ADMIN_METRICS_TOKEN` protects `/metrics`, `/admin/stats`, and `/admin/stats.json`; production without this token returns a configuration error instead of exposing admin data.
- Production should forward logs to Cloud Logging, Datadog, Sentry, or another log backend.
- The admin stats page should still be protected at the deployment edge before public launch, even with the backend token gate.

## ML Service

- `GET /health` returns ML service status and uptime.
- `GET /metrics` exposes Prometheus-style ML service availability and uptime metrics.
- `POST /recommend/reward` records reward feedback.
- `GET /recommend/rewards/{user_id}` returns stored reward state.
- `GET /recommend/export/{user_id}` exports reward rows for retraining analysis.

## Mobile

Recommended production setup:

- Sentry React Native for crashes and JS errors
- Expo Updates monitoring if EAS Updates is used
- Firebase Performance Monitoring if Firebase project policy allows it
- Analytics events for login, onboarding completion, task creation, focus start/complete, reflection submit, mentor prompt, report generation, and profile update

## AI Observability

Track:

- provider used: internal vs Gemini wording enhancer
- fallback rate
- latency
- safety label
- intent label
- recommendation IDs
- parse failures
- quota/rate-limit events
- Python ML service latency, fallback rate, model version, and evaluation drift

Do not log raw prompts, secrets, passwords, tokens, or private keys.

## Crash Reporting

Sentry or an equivalent provider is not configured because credentials are not present in this workspace. Production setup should add DSNs through environment variables only and verify source maps are uploaded securely.

## Honest Production Boundary

Monitoring primitives are implemented in the repo. Full production monitoring still requires deployment-level configuration: Sentry DSNs, log drains, uptime checks, alert routing, and access control for admin endpoints.
