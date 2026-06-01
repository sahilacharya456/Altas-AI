# AltasAI Generative AI

AltasAI does not use Gemini as the brain.

Internal flow:

```text
Firebase auth -> user context -> internal NLP/ML/RAG/recommendation/safety -> mentor/report plan -> optional Gemini wording enhancement
```

Gemini may:

- rewrite mentor responses
- summarize structured insights
- improve tone
- generate narrative from already-computed report fields

Gemini may not:

- be the only decision maker
- override safety rules
- invent user data
- replace internal model outputs

If Gemini is unavailable, AltasAI uses local templates and structured internal outputs.
