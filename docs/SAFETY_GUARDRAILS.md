# AltasAI Safety Guardrails

Safety runs before final responses.

Detected categories:

- allowed productivity request
- privacy-sensitive content
- medical boundary
- offensive cybersecurity
- crisis-like language
- unsupported certainty claims

The Python service exposes:

```bash
POST /predict/safety
```

The TypeScript backend also retains its own internal safety guardrail. The duplicated boundary is intentional: Python can improve classification while TypeScript keeps a local fallback if the ML service is unavailable.
