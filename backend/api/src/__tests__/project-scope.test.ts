import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../services/projectScope';

describe('project scope guard', () => {
  test('allows AltasAI project-domain messages', () => {
    expect(isProjectScopedInput('help me prioritize my tasks today')).toBe(true);
    expect(isProjectScopedInput('is this phishing link safe?')).toBe(true);
    expect(isProjectScopedInput('what should I do next?')).toBe(true);
  });

  test('blocks unrelated messages', () => {
    expect(isProjectScopedInput('write me a movie review')).toBe(false);
    expect(isProjectScopedInput('what is the weather today?')).toBe(false);
    expect(isProjectScopedInput('give me a pasta recipe')).toBe(false);
  });

  test('uses the required refusal text', () => {
    expect(OUT_OF_CONTEXT_RESPONSE).toBe('sorry this is out of context for me');
  });
});
