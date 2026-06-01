# Atlas AI Backend Strategy

Atlas AI is Firebase-first.

Production mobile data and AI flows should use:

- Firebase Auth for identity.
- Firestore for user-owned app data.
- Firebase Cloud Functions for paid AI calls, privileged writes, Cortex updates, and generated feedback.

`backend/api_legacy` is retained as a legacy/admin-experimental Express + MongoDB backend. It is useful for reference, portfolio review, or isolated backend experiments, but it must not be the production source of truth for the mobile app.

Rules for future work:

- Do not add new mobile dependencies on `backend/api_legacy`.
- Do not route production AI calls through public Express endpoints.
- Do not pass client-built trusted context into AI endpoints.
- Migrate useful legacy ideas into Firebase Functions before deleting legacy code.
