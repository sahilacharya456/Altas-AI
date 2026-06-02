import { z } from 'zod';

jest.mock('../config/env', () => ({
  env: {
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
  },
}));

jest.mock('../utils/logger', () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

describe('Gemini service', () => {
  describe('generateGeminiText', () => {
    test('returns offline result when no API key is configured', async () => {
      const { generateGeminiText, hasGemini } = await import('../services/gemini');
      expect(hasGemini).toBe(false);

      const result = await generateGeminiText({
        systemInstruction: 'You are a test assistant.',
        prompt: 'Hello',
      });

      expect(result.provider).toBe('offline');
      expect(result.offline).toBe(true);
      expect(result.text).toBe('');
    });
  });

  describe('parseJsonFallback', () => {
    test('parses valid JSON object from raw text', async () => {
      const { parseJsonFallback } = await import('../services/gemini');
      const result = parseJsonFallback('Some text {"key": "value"} trailing', { key: 'default' });
      expect(result).toEqual({ key: 'value' });
    });

    test('parses valid JSON array from raw text', async () => {
      const { parseJsonFallback } = await import('../services/gemini');
      const result = parseJsonFallback('Here is [1, 2, 3] the data', [] as number[]);
      expect(result).toEqual([1, 2, 3]);
    });

    test('returns fallback for empty string', async () => {
      const { parseJsonFallback } = await import('../services/gemini');
      const result = parseJsonFallback('', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    test('returns fallback for malformed JSON', async () => {
      const { parseJsonFallback } = await import('../services/gemini');
      const result = parseJsonFallback('{ broken: json }', { ok: false });
      expect(result).toEqual({ ok: false });
    });

    test('returns fallback when no JSON-like structure exists', async () => {
      const { parseJsonFallback } = await import('../services/gemini');
      const result = parseJsonFallback('just plain text without braces', 'default');
      expect(result).toBe('default');
    });
  });

  describe('parseJsonWithSchema', () => {
    const testSchema = z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
    });

    test('parses valid JSON that matches schema', async () => {
      const { parseJsonWithSchema } = await import('../services/gemini');
      const result = parseJsonWithSchema('{"name": "test", "score": 85}', testSchema, { name: 'fallback', score: 0 });
      expect(result).toEqual({ name: 'test', score: 85 });
    });

    test('returns fallback when JSON is valid but fails schema validation', async () => {
      const { parseJsonWithSchema } = await import('../services/gemini');
      const result = parseJsonWithSchema('{"name": "test", "score": 200}', testSchema, { name: 'fallback', score: 0 });
      expect(result).toEqual({ name: 'fallback', score: 0 });
    });

    test('extracts JSON from surrounding text with braces', async () => {
      const { parseJsonWithSchema } = await import('../services/gemini');
      const raw = 'Here is the result: {"name": "extracted", "score": 42} -- end';
      const result = parseJsonWithSchema(raw, testSchema, { name: 'fallback', score: 0 });
      expect(result).toEqual({ name: 'extracted', score: 42 });
    });

    test('returns fallback for completely unparseable text', async () => {
      const { parseJsonWithSchema } = await import('../services/gemini');
      const result = parseJsonWithSchema('no json here at all', testSchema, { name: 'fallback', score: 0 });
      expect(result).toEqual({ name: 'fallback', score: 0 });
    });

    test('returns fallback for empty string', async () => {
      const { parseJsonWithSchema } = await import('../services/gemini');
      const result = parseJsonWithSchema('', testSchema, { name: 'fallback', score: 0 });
      expect(result).toEqual({ name: 'fallback', score: 0 });
    });

    test('handles nested JSON extraction when outer parse fails', async () => {
      const { parseJsonWithSchema } = await import('../services/gemini');
      const raw = '```json\n{"name": "nested", "score": 77}\n```';
      const result = parseJsonWithSchema(raw, testSchema, { name: 'fallback', score: 0 });
      expect(result).toEqual({ name: 'nested', score: 77 });
    });
  });
});
